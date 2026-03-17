<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['rfc' => 'ADMIN001'],
            [
                'name'     => 'Admin Oaxaca',
                'email'    => 'admin@sivso.gob',
                'rfc'      => 'ADMIN001',
                'password' => Hash::make('password'),
                'activo'   => true,
            ]
        );
    }
}
