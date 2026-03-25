<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>Acuse de vestuario — Folio {{ $folio }}</title>
    @include('pdf.partials.acuse-styles')
    <style>
        body { max-width: 820px; margin: 24px auto; padding: 0 16px 48px; }
        .verif-box {
            border-radius: 10px;
            padding: 12px 14px;
            margin-bottom: 18px;
            font-size: 13px;
            line-height: 1.45;
        }
        .verif-box strong { display: block; margin-bottom: 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
        .verif-ok { background: #ecfdf5; border: 1px solid #6ee7b7; color: #065f46; }
        .verif-bad { background: #fff7ed; border: 1px solid #fdba74; color: #9a3412; }
        .verif-neu { background: #f4f4f5; border: 1px solid #d4d4d8; color: #3f3f46; }
    </style>
</head>
<body>
    @if ($verificacion_ok === true)
        <div class="verif-box verif-ok">
            <strong>Verificación: válida</strong>
            {{ $verificacion_mensaje }}
        </div>
    @elseif ($verificacion_ok === false)
        <div class="verif-box verif-bad">
            <strong>Verificación: no coincide</strong>
            {{ $verificacion_mensaje }}
        </div>
    @else
        <div class="verif-box verif-neu">
            <strong>Verificación</strong>
            {{ $verificacion_mensaje }}
        </div>
    @endif

    @include('pdf.partials.acuse-body')
    <p style="margin-top:20px;font-size:10px;color:#666;text-align:center;">
        Constancia de consulta pública. El enlace caduca según la fecha firmada del sistema.
    </p>
</body>
</html>
