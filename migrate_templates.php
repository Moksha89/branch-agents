<?php
require_once 'config/database.php';

try {
    $stmt = $pdo->query("SHOW COLUMNS FROM whatsapp_config LIKE 'header_template'");
    $headerExists = $stmt->fetch();
    
    if (!$headerExists) {
        $pdo->exec("ALTER TABLE whatsapp_config ADD COLUMN header_template TEXT DEFAULT NULL");
        echo "Added header_template column\n";
    }
    
    $stmt = $pdo->query("SHOW COLUMNS FROM whatsapp_config LIKE 'footer_template'");
    $footerExists = $stmt->fetch();
    
    if (!$footerExists) {
        $pdo->exec("ALTER TABLE whatsapp_config ADD COLUMN footer_template TEXT DEFAULT NULL");
        echo "Added footer_template column\n";
    }
    
    $stmt = $pdo->query("SELECT header_template FROM whatsapp_config WHERE id = 1");
    $existing = $stmt->fetch();
    
    if (!$existing || empty($existing['header_template'])) {
        $pdo->exec("UPDATE whatsapp_config SET 
            header_template = 'Hey {agent}, this is a reminder about your balance to be cleared.',
            footer_template = 'Please contact us if you have any questions. Thank you!'
            WHERE id = 1");
        echo "Set default templates\n";
    }
    
    echo "\nMigration completed successfully!";
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage();
}
