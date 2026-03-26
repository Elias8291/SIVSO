@extends('errors.layout')

@section('title', 'Servicio no disponible')

@section('body-class', 'err-page--warn')

@section('content')
    <p class="err-code">503</p>
    <h1>En mantenimiento o no disponible</h1>
    <p class="err-desc">
        El servicio no está disponible por ahora. Vuelve a intentar en unos minutos.
    </p>
@endsection
