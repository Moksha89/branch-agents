<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

$stmt = $pdo->query("SELECT * FROM whatsapp_config WHERE id = 1");
$config = $stmt->fetch();
$apiUrl = $config['api_url'] ?? '';
$apiKey = $config['api_key'] ?? '';

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_config'])) {
    $newApiUrl = sanitizeInput($_POST['api_url']);
    $newApiKey = sanitizeInput($_POST['api_key']);
    
    try {
        $stmt = $pdo->prepare("
            UPDATE whatsapp_config 
            SET api_url = ?, api_key = ?, is_active = 1 
            WHERE id = 1
        ");
        $stmt->execute([$newApiUrl, $newApiKey]);
        $success = 'WhatsApp API configuration saved successfully';
        $apiUrl = $newApiUrl;
        $apiKey = $newApiKey;
    } catch (PDOException $e) {
        $error = 'Error saving configuration: ' . $e->getMessage();
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_templates'])) {
    $headerTemplate = sanitizeInput($_POST['header_template']);
    $footerTemplate = sanitizeInput($_POST['footer_template']);
    
    try {
        $stmt = $pdo->prepare("
            UPDATE whatsapp_config 
            SET header_template = ?, footer_template = ? 
            WHERE id = 1
        ");
        $stmt->execute([$headerTemplate, $footerTemplate]);
        $success = 'Message templates saved successfully';
    } catch (PDOException $e) {
        $error = 'Error saving templates: ' . $e->getMessage();
    }
}

include '../includes/header.php';
?>

<div class="content-wrapper">
    <div class="page-header">
        <h1>📱 WhatsApp Web Connection</h1>
    </div>
    
    <?php if ($error): ?>
        <div class="alert alert-error"><?php echo $error; ?></div>
    <?php endif; ?>
    
    <?php if ($success): ?>
        <div class="alert alert-success"><?php echo $success; ?></div>
    <?php endif; ?>
    
    <div class="form-container" style="margin-bottom: 30px;">
        <h3>WhatsApp API Server Configuration</h3>
        <p class="text-muted">Configure the connection to your WhatsApp API server deployed on Railway/Render</p>
        
        <form method="POST">
            <div class="form-group">
                <label for="api_url">WhatsApp API Server URL</label>
                <input type="text" id="api_url" name="api_url" 
                       value="<?php echo htmlspecialchars($apiUrl); ?>"
                       placeholder="https://your-whatsapp-api.up.railway.app" required>
                <small>Enter the public URL of your deployed WhatsApp API server (from Railway/Render)</small>
            </div>
            
            <div class="form-group">
                <label for="api_key">Master API Key</label>
                <input type="password" id="api_key" name="api_key" 
                       value="<?php echo htmlspecialchars($apiKey); ?>"
                       placeholder="Your Master API Key from .env" required>
                <small>The MASTER_API_KEY from your WhatsApp API server configuration</small>
            </div>
            
            <div class="form-actions">
                <button type="submit" name="save_config" class="btn btn-primary">Save Configuration</button>
            </div>
        </form>
    </div>
    
    <?php if ($apiUrl && $apiKey): ?>
    <div class="form-container">
        <h3>WhatsApp Connection Status</h3>
        
        <div id="connection-status" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 4px;">
            <p style="margin: 0;"><strong>Status:</strong> <span id="status-text" class="badge" style="background: #6c757d;">Checking...</span></p>
            <p id="status-detail" style="margin: 5px 0 0 0; font-size: 14px; color: #666;"></p>
        </div>
        
        <div id="qr-code-section" style="display: none; text-align: center; padding: 20px; background: white; border: 2px dashed #ddd; border-radius: 8px;">
            <h4 style="margin-top: 0;">Scan QR Code with Your WhatsApp</h4>
            <div id="qr-code-container" style="display: inline-block; padding: 20px; background: white;">
                <canvas id="qr-canvas" style="border: 1px solid #ddd;"></canvas>
            </div>
            <div style="margin-top: 20px; text-align: left; max-width: 400px; margin-left: auto; margin-right: auto;">
                <p style="font-weight: bold;">How to connect:</p>
                <ol style="line-height: 1.8;">
                    <li>Open WhatsApp on your phone</li>
                    <li>Tap Menu (⋮) or Settings</li>
                    <li>Tap "Linked Devices"</li>
                    <li>Tap "Link a Device"</li>
                    <li>Scan this QR code</li>
                </ol>
                <p class="text-muted" style="font-size: 13px;">QR code refreshes automatically if it expires.</p>
            </div>
        </div>
        
        <div id="connected-section" style="display: none;">
            <div class="alert alert-success">
                <strong>✓ WhatsApp Connected Successfully!</strong><br>
                <p style="margin: 10px 0 0 0;">You can now send reports to agents from the Reports page.</p>
            </div>
            <button onclick="disconnectWhatsApp()" class="btn btn-danger">
                <i class="icon">🔌</i> Disconnect WhatsApp
            </button>
        </div>
        
        <div style="margin-top: 20px;">
            <button onclick="createSession()" class="btn btn-primary" id="connect-btn">
                <i class="icon">🔗</i> Connect WhatsApp
            </button>
            <button onclick="checkStatus()" class="btn btn-secondary" id="refresh-btn">
                <i class="icon">🔄</i> Refresh Status
            </button>
        </div>
    </div>
    
    <div class="form-container" style="margin-top: 30px;">
        <h3>📝 Message Templates</h3>
        <p class="text-muted">Customize the header and footer of WhatsApp reports. Use placeholders: {agent}, {total}, {date}, {time}</p>
        
        <form method="POST" id="template-form">
            <div class="form-group">
                <label for="header_template">Header Template</label>
                <textarea id="header_template" name="header_template" rows="3" 
                          placeholder="Hey {agent}, this is a reminder about your balance to be cleared."><?php echo htmlspecialchars($config['header_template'] ?? ''); ?></textarea>
                <small>Use {agent} for agent name, {date} for current date, {time} for current time</small>
            </div>
            
            <div class="form-group">
                <label for="footer_template">Footer Template</label>
                <textarea id="footer_template" name="footer_template" rows="3" 
                          placeholder="Please contact us if you have any questions. Thank you!"><?php echo htmlspecialchars($config['footer_template'] ?? ''); ?></textarea>
                <small>Custom footer message for all reports</small>
            </div>
            
            <div class="form-actions">
                <button type="submit" name="save_templates" class="btn btn-primary">Save Templates</button>
            </div>
        </form>
    </div>
    <?php else: ?>
        <div class="alert alert-warning">
            <strong>⚠️ Configuration Required</strong><br>
            Please configure your WhatsApp API server URL and API key above to continue.
        </div>
    <?php endif; ?>
</div>

<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
<script>
const SITE_URL = '<?php echo SITE_URL; ?>';
const API_URL = '<?php echo rtrim($apiUrl, '/'); ?>';
const API_KEY = '<?php echo $apiKey; ?>';
const SESSION_ID = 'hisaab_portal';

let statusCheckInterval = null;
let sessionToken = localStorage.getItem('whatsapp_session_token');

async function createSession() {
    const btn = document.getElementById('connect-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="icon">⏳</i> Creating session...';
    
    try {
        if (sessionToken) {
            try {
                await fetch(`${API_URL}/api/v1/sessions/${SESSION_ID}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${sessionToken}`
                    }
                });
            } catch (e) {
                console.log('No existing session to delete or delete failed:', e);
            }
        }
        
        const response = await fetch(`${API_URL}/api/v1/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify({ sessionId: SESSION_ID })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            sessionToken = data.token;
            localStorage.setItem('whatsapp_session_token', sessionToken);
            
            $.post(SITE_URL + '/api/save_whatsapp_token.php', { 
                session_token: sessionToken 
            });
            
            startStatusChecking();
        } else {
            alert('Error creating session: ' + data.message);
            btn.disabled = false;
            btn.innerHTML = '<i class="icon">🔗</i> Connect WhatsApp';
        }
    } catch (error) {
        alert('Error: ' + error.message);
        btn.disabled = false;
        btn.innerHTML = '<i class="icon">🔗</i> Connect WhatsApp';
    }
}

async function checkStatus() {
    const statusText = document.getElementById('status-text');
    const statusDetail = document.getElementById('status-detail');
    
    try {
        const response = await fetch(`${API_URL}/api/v1/sessions`);
        const sessions = await response.json();
        
        const session = sessions.find(s => s.sessionId === SESSION_ID);
        
        if (!session) {
            statusText.textContent = 'Not Connected';
            statusText.style.background = '#dc3545';
            statusDetail.textContent = 'No WhatsApp session found. Click "Connect WhatsApp" to start.';
            document.getElementById('qr-code-section').style.display = 'none';
            document.getElementById('connected-section').style.display = 'none';
            document.getElementById('connect-btn').style.display = 'inline-block';
            return;
        }
        
        if (session.status === 'CONNECTED') {
            statusText.textContent = 'Connected';
            statusText.style.background = '#28a745';
            statusDetail.textContent = session.detail || 'WhatsApp is connected and ready to send messages.';
            document.getElementById('qr-code-section').style.display = 'none';
            document.getElementById('connected-section').style.display = 'block';
            document.getElementById('connect-btn').style.display = 'none';
            stopStatusChecking();
        } else if (session.qr) {
            statusText.textContent = 'Waiting for QR Scan';
            statusText.style.background = '#ffc107';
            statusDetail.textContent = 'Please scan the QR code below with your WhatsApp mobile app.';
            document.getElementById('qr-code-section').style.display = 'block';
            document.getElementById('connected-section').style.display = 'none';
            document.getElementById('connect-btn').style.display = 'none';
            
            const canvas = document.getElementById('qr-canvas');
            QRCode.toCanvas(canvas, session.qr, { 
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            }, function (error) {
                if (error) console.error(error);
            });
        } else if (session.status === 'DISCONNECTED' || session.status === 'CLOSED') {
            statusText.textContent = 'Disconnected';
            statusText.style.background = '#dc3545';
            statusDetail.textContent = 'WhatsApp connection was closed. Click "Reconnect WhatsApp" to connect again.';
            document.getElementById('qr-code-section').style.display = 'none';
            document.getElementById('connected-section').style.display = 'none';
            document.getElementById('connect-btn').style.display = 'inline-block';
            document.getElementById('connect-btn').innerHTML = '<i class="icon">🔗</i> Reconnect WhatsApp';
        } else {
            statusText.textContent = session.status || 'Initializing';
            statusText.style.background = '#17a2b8';
            statusDetail.textContent = session.detail || 'Setting up WhatsApp connection...';
            document.getElementById('qr-code-section').style.display = 'none';
            document.getElementById('connected-section').style.display = 'none';
        }
    } catch (error) {
        statusText.textContent = 'Error';
        statusText.style.background = '#dc3545';
        statusDetail.textContent = 'Could not connect to WhatsApp API server: ' + error.message;
    }
}

async function disconnectWhatsApp() {
    if (!confirm('Are you sure you want to disconnect WhatsApp? You will need to scan the QR code again.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/v1/sessions/${SESSION_ID}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.status === 'success' || response.ok) {
            localStorage.removeItem('whatsapp_session_token');
            sessionToken = null;
            
            $.post(SITE_URL + '/api/save_whatsapp_token.php', { 
                session_token: '' 
            });
            
            alert('WhatsApp disconnected successfully');
            location.reload();
        } else {
            alert('Error disconnecting: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function startStatusChecking() {
    stopStatusChecking();
    checkStatus();
    statusCheckInterval = setInterval(checkStatus, 3000);
}

function stopStatusChecking() {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        statusCheckInterval = null;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (API_URL && API_KEY) {
        checkStatus();
    }
});
</script>

<?php include '../includes/footer.php'; ?>
