<?php

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '');
$docRoot = $_SERVER['DOCUMENT_ROOT'];

if ($uri !== '/' && file_exists($docRoot . $uri)) {
    return false;
}

require $docRoot . '/index.php';
