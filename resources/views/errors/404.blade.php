@extends('errors.layout')

@section('title', 'Página no encontrada')

@section('content')
    <p class="err-code">404</p>
    <h1>No encontramos esta página</h1>
    <p class="err-desc">
        La dirección puede estar mal escrita o el contenido ya no existe. Comprueba la URL o vuelve al inicio.
    </p>
@endsection
