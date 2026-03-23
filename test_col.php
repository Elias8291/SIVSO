<?php
$paginated = App\Models\Empleado::paginate(100);
$data = collect($paginated->items())->map(fn ($e) => ['id' => $e->id]);
echo get_class($data) . "\n";
echo json_encode($data) . "\n";
