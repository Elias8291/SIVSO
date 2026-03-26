@extends('errors.layout')

@section('title', 'Acceso denegado')

@section('body-class', 'err-page--warn')

@section('content')
    <p class="err-code">403</p>
    <h1>No tienes permiso para ver esto</h1>
    <p class="err-desc">
        Si crees que es un error, inicia sesión con una cuenta autorizada o contacta al administrador del sistema.
    </p>
@endsection
