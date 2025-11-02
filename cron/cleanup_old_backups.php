<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';

$tenDaysAgo = time() - (10 * 24 * 60 * 60);

try {
    $stmt = $pdo->prepare("SELECT * FROM backups WHERE timestamp < ?");
    $stmt->execute([$tenDaysAgo]);
    $oldBackups = $stmt->fetchAll();
    
    $deletedCount = 0;
    foreach ($oldBackups as $backup) {
        $filePath = __DIR__ . '/../backups/' . $backup['file_url'];
        if (file_exists($filePath)) {
            unlink($filePath);
        }
        
        $stmt = $pdo->prepare("DELETE FROM backups WHERE id = ?");
        $stmt->execute([$backup['id']]);
        $deletedCount++;
    }
    
    echo "Cleanup completed. Deleted $deletedCount old backups.\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
