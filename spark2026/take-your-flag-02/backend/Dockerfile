FROM php:8.3-cli-alpine

WORKDIR /app

RUN docker-php-ext-install pdo_mysql

COPY public ./public
COPY images ./public/images
COPY shop.php ./public/shop.php
COPY attachments ./attachments
COPY init-db.php router.php entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["./entrypoint.sh"]
