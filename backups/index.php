<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

if (!isAdmin()) {
    redirect(SITE_URL . '/dashboard.php');
}

$page = isset($_GET['page']) ? intval($_GET['page']) : 1;
$perPage = 20;
$offset = ($page - 1) * $perPage;

$countStmt = $pdo->query("SELECT COUNT(*) FROM backups");
$totalRecords = $countStmt->fetchColumn();
$totalPages = ceil($totalRecords / $perPage);

$stmt = $pdo->prepare("
    SELECT b.*, a.mobile as created_by_mobile
    FROM backups b
    LEFT JOIN admins a ON b.created_by = a.id
    ORDER BY b.timestamp DESC
    LIMIT ? OFFSET ?
");
$stmt->execute([$perPage, $offset]);
$backups = $stmt->fetchAll();

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>Database Backups</h1>
        <button class="btn btn-primary" onclick="openCreateModal()">
            <i class="icon">📦</i> Create Backup
        </button>
    </div>
    
    <div class="card">
        <div class="card-header">
            <h2>Backup History (<?php echo $totalRecords; ?> backups)</h2>
        </div>
        <div class="card-body">
            <?php if (empty($backups)): ?>
                <div class="empty-state">
                    <p>No backups found. Create your first backup to secure your data.</p>
                    <button class="btn btn-primary" onclick="openCreateModal()">Create First Backup</button>
                </div>
            <?php else: ?>
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Backup ID</th>
                                <th>Created Date</th>
                                <th>Filename</th>
                                <th>Created By</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($backups as $backup): ?>
                                <tr>
                                    <td><strong>#<?php echo $backup['id']; ?></strong></td>
                                    <td><?php echo date('d M Y H:i:s', $backup['timestamp']); ?></td>
                                    <td><?php echo htmlspecialchars($backup['file_url']); ?></td>
                                    <td><?php echo htmlspecialchars($backup['created_by_mobile'] ?: 'System'); ?></td>
                                    <td>
                                        <a href="<?php echo SITE_URL; ?>/api/download_backup.php?id=<?php echo $backup['id']; ?>" 
                                           class="btn btn-sm btn-info">Download</a>
                                        <button class="btn btn-sm btn-warning" 
                                                onclick="restoreBackup(<?php echo $backup['id']; ?>)">Restore</button>
                                        <button class="btn btn-sm btn-danger" 
                                                onclick="deleteBackup(<?php echo $backup['id']; ?>)">Delete</button>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
                
                <?php if ($totalPages > 1): ?>
                    <div class="pagination">
                        <?php if ($page > 1): ?>
                            <a href="?page=<?php echo $page - 1; ?>" class="btn btn-sm btn-secondary">← Previous</a>
                        <?php endif; ?>
                        <span>Page <?php echo $page; ?> of <?php echo $totalPages; ?></span>
                        <?php if ($page < $totalPages): ?>
                            <a href="?page=<?php echo $page + 1; ?>" class="btn btn-sm btn-secondary">Next →</a>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
            <?php endif; ?>
        </div>
    </div>
</div>

<div id="createModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Create Database Backup</h2>
            <span class="close" onclick="closeCreateModal()">&times;</span>
        </div>
        <div class="modal-body">
            <p>This will create an encrypted backup of all database tables.</p>
            <p><strong>Tables included:</strong> sites, branches, agents, transactions, admins, employees, and all related data.</p>
            <p class="text-warning"><strong>Note:</strong> Large databases may take a few seconds to backup.</p>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeCreateModal()">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="createBackup()">Create Backup</button>
        </div>
    </div>
</div>

<script>
function openCreateModal() {
    document.getElementById('createModal').style.display = 'block';
}

function closeCreateModal() {
    document.getElementById('createModal').style.display = 'none';
}

function createBackup() {
    if (!confirm('Create a new database backup? This may take a few seconds.')) {
        return;
    }
    
    closeCreateModal();
    
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = 'Creating backup...';
    
    fetch('<?php echo SITE_URL; ?>/api/create_backup.php', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Backup created successfully!');
            window.location.reload();
        } else {
            alert('Error: ' + data.error);
            btn.disabled = false;
            btn.textContent = 'Create Backup';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while creating the backup');
        btn.disabled = false;
        btn.textContent = 'Create Backup';
    });
}

function restoreBackup(id) {
    if (!confirm('⚠️ WARNING: This will restore the database to the state of this backup. ALL CURRENT DATA WILL BE REPLACED. Are you absolutely sure?')) {
        return;
    }
    
    if (!confirm('This action CANNOT be undone. Click OK to confirm restoration.')) {
        return;
    }
    
    fetch('<?php echo SITE_URL; ?>/api/restore_backup.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'id=' + id
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Backup restored successfully!');
            window.location.reload();
        } else {
            alert('Error: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while restoring the backup');
    });
}

function deleteBackup(id) {
    if (!confirm('Delete this backup? This action cannot be undone.')) {
        return;
    }
    
    fetch('<?php echo SITE_URL; ?>/api/delete_backup.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'id=' + id
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Backup deleted successfully');
            window.location.reload();
        } else {
            alert('Error: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while deleting the backup');
    });
}

window.onclick = function(event) {
    const modal = document.getElementById('createModal');
    if (event.target == modal) {
        closeCreateModal();
    }
}
</script>

<?php include '../includes/footer.php'; ?>
