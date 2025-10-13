<?php
require_once 'config/database.php';

try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS whatsapp_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            agent_id INT NOT NULL,
            agent_name VARCHAR(100) NOT NULL,
            phone_number VARCHAR(20) NOT NULL,
            message_text TEXT NOT NULL,
            status ENUM('success', 'failed') NOT NULL,
            error_message TEXT DEFAULT NULL,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
            INDEX idx_sent_at (sent_at),
            INDEX idx_agent_id (agent_id),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    
    echo "✅ WhatsApp logs table created successfully!\n";
} catch (PDOException $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
}
