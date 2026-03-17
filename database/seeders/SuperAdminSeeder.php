<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $role = Role::firstOrCreate(
            ['name' => 'superadmin', 'guard_name' => 'web']
        );

        $user = User::updateOrCreate(
            ['rfc' => 'RAJE020226G97'],
            [
                'name'     => 'Elias Abisai Ramos Jacinto',
                'rfc'      => 'RAJE020226G97',
                'email'    => 'abis71562@gmail.com',
                'password' => Hash::make('Angel1789'),
                'activo'   => true,
            ]
        );

        // Asigna el rol superadmin al usuario en model_has_roles
        \DB::table('model_has_roles')->updateOrInsert(
            [
                'role_id'    => $role->id,
                'model_type' => User::class,
                'model_id'   => $user->id,
            ]
        );

        $this->command->info("Superusuario creado: {$user->name} ({$user->rfc})");
    }
}
