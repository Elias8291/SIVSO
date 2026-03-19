<?php
// Look for ALGOD?N or similar text.
$res = DB::table('productos')->where('descripcion', 'like', '%ALGOD%')->first();
if (!$res) {
    echo "No product found with ALGOD\n";
}
else {
    echo "DESC: " . $res->descripcion . "\n";
    echo "HEX: " . bin2hex($res->descripcion) . "\n";
}
