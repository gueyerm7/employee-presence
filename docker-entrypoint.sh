#!/bin/bash
set -e

if [ -f artisan ]; then
    php artisan migrate --force
fi

exec "$@"
