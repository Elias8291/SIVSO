<!DOCTYPE html>
<html lang="es">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <style>
        @page { margin: 28px 32px; }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 9px;
            color: #111;
            line-height: 1.35;
        }
        .center { text-align: center; }
        .title-main {
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 6px 0 2px;
        }
        .title-sub {
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 2px 0;
        }
        .warn {
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 8px 0 10px;
            border: 1px solid #333;
            padding: 4px 6px;
        }
        .folio {
            font-size: 9px;
            font-weight: bold;
            margin-bottom: 12px;
        }
        .datos {
            width: 100%;
            margin-bottom: 14px;
            border-collapse: collapse;
        }
        .datos td {
            padding: 4px 0;
            vertical-align: top;
            font-size: 9px;
        }
        .datos .k {
            font-weight: bold;
            width: 28%;
            text-transform: uppercase;
        }
        table.items {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
        }
        table.items th {
            border: 1px solid #222;
            padding: 5px 4px;
            background: #e8e8e8;
            text-transform: uppercase;
            font-weight: bold;
        }
        table.items td {
            border: 1px solid #333;
            padding: 4px;
            vertical-align: top;
        }
        table.items td.desc {
            word-wrap: break-word;
            max-width: 0;
        }
        table.items td.num, table.items td.talla, table.items td.cant {
            text-align: center;
            white-space: nowrap;
        }
        .total-row td {
            font-weight: bold;
            border: 1px solid #222;
            padding: 5px 4px;
        }
        .pie-anio {
            margin-top: 10px;
            font-size: 8px;
            color: #444;
        }
    </style>
</head>
<body>
    <div class="center title-main">Secretaría de Previsión Social</div>
    <div class="center title-sub">
        Acuse de recibo de vestuario, calzado y accesorios de vestuario {{ $anio_encabezado }}
    </div>
    <div class="center title-sub">Licitación: {{ $licitacion }}</div>
    <div class="center title-sub">{{ $codigo_ur }}</div>
    <div class="center warn">No se recibirá este formato si presenta tachaduras o enmendaduras</div>
    <div class="center folio">Folio {{ $folio }}</div>

    <table class="datos">
        <tr>
            <td class="k">Nombre</td>
            <td>{{ $nombre_empleado }}</td>
        </tr>
        <tr>
            <td class="k">NUE</td>
            <td>{{ $nue !== '' ? $nue : '—' }}</td>
        </tr>
        <tr>
            <td class="k">Secretaría / Dependencia</td>
            <td>{{ $secretaria_dependencia !== '' ? $secretaria_dependencia : '—' }}</td>
        </tr>
    </table>

    <table class="items">
        <thead>
            <tr>
                <th style="width:6%">No.</th>
                <th style="width:64%">Descripción</th>
                <th style="width:12%">Talla</th>
                <th style="width:10%">Cant.</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $r)
                <tr>
                    <td class="num">{{ $r['num'] }}</td>
                    <td class="desc">{{ $r['descripcion'] }}</td>
                    <td class="talla">{{ $r['talla'] }}</td>
                    <td class="cant">{{ $r['cantidad'] }}</td>
                </tr>
            @empty
                <tr>
                    <td class="num">—</td>
                    <td class="desc">Sin partidas registradas para el ejercicio en el sistema.</td>
                    <td class="talla">—</td>
                    <td class="cant">0</td>
                </tr>
            @endforelse
            <tr class="total-row">
                <td colspan="3" style="text-align:right;">Total (piezas)</td>
                <td class="cant">{{ $total_piezas }}</td>
            </tr>
        </tbody>
    </table>

    <p class="pie-anio">Ejercicio de los datos: {{ $anio_encabezado }}</p>
</body>
</html>
