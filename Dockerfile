FROM node:20-alpine AS frontend

WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM php:8.3-apache

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    unzip \
    git \
    && rm -rf /var/lib/apt/lists/* \
    && docker-php-ext-install pdo_pgsql zip \
    && a2dismod mpm_event \
    && a2enmod mpm_prefork rewrite

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY backend/ .

RUN mkdir -p storage/framework/views storage/framework/cache/data storage/framework/sessions storage/logs bootstrap/cache && \
    chmod -R 777 storage bootstrap/cache && \
    composer install --no-dev --optimize-autoloader

COPY --from=frontend /build/dist /app/public/assets
COPY --from=frontend /build/dist/index.html /app/public/spa.html

RUN sed -i 's!/var/www/html!/app/public!g' /etc/apache2/sites-available/000-default.conf && \
    printf '<Directory /app/public>\n    Options Indexes FollowSymLinks\n    AllowOverride All\n    Require all granted\n</Directory>\n' > /etc/apache2/conf-available/app.conf && \
    a2enconf app

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]
