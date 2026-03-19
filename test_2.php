<?php
try {
    $req = request()->merge(['anio' => 2026]);
    $c = app()->make(App\Http\Controllers\Api\PresupuestoController::class);
    $res = $c->index($req);
    file_put_contents('api_error.txt', "SUCCESS\n" . json_encode($res->getData()));
}
catch (\Throwable $e) {
    file_put_contents('api_error.txt', "ERROR: " . $e->getMessage() . "\n" . $e->getTraceAsString());
}
