<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

if (!hasModuleAccess('transactions')) {
    redirect(SITE_URL . '/dashboard.php');
}

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id <= 0) {
    redirect(SITE_URL . '/transactions/index.php');
}

$stmt = $pdo->prepare("
    SELECT 
        t.*,
        s.name as sender_name,
        r.name as receiver_name,
        u.name as created_by_name
    FROM transactions t
    LEFT JOIN agents s ON t.sender_id = s.id
    LEFT JOIN agents r ON t.receiver_id = r.id
    LEFT JOIN admins u ON t.created_by = u.id
    WHERE t.id = ? AND t.deleted_at IS NULL
");
$stmt->execute([$id]);
$transaction = $stmt->fetch();

if (!$transaction) {
    redirect(SITE_URL . '/transactions/index.php');
}

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>Transaction Details</h1>
        <a href="index.php" class="btn btn-secondary">← Back to Transactions</a>
    </div>
    
    <div class="card">
        <div class="card-header">
            <h2>Transaction: <?php echo htmlspecialchars($transaction['transaction_code']); ?></h2>
        </div>
        <div class="card-body">
            <div class="info-grid">
                <div class="info-item">
                    <label>Transaction Code</label>
                    <strong><?php echo htmlspecialchars($transaction['transaction_code']); ?></strong>
                </div>
                
                <div class="info-item">
                    <label>Transaction Date</label>
                    <strong><?php echo date('d M Y H:i:s', strtotime($transaction['transaction_date'])); ?></strong>
                </div>
                
                <div class="info-item">
                    <label>Amount</label>
                    <strong class="text-primary" style="font-size: 1.5em;">
                        <?php echo formatCurrency($transaction['amount']); ?>
                    </strong>
                </div>
                
                <div class="info-item">
                    <label>Created By</label>
                    <strong><?php echo htmlspecialchars($transaction['created_by_name'] ?: 'System'); ?></strong>
                </div>
            </div>
            
            <hr>
            
            <h3>Transaction Flow</h3>
            <div class="transaction-flow">
                <div class="flow-card">
                    <h4>Sender</h4>
                    <p><strong><?php echo htmlspecialchars($transaction['sender_name']); ?></strong></p>
                    <div class="balance-change">
                        <div>
                            <label>Opening Balance</label>
                            <div><?php echo formatCurrency($transaction['sender_opening_balance']); ?></div>
                        </div>
                        <div class="arrow">→</div>
                        <div>
                            <label>Closing Balance</label>
                            <div class="text-danger">
                                <strong><?php echo formatCurrency($transaction['sender_closing_balance']); ?></strong>
                            </div>
                        </div>
                    </div>
                    <div class="change-amount text-danger">
                        - <?php echo formatCurrency($transaction['amount']); ?>
                    </div>
                </div>
                
                <div class="flow-arrow">
                    <i class="fas fa-arrow-right"></i>
                    <div><?php echo formatCurrency($transaction['amount']); ?></div>
                </div>
                
                <div class="flow-card">
                    <h4>Receiver</h4>
                    <p><strong><?php echo htmlspecialchars($transaction['receiver_name']); ?></strong></p>
                    <div class="balance-change">
                        <div>
                            <label>Opening Balance</label>
                            <div><?php echo formatCurrency($transaction['receiver_opening_balance']); ?></div>
                        </div>
                        <div class="arrow">→</div>
                        <div>
                            <label>Closing Balance</label>
                            <div class="text-success">
                                <strong><?php echo formatCurrency($transaction['receiver_closing_balance']); ?></strong>
                            </div>
                        </div>
                    </div>
                    <div class="change-amount text-success">
                        + <?php echo formatCurrency($transaction['amount']); ?>
                    </div>
                </div>
            </div>
            
            <?php if ($transaction['remarks']): ?>
                <hr>
                <h3>Remarks</h3>
                <p><?php echo nl2br(htmlspecialchars($transaction['remarks'])); ?></p>
            <?php endif; ?>
            
            <hr>
            
            <div class="info-grid">
                <div class="info-item">
                    <label>Created At</label>
                    <div><?php echo date('d M Y H:i:s', strtotime($transaction['created_at'])); ?></div>
                </div>
                
                <?php if ($transaction['updated_at'] != $transaction['created_at']): ?>
                <div class="info-item">
                    <label>Last Updated</label>
                    <div><?php echo date('d M Y H:i:s', strtotime($transaction['updated_at'])); ?></div>
                </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<style>
.transaction-flow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    margin: 20px 0;
    flex-wrap: wrap;
}

.flow-card {
    flex: 1;
    min-width: 250px;
    padding: 20px;
    background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.flow-card h4 {
    margin-top: 0;
    color: #333;
}

.balance-change {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 15px 0;
}

.balance-change > div {
    flex: 1;
}

.balance-change label {
    font-size: 0.85em;
    color: #666;
    display: block;
    margin-bottom: 5px;
}

.balance-change .arrow {
    font-size: 1.5em;
    color: #666;
    flex: 0;
}

.change-amount {
    font-size: 1.2em;
    font-weight: bold;
    margin-top: 10px;
}

.flow-arrow {
    text-align: center;
    color: #FFC107;
    font-size: 2em;
}

.flow-arrow div {
    font-size: 0.5em;
    font-weight: bold;
    margin-top: 5px;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin: 20px 0;
}

.info-item label {
    display: block;
    font-size: 0.9em;
    color: #666;
    margin-bottom: 5px;
}

@media (max-width: 768px) {
    .transaction-flow {
        flex-direction: column;
    }
    
    .flow-arrow {
        transform: rotate(90deg);
    }
}
</style>

<?php include '../includes/footer.php'; ?>
