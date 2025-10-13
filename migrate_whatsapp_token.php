<?php
require_once 'config/database.php';

try {
    $pdo->exec("ALTER TABLE whatsapp_config ADD COLUMN session_token VARCHAR(500) DEFAULT NULL AFTER api_key");
    echo "✓ Successfully added session_token column to whatsapp_config table\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "✓ Column session_token already exists\n";
    } else {
        echo "✗ Error: " . $e->getMessage() . "\n";
    }
}
