<?php
$d = App\Models\Delegacion::where('clave', 'like', '%3B108%')->first();
echo '"' . $d->clave . '"';
