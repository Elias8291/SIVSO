<table class="cabecera-acuse" cellspacing="0" cellpadding="0">
    <tr>
        <td colspan="3" class="celda-aviso">
            <div class="warn">{{ $aviso_rectangulo }}</div>
        </td>
    </tr>
    <tr>
        <td width="26%" style="padding-right:8px;">
            @if (! empty($logo_data_uri))
                <img src="{{ $logo_data_uri }}" alt="" style="display:block;max-width:100%;height:auto;max-height:92px;"/>
            @endif
        </td>
        <td width="48%" align="center" style="padding-left:4px;padding-right:4px;">
            <div class="center title-main">Secretaría de Previsión Social</div>
            <div class="center title-sub">
                Acuse de recibo de vestuario, calzado y accesorios de vestuario {{ $anio_encabezado }}
            </div>
            <div class="center title-sub">Licitación: {{ $licitacion }}</div>
            <div class="center title-sub">{{ $codigo_ur }}</div>
        </td>
        <td width="26%" align="right" style="padding-left:8px;">
            @if (! empty($qr_data_uri))
                <img src="{{ $qr_data_uri }}" alt="Código QR" style="display:block;width:92px;height:92px;margin-left:auto;"/>
            @endif
        </td>
    </tr>
</table>
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
            <th style="width:5%">No.</th>
            <th style="width:79%">Descripción</th>
            <th style="width:8%">Talla</th>
            <th style="width:8%">Cant.</th>
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

<div class="firmas-wrap">
    <table class="firmas-table">
        <tr>
            <td>
                <div class="firma-linea"></div>
                <p class="firma-nombre">{{ $nombre_empleado }}</p>
                <p class="firma-rol">Recibí de conformidad</p>
            </td>
            <td class="mid"></td>
            <td>
                <div class="firma-linea"></div>
                <p class="firma-nombre">{{ $nombre_delegado }}</p>
                <p class="firma-rol">Delegado(a)</p>
            </td>
        </tr>
    </table>
</div>
