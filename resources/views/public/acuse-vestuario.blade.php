<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>Acuse de vestuario — Folio {{ $folio }}</title>
    @include('pdf.partials.acuse-styles')
    <style>
        body { max-width: 820px; margin: 24px auto; padding: 0 16px 48px; }
    </style>
</head>
<body>
    @include('pdf.partials.acuse-body')
    <p style="margin-top:20px;font-size:10px;color:#666;text-align:center;">
        Constancia de consulta pública. El enlace caduca según la fecha firmada del sistema.
    </p>
</body>
</html>
