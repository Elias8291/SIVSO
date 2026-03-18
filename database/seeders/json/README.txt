Pega aquí los archivos JSON o CSV para los seeders.

Archivos esperados (.json o .csv):
- dependences
- proveedor
- delegacion
- delegado
- propuesta
- concentrado

Formatos soportados:
- JSON: array de objetos
- JSONL: un objeto JSON por línea
- CSV: delimitador ; o ,

Ejecutar: php artisan db:seed --class=BasVestuarioJsonSeeder
