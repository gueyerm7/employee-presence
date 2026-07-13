#!/bin/bash
set -e

if [ -f artisan ]; then
    php artisan migrate --force
    php artisan make:admin
fi

exec "$@"
