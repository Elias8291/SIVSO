<?php
try {
    $req = request()->merge(['anio' => 2026]);
    $c = app()->make(App\Http\Controllers\Api\PresupuestoController::class);
    $res = $c->index($req);
    echo "SUCCESS\n";
}
catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine() . "\n";
}
