<?php
$role = Spatie\Permission\Models\Role::where('name', 'delegado')->first();
echo json_encode($role->permissions->pluck('name'));
