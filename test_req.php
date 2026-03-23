<?php
$user = App\Models\User::where('name', 'like', '%ADÁN FACHADA%')->first();
auth()->login($user);

$request = Illuminate\Http\Request::create('/api/empleados', 'GET', ['delegacion_clave' => '3B108', 'per_page' => 100]);
$response = app()->handle($request);

echo "Status: " . $response->getStatusCode() . "\n";
echo "Content: " . substr($response->getContent(), 0, 500) . "\n";
