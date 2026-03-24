<?php

namespace App\Services;

use App\Models\Empleado;
use App\Models\Periodo;
use Endroid\QrCode\Builder\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;

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
                's.id', 's.cantidad', 's.anio',
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

    public function signedPublicConsultaUrl(int $empleadoId, int $anio): string
    {
        $ttlDays = (int) env('ACUSE_CONSULTA_URL_DAYS', 180);
        $ttlDays = max(1, min($ttlDays, 3650));

        return URL::temporarySignedRoute(
            'public.acuse-vestuario',
            now()->addDays($ttlDays),
            ['empleado' => $empleadoId, 'anio' => $anio]
        );
    }

    public function qrCodeDataUri(string $payload): string
    {
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

        $consultaUrl = $this->signedPublicConsultaUrl($emp->id, $anioDatos);

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
            'nombre_delegado' => $this->nombreDelegadoParaDelegacionId($emp->delegacion_id),
            'aviso_rectangulo' => 'NO SE RECIBIRÁ ESTE FORMATO SI PRESENTA TACHADURAS O ENMENDADURAS QUE NO ESTÉN EN UN RECTÁNGULO',
            'logo_data_uri' => $this->logoAcuseDataUri(),
            'qr_data_uri' => $this->qrCodeDataUri($consultaUrl),
            'consulta_publica_url' => $consultaUrl,
        ];
    }
}
