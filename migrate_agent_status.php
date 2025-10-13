<?php
require_once 'config/database.php';

try {
    $pdo->exec("ALTER TABLE agents ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER name");
    echo "✓ Successfully added is_active column to agents table\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "✓ Column is_active already exists\n";
    } else {
        echo "✗ Error: " . $e->getMessage() . "\n";
    }
}
