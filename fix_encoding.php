<?php
$malformed = App\Models\Producto::where('descripcion', 'like', '%?%')->get();
$fixes = 0;
foreach ($malformed as $p) {
    if (preg_match('/[A-Z]\?[A-Z]/', $p->descripcion)) {
        $desc = str_replace(
        ['ALGOD?N', 'POLI?STER', 'SINT?TICO', 'MET?LICO', 'MET?LICOS', 'ATR?S', 'SEG?N', 'COMPOSICI?N', 'PANTAL?N', 'ART?CULO', 'PL?STICO', 'BOT?N', 'EL?STICO'],
        ['ALGODÓN', 'POLIÉSTER', 'SINTÉTICO', 'METÁLICO', 'METÁLICOS', 'ATRÁS', 'SEGÚN', 'COMPOSICIÓN', 'PANTALÓN', 'ARTÍCULO', 'PLÁSTICO', 'BOTÓN', 'ELÁSTICO'],
            $p->descripcion
        );
        if ($desc !== $p->descripcion) {
            $p->descripcion = $desc;
            $p->save();
            $fixes++;
            echo "Fixed to: " . $p->descripcion . "\n";
        }
    }
}
echo "Total fixed: $fixes\n";
