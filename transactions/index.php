<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

if (!hasModuleAccess('transactions')) {
    redirect(SITE_URL . '/dashboard.php');
}

$page = isset($_GET['page']) ? intval($_GET['page']) : 1;
$perPage = 50;
$offset = ($page - 1) * $perPage;

$filters = [];
$params = [];
$whereClause = "WHERE t.deleted_at IS NULL";

if (isset($_GET['sender_id']) && $_GET['sender_id'] != '') {
    $whereClause .= " AND t.sender_id = ?";
    $params[] = intval($_GET['sender_id']);
}

if (isset($_GET['receiver_id']) && $_GET['receiver_id'] != '') {
    $whereClause .= " AND t.receiver_id = ?";
    $params[] = intval($_GET['receiver_id']);
}

if (isset($_GET['date_from']) && $_GET['date_from'] != '') {
    $whereClause .= " AND DATE(t.transaction_date) >= ?";
    $params[] = $_GET['date_from'];
}

if (isset($_GET['date_to']) && $_GET['date_to'] != '') {
    $whereClause .= " AND DATE(t.transaction_date) <= ?";
    $params[] = $_GET['date_to'];
}

$countStmt = $pdo->prepare("SELECT COUNT(*) FROM transactions t $whereClause");
$countStmt->execute($params);
$totalRecords = $countStmt->fetchColumn();
$totalPages = ceil($totalRecords / $perPage);

$stmt = $pdo->prepare("
    SELECT 
        t.*,
        s.name as sender_name,
        r.name as receiver_name,
        u.mobile as created_by_mobile
    FROM transactions t
    LEFT JOIN agents s ON t.sender_id = s.id
    LEFT JOIN agents r ON t.receiver_id = r.id
    LEFT JOIN admins u ON t.created_by = u.id
    $whereClause
    ORDER BY t.transaction_date DESC, t.id DESC
    LIMIT ? OFFSET ?
");
$stmt->execute(array_merge($params, [$perPage, $offset]));
$transactions = $stmt->fetchAll();

$agentsStmt = $pdo->query("SELECT id, name FROM agents WHERE status = 'active' ORDER BY name");
$agents = $agentsStmt->fetchAll();

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>Transactions</h1>
        <?php if (hasFullAccess('transactions')): ?>
            <button class="btn btn-primary" onclick="openCreateModal()">+ New Transaction</button>
        <?php endif; ?>
    </div>
    
    <div class="card">
        <div class="card-header">
            <h2>Filter Transactions</h2>
        </div>
        <div class="card-body">
            <form method="GET" action="" class="filter-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="sender_id">Sender</label>
                        <select id="sender_id" name="sender_id" class="form-control">
                            <option value="">All Senders</option>
                            <?php foreach ($agents as $agent): ?>
                                <option value="<?php echo $agent['id']; ?>" 
                                    <?php echo (isset($_GET['sender_id']) && $_GET['sender_id'] == $agent['id']) ? 'selected' : ''; ?>>
                                    <?php echo htmlspecialchars($agent['name']); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="receiver_id">Receiver</label>
                        <select id="receiver_id" name="receiver_id" class="form-control">
                            <option value="">All Receivers</option>
                            <?php foreach ($agents as $agent): ?>
                                <option value="<?php echo $agent['id']; ?>" 
                                    <?php echo (isset($_GET['receiver_id']) && $_GET['receiver_id'] == $agent['id']) ? 'selected' : ''; ?>>
                                    <?php echo htmlspecialchars($agent['name']); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="date_from">From Date</label>
                        <input type="date" id="date_from" name="date_from" class="form-control" 
                               value="<?php echo isset($_GET['date_from']) ? $_GET['date_from'] : ''; ?>">
                    </div>
                    
                    <div class="form-group">
                        <label for="date_to">To Date</label>
                        <input type="date" id="date_to" name="date_to" class="form-control" 
                               value="<?php echo isset($_GET['date_to']) ? $_GET['date_to'] : ''; ?>">
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Apply Filters</button>
                    <a href="index.php" class="btn btn-secondary">Clear Filters</a>
                </div>
            </form>
        </div>
    </div>
    
    <div class="card">
        <div class="card-header">
            <h2>Transaction History (<?php echo $totalRecords; ?> records)</h2>
        </div>
        <div class="card-body">
            <?php if (empty($transactions)): ?>
                <div class="empty-state">
                    <p>No transactions found.</p>
                    <?php if (hasFullAccess('transactions')): ?>
                        <button class="btn btn-primary" onclick="openCreateModal()">Create First Transaction</button>
                    <?php endif; ?>
                </div>
            <?php else: ?>
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Date</th>
                                <th>Sender</th>
                                <th>Receiver</th>
                                <th>Amount</th>
                                <th>Sender Balance</th>
                                <th>Receiver Balance</th>
                                <th>Remarks</th>
                                <th>Created By</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($transactions as $txn): ?>
                                <tr>
                                    <td><strong><?php echo htmlspecialchars($txn['transaction_code']); ?></strong></td>
                                    <td><?php echo date('d M Y H:i', strtotime($txn['transaction_date'])); ?></td>
                                    <td><?php echo htmlspecialchars($txn['sender_name']); ?></td>
                                    <td><?php echo htmlspecialchars($txn['receiver_name']); ?></td>
                                    <td class="text-right"><strong><?php echo formatCurrency($txn['amount']); ?></strong></td>
                                    <td class="text-right">
                                        <?php echo formatCurrency($txn['sender_opening_balance']); ?> → 
                                        <strong><?php echo formatCurrency($txn['sender_closing_balance']); ?></strong>
                                    </td>
                                    <td class="text-right">
                                        <?php echo formatCurrency($txn['receiver_opening_balance']); ?> → 
                                        <strong><?php echo formatCurrency($txn['receiver_closing_balance']); ?></strong>
                                    </td>
                                    <td><?php echo htmlspecialchars($txn['remarks'] ?: '-'); ?></td>
                                    <td><?php echo htmlspecialchars($txn['created_by_mobile'] ?: 'System'); ?></td>
                                    <td>
                                        <a href="view.php?id=<?php echo $txn['id']; ?>" class="btn btn-sm btn-info">View</a>
                                        <?php if (hasFullAccess('transactions')): ?>
                                            <button class="btn btn-sm btn-danger" 
                                                    onclick="deleteTransaction(<?php echo $txn['id']; ?>)">Delete</button>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
                
                <?php if ($totalPages > 1): ?>
                    <div class="pagination">
                        <?php if ($page > 1): ?>
                            <a href="?page=<?php echo $page - 1; ?><?php echo http_build_query(array_diff_key($_GET, ['page' => ''])) ? '&' . http_build_query(array_diff_key($_GET, ['page' => ''])) : ''; ?>" 
                               class="btn btn-sm btn-secondary">← Previous</a>
                        <?php endif; ?>
                        
                        <span>Page <?php echo $page; ?> of <?php echo $totalPages; ?></span>
                        
                        <?php if ($page < $totalPages): ?>
                            <a href="?page=<?php echo $page + 1; ?><?php echo http_build_query(array_diff_key($_GET, ['page' => ''])) ? '&' . http_build_query(array_diff_key($_GET, ['page' => ''])) : ''; ?>" 
                               class="btn btn-sm btn-secondary">Next →</a>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
            <?php endif; ?>
        </div>
    </div>
</div>

<?php if (hasFullAccess('transactions')): ?>
<div id="createModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Create Transaction</h2>
            <span class="close" onclick="closeCreateModal()">&times;</span>
        </div>
        <form id="createForm" onsubmit="return createTransaction(event)">
            <div class="modal-body">
                <div class="form-group">
                    <label for="sender_id_create">Sender (From) *</label>
                    <select id="sender_id_create" name="sender_id" required class="form-control">
                        <option value="">Select sender</option>
                        <?php foreach ($agents as $agent): ?>
                            <option value="<?php echo $agent['id']; ?>">
                                <?php echo htmlspecialchars($agent['name']); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="receiver_id_create">Receiver (To) *</label>
                    <select id="receiver_id_create" name="receiver_id" required class="form-control">
                        <option value="">Select receiver</option>
                        <?php foreach ($agents as $agent): ?>
                            <option value="<?php echo $agent['id']; ?>">
                                <?php echo htmlspecialchars($agent['name']); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="amount_create">Amount *</label>
                    <input type="number" id="amount_create" name="amount" required 
                           step="0.01" min="0.01" class="form-control" placeholder="e.g., 10000">
                </div>
                
                <div class="form-group">
                    <label for="transaction_date_create">Transaction Date *</label>
                    <input type="datetime-local" id="transaction_date_create" name="transaction_date" 
                           required class="form-control" value="<?php echo date('Y-m-d\TH:i'); ?>">
                </div>
                
                <div class="form-group">
                    <label for="remarks_create">Remarks</label>
                    <textarea id="remarks_create" name="remarks" class="form-control" 
                              rows="3" placeholder="Optional notes about this transaction"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeCreateModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Transaction</button>
            </div>
        </form>
    </div>
</div>
<?php endif; ?>

<script>
function openCreateModal() {
    document.getElementById('createModal').style.display = 'block';
}

function closeCreateModal() {
    document.getElementById('createModal').style.display = 'none';
    document.getElementById('createForm').reset();
}

function createTransaction(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    if (formData.get('sender_id') === formData.get('receiver_id')) {
        alert('Sender and receiver cannot be the same');
        return false;
    }
    
    fetch('../api/create_transaction.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Transaction created successfully');
            window.location.reload();
        } else {
            alert('Error: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while creating the transaction');
    });
    
    return false;
}

function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
        return;
    }
    
    fetch('../api/delete_transaction.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'id=' + id
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Transaction deleted successfully');
            window.location.reload();
        } else {
            alert('Error: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while deleting the transaction');
    });
}

window.onclick = function(event) {
    const modal = document.getElementById('createModal');
    if (event.target == modal) {
        closeCreateModal();
    }
}
</script>

<script>
function softDelete(transId) {
    if (!confirm('Soft delete this transaction? Balances will be recalculated.')) {
        return;
    }
    
    fetch('<?php echo SITE_URL; ?>/api/soft_delete_transaction.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: 'transaction_id=' + transId
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Transaction soft deleted successfully');
            window.location.reload();
        } else {
            alert('Error: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred');
    });
}

function restoreTrans(transId) {
    if (!confirm('Restore this transaction? Balances will be recalculated.')) {
        return;
    }
    
    fetch('<?php echo SITE_URL; ?>/api/restore_transaction.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: 'transaction_id=' + transId
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Transaction restored successfully');
            window.location.reload();
        } else {
            alert('Error: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred');
    });
}

function permanentDelete(transId) {
    if (!confirm('PERMANENTLY delete this transaction? This CANNOT be undone!')) {
        return;
    }
    
    if (!confirm('Are you absolutely sure? This will remove the transaction completely from the database.')) {
        return;
    }
    
    fetch('<?php echo SITE_URL; ?>/api/permanent_delete_transaction.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: 'transaction_id=' + transId
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Transaction permanently deleted');
            window.location.reload();
        } else {
            alert('Error: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred');
    });
}
</script>

<?php include '../includes/footer.php'; ?>
