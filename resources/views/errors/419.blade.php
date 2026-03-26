@extends('errors.layout')

@section('title', 'Sesión expirada')

@section('body-class', 'err-page--warn')

@section('content')
    <p class="err-code">419</p>
    <h1>La sesión expiró</h1>
    <p class="err-desc">
        Por seguridad, el formulario ya no es válido. Vuelve atrás, actualiza la página e inténtalo de nuevo.
    </p>
@endsection
