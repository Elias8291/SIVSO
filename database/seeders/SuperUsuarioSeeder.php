<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperUsuarioSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'elias@sivso.gob.mx'],
            [
                'name'     => 'Elias Abisai Ramos Jacinto',
                'rfc'      => 'RAJE020226G97',
                'nue'      => 'null',
                'password'  => Hash::make('Abisai1789'),
                'activo'   => true,
            ]
        );

        $user->assignRole('admin');
    }
}
