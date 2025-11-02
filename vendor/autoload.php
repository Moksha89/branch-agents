<?php
spl_autoload_register(function ($class) {
    if (strpos($class, 'Mpdf\\') === 0) {
        $file = __DIR__ . '/mpdf/src/' . str_replace('\\', '/', substr($class, 5)) . '.php';
        if (file_exists($file)) {
            require_once $file;
        }
    }
});
