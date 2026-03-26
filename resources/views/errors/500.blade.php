@extends('errors.layout')

@section('title', 'Error del servidor')

@section('body-class', 'err-page--danger')

@section('content')
    <p class="err-code">500</p>
    <h1>Algo salió mal</h1>
    <p class="err-desc">
        Ocurrió un error en el servidor. Ya fue registrado; intenta de nuevo en unos minutos. Si persiste, avisa al administrador.
    </p>
@endsection
