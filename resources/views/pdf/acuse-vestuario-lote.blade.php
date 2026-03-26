<!DOCTYPE html>
<html lang="es">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    @include('pdf.partials.acuse-styles')
    <style>
        @page { margin: 22px 24px; }
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
            @include('pdf.partials.acuse-body', array_merge($acuse, [
                'logo_data_uri' => $logo_data_uri ?? ($acuse['logo_data_uri'] ?? null),
            ]))
        </div>
    @endforeach
</body>
</html>
