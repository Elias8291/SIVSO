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
                'rfc'      => 'RAJE' . rand(100000, 999999),
                'nue'      => '0001',
                'password'  => Hash::make('password'),
                'activo'   => true,
            ]
        );

        $user->assignRole('admin');
    }
}
