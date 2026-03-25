<?php

namespace App\Services;

use App\Models\Empleado;
use App\Models\Periodo;
use Endroid\QrCode\Builder\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class AcuseVestuarioService
{
    public function ejercicioVigenteAnio(): int
    {
        $periodo = Periodo::where('estado', 'abierto')->orderByDesc('anio')->first();

        return $periodo ? (int) $periodo->anio : (int) date('Y');
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function getSelecciones(int $empleadoId, int $anio): Collection
    {
        return DB::table('selecciones AS s')
            ->join('producto_tallas AS pt', 'pt.id', '=', 's.producto_talla_id')
            ->join('productos AS p', 'p.id', '=', 'pt.producto_id')
            ->join('tallas AS t', 't.id', '=', 'pt.talla_id')
            ->leftJoin('producto_precios AS pp', function ($j) {
                $j->on('pp.producto_id', '=', 'p.id')->on('pp.anio', '=', 's.anio');
            })
            ->join('partidas AS pa', 'pa.id', '=', 'p.partida_id')
            ->where('s.empleado_id', $empleadoId)
            ->where('s.anio', $anio)
            ->select([
                's.id', 's.cantidad', 's.anio', 's.producto_talla_id',
                'p.id AS producto_id', 'p.descripcion', 'p.marca', 'p.unidad', 'p.medida',
                'pp.clave AS codigo', 'pp.precio_unitario',
                't.nombre AS talla', 't.id AS talla_id',
                'pa.numero AS partida',
            ])
            ->orderBy('pa.numero')
            ->orderBy('p.descripcion')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'producto_talla_id' => (int) $c->producto_talla_id,
                'producto_id' => $c->producto_id,
                'anio' => (int) $c->anio,
                'cantidad' => (int) $c->cantidad,
                'talla' => $c->talla,
                'talla_id' => $c->talla_id,
                'codigo' => $c->codigo,
                'descripcion' => $c->descripcion,
                'marca' => $c->marca,
                'unidad' => $c->unidad,
                'medida' => $c->medida,
                'partida' => $c->partida,
            ]);
    }

    /**
     * @return array{lineas: Collection<int, array<string, mixed>>, anio_datos: int}
     */
    public function lineasAcuseParaEmpleado(Empleado $emp, ?int $anioSolicitado, bool $anioFijo = false): array
    {
        if ($anioFijo) {
            $anio = $anioSolicitado ?? $this->ejercicioVigenteAnio();

            return [
                'lineas' => $this->getSelecciones($emp->id, $anio),
                'anio_datos' => $anio,
            ];
        }

        $anioVigente = $this->ejercicioVigenteAnio();
        $anio = $anioSolicitado ?? $anioVigente;
        $lineas = $this->getSelecciones($emp->id, $anio);
        if ($lineas->isEmpty() && ($anioSolicitado === null || $anio === $anioVigente)) {
            $ultimo = DB::table('selecciones')->where('empleado_id', $emp->id)->max('anio');
            if ($ultimo !== null) {
                $anio = (int) $ultimo;
                $lineas = $this->getSelecciones($emp->id, $anio);
            }
        }

        return ['lineas' => $lineas, 'anio_datos' => $anio];
    }

    public function textoDescripcionLinea(array $row): string
    {
        $partes = [trim((string) ($row['descripcion'] ?? ''))];
        $marca = trim((string) ($row['marca'] ?? ''));
        $codigo = trim((string) ($row['codigo'] ?? ''));
        if ($marca !== '') {
            $partes[] = 'MARCA '.$marca.'.';
        }
        if ($codigo !== '') {
            $partes[] = 'CÓDIGO '.$codigo.'.';
        }

        return trim(implode(' ', array_filter($partes)));
    }

    public function nombreDelegadoParaDelegacionId(?int $delegacionId): string
    {
        if (! $delegacionId) {
            return '—';
        }

        $row = DB::table('delegado_delegacion AS dd')
            ->join('delegados AS d', 'd.id', '=', 'dd.delegado_id')
            ->leftJoin('users AS u', 'u.id', '=', 'd.user_id')
            ->where('dd.delegacion_id', $delegacionId)
            ->orderBy('dd.delegado_id')
            ->select(['d.nombre AS catalogo', 'u.name AS usuario'])
            ->first();

        if (! $row) {
            return '—';
        }

        $catalogo = strtoupper(trim((string) ($row->catalogo ?? '')));
        $usuario = strtoupper(trim((string) ($row->usuario ?? '')));
        if ($usuario !== '') {
            return $usuario;
        }
        if ($catalogo !== '') {
            return $catalogo;
        }

        return '—';
    }

    public function logoAcuseDataUri(): ?string
    {
        $path = public_path('images/acuse-logo.png');
        if (! is_readable($path)) {
            return null;
        }

        $raw = @file_get_contents($path);
        if ($raw === false) {
            return null;
        }

        return 'data:image/png;base64,'.base64_encode($raw);
    }

    /**
     * Cadena estable de las líneas del acuse (selección, talla, cantidad) para HMAC.
     *
     * @param  Collection<int, array<string, mixed>>  $lineas
     */
    public function canonicalPayloadIntegridad(int $empleadoId, int $anio, Collection $lineas): string
    {
        $sorted = $lineas->sortBy(fn (array $r) => (int) ($r['id'] ?? 0))->values();
        $bloques = $sorted->map(function (array $r) {
            return implode('|', [
                (int) ($r['id'] ?? 0),
                (int) ($r['producto_talla_id'] ?? 0),
                (int) ($r['cantidad'] ?? 0),
            ]);
        })->implode(';');

        return 'e'.$empleadoId.';y'.$anio.';'.($bloques === '' ? '_' : $bloques);
    }

    /**
     * Token hexadecimal (32 caracteres) que amarra productos/cantidades al momento de emitir el acuse.
     *
     * @param  Collection<int, array<string, mixed>>  $lineas
     */
    public function tokenIntegridad(int $empleadoId, int $anio, Collection $lineas): string
    {
        $payload = $this->canonicalPayloadIntegridad($empleadoId, $anio, $lineas);
        $secret = $this->hmacSecretForAcuse();
        $bin = hash_hmac('sha256', $payload, $secret, true);

        return substr(bin2hex($bin), 0, 32);
    }

    /** Recalcula el token con lo que hay hoy en BD (mismo año). */
    public function tokenIntegridadActualEnBd(int $empleadoId, int $anio): string
    {
        $lineas = $this->getSelecciones($empleadoId, $anio);

        return $this->tokenIntegridad($empleadoId, $anio, $lineas);
    }

    /**
     * Clave pública corta para cotejar de un vistazo papel vs. pantalla (mismas líneas = misma clave).
     * Resume artículo (vía selección/talla en sistema) y cantidades; no usa APP_KEY.
     *
     * @param  Collection<int, array<string, mixed>>  $lineas
     */
    public function claveResumenVestuario(int $empleadoId, int $anio, Collection $lineas): string
    {
        $payload = $this->canonicalPayloadIntegridad($empleadoId, $anio, $lineas);
        $hex = substr(hash('sha256', 'SIVSO-KRV1|'.$payload), 0, 16);

        return strtoupper(collect(str_split($hex, 4))->implode('-'));
    }

    private function hmacSecretForAcuse(): string
    {
        $k = (string) config('app.key', '');
        if ($k === '') {
            return 'sivso-acuse-insecure';
        }
        if (Str::startsWith($k, 'base64:')) {
            $raw = base64_decode(substr($k, 7), true);

            return (is_string($raw) && $raw !== '') ? $raw : $k;
        }

        return $k;
    }

    public function signedPublicConsultaUrl(int $empleadoId, int $anio, string $tokenIntegridad): string
    {
        $ttlDays = (int) env('ACUSE_CONSULTA_URL_DAYS', 180);
        $ttlDays = max(1, min($ttlDays, 3650));

        return URL::temporarySignedRoute(
            'public.acuse-vestuario',
            now()->addDays($ttlDays),
            [
                'empleado' => $empleadoId,
                'anio' => $anio,
                'v' => $tokenIntegridad,
            ]
        );
    }

    /**
     * Requiere `endroid/qr-code` instalado vía Composer (`composer install` en el servidor).
     * Si la clase no existe, devuelve null y el PDF se genera sin QR (evita error 500).
     */
    public function qrCodeDataUri(string $payload): ?string
    {
        if (! class_exists(Builder::class)) {
            return null;
        }

        $result = (new Builder)->build(
            data: $payload,
            size: 132,
            margin: 4,
        );

        return $result->getDataUri();
    }

    /**
     * @return array<string, mixed>
     */
    public function datasetFor(Empleado $emp, ?int $anioQuery, bool $anioFijo = false): array
    {
        $emp->loadMissing(['dependencia:id,clave,nombre', 'delegacion:id,clave']);
        $licitacion = env('ACUSE_LICITACION', 'LPN-SA-SA-0036-08/2025');
        $codigoUr = env('ACUSE_CODIGO_UR', $emp->delegacion?->clave ?? '—');

        $resolved = $this->lineasAcuseParaEmpleado($emp, $anioQuery, $anioFijo);
        $lineas = $resolved['lineas'];
        $anioDatos = $resolved['anio_datos'];

        $rows = $lineas->values()->map(function (array $row, int $idx) {
            return [
                'num' => $idx + 1,
                'descripcion' => $this->textoDescripcionLinea($row),
                'talla' => (string) ($row['talla'] ?? '—'),
                'cantidad' => (int) ($row['cantidad'] ?? 0),
            ];
        });

        $totalPiezas = (int) $rows->sum('cantidad');
        $claveDel = strtoupper(trim((string) ($emp->delegacion?->clave ?? 'X')));
        $folio = $claveDel.'-'.$emp->id;

        $tokenIntegridad = $this->tokenIntegridad($emp->id, $anioDatos, $lineas);
        $claveResumenVestuario = $this->claveResumenVestuario($emp->id, $anioDatos, $lineas);

        $consultaUrl = $this->signedPublicConsultaUrl($emp->id, $anioDatos, $tokenIntegridad);

        return [
            'anio_encabezado' => $anioDatos,
            'licitacion' => $licitacion,
            'codigo_ur' => $codigoUr,
            'folio' => $folio,
            'nombre_empleado' => strtoupper($emp->nombre_completo),
            'nue' => trim((string) ($emp->nue ?? '')),
            'secretaria_dependencia' => strtoupper(trim((string) ($emp->dependencia?->nombre ?? ''))),
            'clave_resumen_vestuario' => $claveResumenVestuario,
            'rows' => $rows->all(),
            'total_piezas' => $totalPiezas,
            'nombre_delegado' => $this->nombreDelegadoParaDelegacionId($emp->delegacion_id),
            'aviso_rectangulo' => 'NO SE RECIBIRÁ ESTE FORMATO SI PRESENTA TACHADURAS O ENMENDADURAS.',
            'logo_data_uri' => $this->logoAcuseDataUri(),
            'qr_data_uri' => $this->qrCodeDataUri($consultaUrl),
            'consulta_publica_url' => $consultaUrl,
            'verificacion_ok' => null,
            'verificacion_mensaje' => null,
        ];
    }
}
