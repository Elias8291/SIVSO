<?php
$delClave = '3B108';
$query = App\Models\Empleado::query();
if ($delClave) {
    $query->whereHas('delegacion', fn ($q) => $q->where('clave', $delClave));
}
echo "Count: " . $query->count() . "\n";

$query2 = App\Models\Empleado::whereHas('delegacion', function($q) use($delClave) {
    $q->where('clave', $delClave);
});
echo "Count 2: " . $query2->count() . "\n";

$del = App\Models\Delegacion::where('clave', '3B108')->first();
if ($del) {
    echo "Delegacion ID: " . $del->id . "\n";
    echo "Count by ID: " . App\Models\Empleado::where('delegacion_id', $del->id)->count() . "\n";
} else {
    echo "Delegacion not found\n";
}
