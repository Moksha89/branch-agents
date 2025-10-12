<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

$error = '';
$success = '';

$stmt = $pdo->query("SELECT * FROM whatsapp_config WHERE id = 1");
$config = $stmt->fetch();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $phoneNumberId = sanitizeInput($_POST['phone_number_id']);
    $accessToken = sanitizeInput($_POST['access_token']);
    $isActive = isset($_POST['is_active']) ? 1 : 0;
    
    try {
        $stmt = $pdo->prepare("
            UPDATE whatsapp_config 
            SET phone_number_id = ?, access_token = ?, is_active = ? 
            WHERE id = 1
        ");
        $stmt->execute([$phoneNumberId, $accessToken, $isActive]);
        $success = 'WhatsApp configuration updated successfully';
        
        $stmt = $pdo->query("SELECT * FROM whatsapp_config WHERE id = 1");
        $config = $stmt->fetch();
    } catch (PDOException $e) {
        $error = 'Error updating configuration: ' . $e->getMessage();
    }
}

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>WhatsApp Settings</h1>
    </div>
    
    <?php if ($error): ?>
        <div class="alert alert-error"><?php echo $error; ?></div>
    <?php endif; ?>
    
    <?php if ($success): ?>
        <div class="alert alert-success"><?php echo $success; ?></div>
    <?php endif; ?>
    
    <div class="form-container">
        <div class="alert alert-warning">
            <h4>📱 WhatsApp Business API Setup</h4>
            <p>To enable WhatsApp integration, you need to:</p>
            <ol>
                <li>Sign up for WhatsApp Business API at <a href="https://business.whatsapp.com" target="_blank">https://business.whatsapp.com</a></li>
                <li>Create a Facebook Business account and link it</li>
                <li>Get your Phone Number ID from the WhatsApp Dashboard</li>
                <li>Generate an Access Token with messaging permissions</li>
                <li>Enter the credentials below</li>
            </ol>
        </div>
        
        <form method="POST" action="">
            <div class="form-group">
                <label for="phone_number_id">Phone Number ID</label>
                <input type="text" id="phone_number_id" name="phone_number_id" 
                       placeholder="Enter your WhatsApp Phone Number ID" 
                       value="<?php echo htmlspecialchars($config['phone_number_id'] ?? ''); ?>">
            </div>
            
            <div class="form-group">
                <label for="access_token">Access Token</label>
                <textarea id="access_token" name="access_token" rows="4" 
                          placeholder="Enter your WhatsApp Access Token"><?php echo htmlspecialchars($config['access_token'] ?? ''); ?></textarea>
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" name="is_active" value="1" 
                           <?php echo ($config && $config['is_active']) ? 'checked' : ''; ?>>
                    Enable WhatsApp Integration
                </label>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Save Configuration</button>
            </div>
        </form>
        
        <hr style="margin: 30px 0;">
        
        <h3>Test WhatsApp Integration</h3>
        <div class="form-group">
            <label for="test_phone">Test Phone Number</label>
            <input type="text" id="test_phone" placeholder="Enter 10-digit mobile number">
        </div>
        <button onclick="sendTestMessage()" class="btn btn-success">Send Test Message</button>
        
        <div id="test-result" style="margin-top: 15px;"></div>
    </div>
</div>

<script>
const SITE_URL = '<?php echo SITE_URL; ?>';

function sendTestMessage() {
    const phone = document.getElementById('test_phone').value;
    const resultDiv = document.getElementById('test-result');
    
    if (!phone || phone.length !== 10) {
        resultDiv.innerHTML = '<div class="alert alert-error">Please enter a valid 10-digit mobile number</div>';
        return;
    }
    
    resultDiv.innerHTML = '<div class="loading">Sending test message</div>';
    
    $.ajax({
        url: SITE_URL + '/api/test_whatsapp.php',
        method: 'POST',
        data: { phone: phone },
        success: function(response) {
            if (response.success) {
                resultDiv.innerHTML = '<div class="alert alert-success">Test message sent successfully!</div>';
            } else {
                resultDiv.innerHTML = '<div class="alert alert-error">Error: ' + response.error + '</div>';
            }
        },
        error: function() {
            resultDiv.innerHTML = '<div class="alert alert-error">Error sending test message</div>';
        }
    });
}
</script>

<?php include '../includes/footer.php'; ?>
