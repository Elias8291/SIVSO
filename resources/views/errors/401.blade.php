@extends('errors.layout')

@section('title', 'No autenticado')

@section('body-class', 'err-page--warn')

@section('content')
    <p class="err-code">401</p>
    <h1>Inicia sesión para continuar</h1>
    <p class="err-desc">
        Esta sección requiere una sesión activa. Usa el enlace inferior para acceder con tu cuenta.
    </p>
@endsection
