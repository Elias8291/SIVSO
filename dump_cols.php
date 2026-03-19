<?php
require 'vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;

$c_cols = Schema::connection('bas_vestuario')->getColumnListing('concentrado');
$p_cols = Schema::connection('bas_vestuario')->getColumnListing('propuesta');

file_put_contents('cols.json', json_encode([
    'concentrado' => $c_cols,
    'propuesta' => $p_cols,
], JSON_PRETTY_PRINT));
