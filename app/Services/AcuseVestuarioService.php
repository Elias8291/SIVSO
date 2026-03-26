<?php

namespace App\Services;

use App\Models\Empleado;
use App\Models\Periodo;
use Endroid\QrCode\Builder\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use stdClass;

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
        $map = $this->getSeleccionesParaEmpleados([$empleadoId], $anio);

        return $map[$empleadoId] ?? collect();
    }

    /**
     * Una sola consulta para varios colaboradores (mismo año).
     *
     * @param  array<int>  $empleadoIds
     * @return array<int, Collection<int, array<string, mixed>>>
     */
    public function getSeleccionesParaEmpleados(array $empleadoIds, int $anio): array
    {
        if ($empleadoIds === []) {
            return [];
        }

        $rows = DB::table('selecciones AS s')
            ->join('producto_tallas AS pt', 'pt.id', '=', 's.producto_talla_id')
            ->join('productos AS p', 'p.id', '=', 'pt.producto_id')
            ->join('tallas AS t', 't.id', '=', 'pt.talla_id')
            ->leftJoin('producto_precios AS pp', function ($j) {
                $j->on('pp.producto_id', '=', 'p.id')->on('pp.anio', '=', 's.anio');
            })
            ->join('partidas AS pa', 'pa.id', '=', 'p.partida_id')
            ->whereIn('s.empleado_id', $empleadoIds)
            ->where('s.anio', $anio)
            ->select([
                's.empleado_id',
                's.id', 's.cantidad', 's.anio', 's.producto_talla_id',
                'p.id AS producto_id', 'p.descripcion', 'p.marca', 'p.unidad', 'p.medida',
                'pp.clave AS codigo', 'pp.precio_unitario',
                't.nombre AS talla', 't.id AS talla_id',
                'pa.numero AS partida',
            ])
            ->orderBy('s.empleado_id')
            ->orderBy('pa.numero')
            ->orderBy('p.descripcion')
            ->get();

        $grouped = [];
        foreach ($empleadoIds as $eid) {
            $grouped[(int) $eid] = collect();
        }
        foreach ($rows as $c) {
            $eid = (int) $c->empleado_id;
            if (! isset($grouped[$eid])) {
                $grouped[$eid] = collect();
            }
            $grouped[$eid]->push($this->mapSeleccionRow($c));
        }

        return $grouped;
    }

    /**
     * @return array<string, mixed>
     */
    private function mapSeleccionRow(stdClass $c): array
    {
        return [
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
        ];
    }

    /**
     * Misma lógica que {@see lineasAcuseParaEmpleado} sin $anioFijo, en lote (pocas consultas SQL).
     *
     * @param  array<int>  $empleadoIds
     * @return array<int, array{lineas: Collection<int, array<string, mixed>>, anio_datos: int}>
     */
    public function lineasAcuseParaVariosEmpleados(array $empleadoIds, ?int $anioSolicitado): array
    {
        if ($empleadoIds === []) {
            return [];
        }

        $anioVigente = $this->ejercicioVigenteAnio();
        $anio = $anioSolicitado ?? $anioVigente;
        $primera = $this->getSeleccionesParaEmpleados($empleadoIds, $anio);

        $result = [];
        $needFallback = [];

        foreach ($empleadoIds as $eid) {
            $eid = (int) $eid;
            $lineas = $primera[$eid] ?? collect();
            if ($lineas->isEmpty() && ($anioSolicitado === null || $anio === $anioVigente)) {
                $needFallback[] = $eid;
            } else {
                $result[$eid] = ['lineas' => $lineas, 'anio_datos' => $anio];
            }
        }

        if ($needFallback === []) {
            return $result;
        }

        $ultimos = DB::table('selecciones')
            ->whereIn('empleado_id', $needFallback)
            ->groupBy('empleado_id')
            ->selectRaw('empleado_id, MAX(anio) as max_anio')
            ->pluck('max_anio', 'empleado_id');

        $byAnio = [];
        foreach ($needFallback as $eid) {
            $u = $ultimos[$eid] ?? null;
            if ($u === null) {
                $result[$eid] = ['lineas' => collect(), 'anio_datos' => $anio];

                continue;
            }
            $y = (int) $u;
            if (! isset($byAnio[$y])) {
                $byAnio[$y] = [];
            }
            $byAnio[$y][] = $eid;
        }

        foreach ($byAnio as $anio2 => $eids) {
            $segunda = $this->getSeleccionesParaEmpleados($eids, $anio2);
            foreach ($eids as $eid) {
                $lineas = $segunda[$eid] ?? collect();
                $result[$eid] = ['lineas' => $lineas, 'anio_datos' => $anio2];
            }
        }

        return $result;
    }

    /**
     * Datasets para PDF lote: consultas agrupadas + logo y delegado una sola vez.
     *
     * @param  Collection<int, Empleado>  $empleados
     * @return array<int, array<string, mixed>>
     */
    public function datasetsParaPdfLote(Collection $empleados, ?int $anioQuery): array
    {
        $empleados = $empleados->values();
        if ($empleados->isEmpty()) {
            return [];
        }

        $empleados->loadMissing(['dependencia:id,clave,nombre', 'delegacion:id,clave']);

        $ids = $empleados->pluck('id')->map(fn ($id) => (int) $id)->all();
        $lineasPorId = $this->lineasAcuseParaVariosEmpleados($ids, $anioQuery);

        $first = $empleados->first();
        $delegacionClaveNorm = trim((string) ($first->delegacion?->clave ?? ''));
        $nombreDelegadoAcuse = $delegacionClaveNorm !== ''
            ? $this->nombreDelegadoParaDelegacionClave($delegacionClaveNorm)
            : $this->nombreDelegadoParaDelegacionId($first->delegacion_id);

        $out = [];
        foreach ($empleados as $emp) {
            $resolved = $lineasPorId[(int) $emp->id] ?? ['lineas' => collect(), 'anio_datos' => $anioQuery ?? $this->ejercicioVigenteAnio()];
            $out[] = $this->composeAcuseViewData(
                $emp,
                $resolved['lineas'],
                $resolved['anio_datos'],
                null,
                $nombreDelegadoAcuse,
                96,
                false
            );
        }

        return $out;
    }

    /**
     * @return array<string, mixed>
     */
    private function composeAcuseViewData(
        Empleado $emp,
        Collection $lineas,
        int $anioDatos,
        ?string $logoDataUri = null,
        ?string $nombreDelegadoPrecomputado = null,
        int $qrPixelSize = 132,
        bool $includeLogoDataUri = true
    ): array {
        $emp->loadMissing(['dependencia:id,clave,nombre', 'delegacion:id,clave']);
        $licitacion = env('ACUSE_LICITACION', 'LPN-SA-SA-0036-08/2025');
        $codigoUr = env('ACUSE_CODIGO_UR', $emp->delegacion?->clave ?? '—');

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

        $nombreDelegadoAcuse = $nombreDelegadoPrecomputado;
        if ($nombreDelegadoAcuse === null) {
            $delegacionClaveNorm = trim((string) ($emp->delegacion?->clave ?? ''));
            $nombreDelegadoAcuse = $delegacionClaveNorm !== ''
                ? $this->nombreDelegadoParaDelegacionClave($delegacionClaveNorm)
                : $this->nombreDelegadoParaDelegacionId($emp->delegacion_id);
        }

        $tokenIntegridad = $this->tokenIntegridad($emp->id, $anioDatos, $lineas);

        $consultaUrl = $this->signedPublicConsultaUrl($emp->id, $anioDatos, $tokenIntegridad);

        $logo = $includeLogoDataUri
            ? ($logoDataUri ?? $this->logoAcuseDataUri())
            : null;

        return [
            'anio_encabezado' => $anioDatos,
            'licitacion' => $licitacion,
            'codigo_ur' => $codigoUr,
            'folio' => $folio,
            'nombre_empleado' => strtoupper($emp->nombre_completo),
            'nue' => trim((string) ($emp->nue ?? '')),
            'secretaria_dependencia' => strtoupper(trim((string) ($emp->dependencia?->nombre ?? ''))),
            'rows' => $rows->all(),
            'total_piezas' => $totalPiezas,
            'nombre_delegado' => $nombreDelegadoAcuse,
            'aviso_rectangulo' => 'NO SE RECIBIRÁ ESTE FORMATO SI PRESENTA TACHADURAS O ENMENDADURAS.',
            'logo_data_uri' => $logo,
            'qr_data_uri' => $this->qrCodeDataUri($consultaUrl, $qrPixelSize),
            'consulta_publica_url' => $consultaUrl,
            'verificacion_ok' => null,
            'verificacion_mensaje' => null,
        ];
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
        $desc = trim((string) ($row['descripcion'] ?? ''));
        $desc = (string) (preg_replace('/\s*[.;,]?\s*SEG[ÚU]N\s+MUESTRA\b.*$/ius', '', $desc) ?? $desc);
        $desc = trim((string) preg_replace('/\s+/', ' ', $desc));

        $partes = [$desc];
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

    /**
     * Delegado asignado a la delegación en el padrón (tabla delegados + delegado_delegacion),
     * no el nombre de la cuenta de usuario. Varias filas: se toma la de menor delegado_id.
     */
    public function nombreDelegadoParaDelegacionId(?int $delegacionId): string
    {
        if (! $delegacionId) {
            return '—';
        }

        $row = DB::table('delegado_delegacion AS dd')
            ->join('delegados AS d', 'd.id', '=', 'dd.delegado_id')
            ->where('dd.delegacion_id', $delegacionId)
            ->orderBy('dd.delegado_id')
            ->select(['d.nombre'])
            ->first();

        if (! $row) {
            return '—';
        }

        $nombre = strtoupper(trim((string) ($row->nombre ?? '')));

        return $nombre !== '' ? $nombre : '—';
    }

    /** Resolución explícita por clave de delegación (misma lógica que por id). */
    public function nombreDelegadoParaDelegacionClave(?string $claveDelegacion): string
    {
        $clave = trim((string) ($claveDelegacion));
        if ($clave === '') {
            return '—';
        }

        $delegacionId = DB::table('delegaciones')->where('clave', $clave)->value('id');
        if (! $delegacionId) {
            return '—';
        }

        return $this->nombreDelegadoParaDelegacionId((int) $delegacionId);
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
    public function qrCodeDataUri(string $payload, int $size = 132): ?string
    {
        if (! class_exists(Builder::class)) {
            return null;
        }

        $size = max(64, min($size, 200));

        $result = (new Builder)->build(
            data: $payload,
            size: $size,
            margin: 3,
        );

        return $result->getDataUri();
    }

    /**
     * @return array<string, mixed>
     */
    public function datasetFor(Empleado $emp, ?int $anioQuery, bool $anioFijo = false): array
    {
        $resolved = $this->lineasAcuseParaEmpleado($emp, $anioQuery, $anioFijo);

        return $this->composeAcuseViewData($emp, $resolved['lineas'], $resolved['anio_datos']);
    }
}
