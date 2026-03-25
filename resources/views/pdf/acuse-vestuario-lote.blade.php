<!DOCTYPE html>
<html lang="es">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    @include('pdf.partials.acuse-styles')
    <style>
        @page { margin: 26px 28px; }
        .acuse-hoja {
            page-break-after: always;
            page-break-inside: avoid;
        }
        .acuse-hoja:last-child {
            page-break-after: auto;
        }
    </style>
</head>
<body>
    @foreach ($acusets as $acuse)
        <div class="acuse-hoja">
            @include('pdf.partials.acuse-body', $acuse)
        </div>
    @endforeach
</body>
</html>
