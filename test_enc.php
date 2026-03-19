<?php
try {
    $res = App\Models\Producto::where('descripcion', 'like', '%ALGOD%')->first();
    if ($res) {
        file_put_contents('enc_out.txt', "DESC: " . $res->descripcion . "\nHEX: " . bin2hex($res->descripcion));
    }
    else {
        file_put_contents('enc_out.txt', "NOT FOUND");
    }
}
catch (\Throwable $e) {
    file_put_contents('enc_out.txt', $e->getMessage());
}
