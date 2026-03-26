@extends('errors.layout')

@section('title', 'Demasiadas solicitudes')

@section('body-class', 'err-page--warn')

@section('content')
    <p class="err-code">429</p>
    <h1>Demasiados intentos</h1>
    <p class="err-desc">
        Espera un momento e inténtalo de nuevo. Si el problema continúa, contacta al soporte.
    </p>
@endsection
