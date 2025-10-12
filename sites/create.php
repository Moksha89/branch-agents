<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = sanitizeInput($_POST['name']);
    
    if (empty($name)) {
        $error = 'Site name is required';
    } else {
        try {
            $stmt = $pdo->prepare("INSERT INTO sites (name) VALUES (?)");
            $stmt->execute([$name]);
            $success = 'Site created successfully';
            header('refresh:2;url=index.php');
        } catch (PDOException $e) {
            $error = 'Error creating site: ' . $e->getMessage();
        }
    }
}

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>Create New Site</h1>
        <a href="index.php" class="btn btn-secondary">← Back to Sites</a>
    </div>
    
    <?php if ($error): ?>
        <div class="alert alert-error"><?php echo $error; ?></div>
    <?php endif; ?>
    
    <?php if ($success): ?>
        <div class="alert alert-success"><?php echo $success; ?></div>
    <?php endif; ?>
    
    <div class="form-container">
        <form method="POST" action="">
            <div class="form-group">
                <label for="name">Site Name *</label>
                <input type="text" id="name" name="name" required 
                       placeholder="e.g., JAI, KALKI, VVBOOK" 
                       value="<?php echo isset($_POST['name']) ? htmlspecialchars($_POST['name']) : ''; ?>">
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Create Site</button>
                <a href="index.php" class="btn btn-secondary">Cancel</a>
            </div>
        </form>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
