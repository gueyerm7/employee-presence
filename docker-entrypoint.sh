#!/bin/bash
set -e

if [ -f artisan ]; then
    if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "base64:" ] || [ ${#APP_KEY} -lt 20 ]; then
        php artisan key:generate --force
    fi
    php artisan migrate --force
fi

exec "$@"
