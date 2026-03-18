# Cómo depurar 500 en Hostinger (SSH)

Ejecuta estos comandos en la carpeta del proyecto:

```bash
# 1. Ver el error real en el log
tail -50 storage/logs/laravel.log

# 2. Limpiar caché (importante después de subir cambios)
php artisan config:clear
php artisan cache:clear
php artisan view:clear

# 3. Permisos de carpetas
chmod -R 775 storage bootstrap/cache

# 4. Si falta .env, copiarlo
cp .env.example .env
php artisan key:generate

# 5. Revisar que .env tenga las variables correctas
# DB_CONNECTION=mysql
# DB_DATABASE=u555747547_sivso2026
# DB_HOST=...
# DB_USERNAME=...
# DB_PASSWORD=...
```

Para ver el error en pantalla (solo desarrollo): en `.env` pon `APP_DEBUG=true`
