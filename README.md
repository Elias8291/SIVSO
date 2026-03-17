# SIVSO - Sistema Integral de Vestuario Sindicato de Oaxaca

Proyecto Laravel + React para el control de suministros del sindicato.

## Estructura del Proyecto

```
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── AuthController.php    # Login, logout, cambiar contraseña
│   │   └── Middleware/
│   │       └── EnsurePasswordChanged.php  # Redirige si debe cambiar contraseña
│   └── Models/
│       └── User.php                  # Usuario con RFC
├── resources/
│   ├── views/
│   │   ├── auth/
│   │   │   ├── login.blade.php       # Vista login (RFC + contraseña)
│   │   │   └── cambiar-contrasena.blade.php
│   │   └── dashboard.blade.php       # Contenedor del React dashboard
│   └── js/
│       ├── components/
│       │   └── DashboardSIVSO.jsx     # Dashboard React
│       └── dashboard.jsx             # Entry point del dashboard
├── routes/
│   └── web.php
└── database/
    └── migrations/
        └── *_add_rfc_to_users_table.php
```

## Configuración de Base de Datos

### Opción 1: SQLite (más simple)

1. Habilita la extensión SQLite en `php.ini`:
   ```ini
   extension=pdo_sqlite
   extension=sqlite3
   ```
2. Reinicia el servidor PHP/Apache si aplica.

### Opción 2: MySQL

1. Crea la base de datos:
   ```sql
   CREATE DATABASE sivso;
   ```
2. Edita `.env`:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=sivso
   DB_USERNAME=root
   DB_PASSWORD=tu_contraseña
   ```

## Instalación

```bash
# 1. Instalar dependencias PHP
composer install

# 2. Instalar dependencias Node (React, Tailwind, lucide-react)
npm install

# 3. Migraciones
php artisan migrate

# 4. Crear usuario admin
php artisan db:seed --class=UserSeeder
```

**Credenciales por defecto:**
- **RFC:** `ADMIN001`
- **Contraseña:** `password`
- **Email:** `admin@sivso.gob`

## Ejecutar el Proyecto

```bash
# Terminal 1: Servidor Laravel
php artisan serve

# Terminal 2: Vite (assets React + Tailwind)
npm run dev
```

Abre: http://localhost:8000

## Flujo de Autenticación

1. **Login** (`/login`): RFC + contraseña
2. **Cambiar contraseña** (`/cambiar-contrasena`): Si `must_change_password` es true, se redirige aquí
3. **Dashboard** (`/dashboard`): Panel React con KPIs, tabla de actividad

## Imagen de Login

Coloca tu imagen `oficialLogin.jpg` en `public/images/` para el fondo del login.
