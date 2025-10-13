<?php
require_once 'config/database.php';

try {
    $pdo->exec("UPDATE branches SET agent_id = 3 WHERE branch_code = 'TEST_BR001'");
    echo "✓ Assigned TEST_BR001 to RAM (agent_id=3)\n";
    
    $pdo->exec("UPDATE branches SET agent_id = 6 WHERE branch_code = 'TEST_BR_PROD'");
    echo "✓ Assigned TEST_BR_PROD to ksk (agent_id=6)\n";
    
    $pdo->exec("UPDATE branches SET agent_id = 4 WHERE branch_code = 'TEST_SITE_MODAL_BR'");
    echo "✓ Assigned TEST_SITE_MODAL_BR to TEST_AGENT_MODAL (agent_id=4)\n";
    
    echo "\n=== Verification ===\n";
    $stmt = $pdo->query("
        SELECT 
            b.branch_code, 
            b.balance, 
            b.agent_id, 
            a.name as agent_name
        FROM branches b
        LEFT JOIN agents a ON b.agent_id = a.id
        WHERE b.branch_code IN ('TEST_BR001', 'TEST_BR_PROD', 'TEST_SITE_MODAL_BR')
    ");
    
    while ($row = $stmt->fetch()) {
        echo sprintf(
            "Branch: %s | Balance: ₹%.2f | Agent: %s (ID: %d)\n",
            $row['branch_code'],
            $row['balance'],
            $row['agent_name'],
            $row['agent_id']
        );
    }
    
    echo "\n=== Agent Totals After Assignment ===\n";
    $stmt = $pdo->query("
        SELECT 
            a.id,
            a.name,
            COUNT(b.id) as branch_count,
            COALESCE(SUM(b.balance), 0) as total_balance
        FROM agents a
        LEFT JOIN branches b ON a.id = b.agent_id
        WHERE a.id IN (3, 4, 6)
        GROUP BY a.id
        ORDER BY a.name
    ");
    
    while ($row = $stmt->fetch()) {
        echo sprintf(
            "Agent: %s (ID: %d) | Branches: %d | Total: ₹%.2f\n",
            $row['name'],
            $row['id'],
            $row['branch_count'],
            $row['total_balance']
        );
    }
    
} catch (PDOException $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}
