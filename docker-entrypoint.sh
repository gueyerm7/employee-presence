#!/bin/bash
set -e

if [ -f artisan ]; then
    php artisan migrate --force
    php artisan config:cache
fi

exec "$@"
