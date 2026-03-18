# Cómo depurar 500 en Hostinger (SSH)

## Solución rápida: Session y Cache por archivo

Si no has corrido migraciones, session/cache en "database" falla. En `.env` del servidor pon:

```
SESSION_DRIVER=file
CACHE_STORE=file
```

Luego:
```bash
php artisan config:clear
```

## Comandos de depuración

```bash
# 1. Ver el error real (primeras líneas del último error)
grep -A 5 "local.ERROR" storage/logs/laravel.log | tail -20

# 2. Limpiar caché
php artisan config:clear
php artisan cache:clear
php artisan view:clear

# 3. Permisos
chmod -R 775 storage bootstrap/cache

# 4. Si usas database para session/cache, corre migraciones
php artisan migrate

# 5. Variables .env necesarias
# APP_KEY=base64:... (php artisan key:generate si falta)
# DB_CONNECTION=mysql
# DB_DATABASE=u555747547_sivso2026
# DB_HOST=...
# DB_USERNAME=...
# DB_PASSWORD=...
```

Para ver el error en pantalla: en `.env` pon `APP_DEBUG=true` (quita después)
