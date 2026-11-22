<?php

declare(strict_types=1);

$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
$attachmentPath = '/attachments/新建 文本文档.txt';

if ($path === '/shop.php') {
    require __DIR__ . '/public/shop.php';

    return true;
}

if ($path === $attachmentPath) {
    $sourcePath = __DIR__ . $attachmentPath;

    if (!is_file($sourcePath)) {
        http_response_code(404);
        echo 'Attachment not found.';
        return true;
    }

    header('Content-Type: text/html; charset=UTF-8');
    highlight_file($sourcePath);

    return true;
}

return false;
