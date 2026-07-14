#!/bin/bash
set -e

if [ -f artisan ]; then
    if [ -n "$DATABASE_URL" ]; then
        export DB_CONNECTION=pgsql
    fi
    php artisan migrate --force
    php artisan make:admin
fi

exec "$@"
