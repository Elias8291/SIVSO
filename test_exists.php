<?php
$anioActual = DB::table('selecciones')->max('anio') ?? date('Y');
$e = App\Models\Empleado::withExists(['selecciones as actualizado' => fn($q) => $q->where('anio', $anioActual)])->first();
echo json_encode(['id' => $e->id, 'actualizado' => $e->actualizado]);
