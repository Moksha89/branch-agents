<?php

define('WHATSAPP_GRAPH_API_URL', 'https://graph.facebook.com/v18.0');

function sendWhatsAppMessage($to, $message, $imagePath = null) {
    global $pdo;
    
    $stmt = $pdo->query("SELECT * FROM whatsapp_config WHERE id = 1");
    $config = $stmt->fetch();
    
    if (!$config) {
        return ['success' => false, 'error' => 'WhatsApp not configured. Please configure in Settings.'];
    }
    
    if (!$config['is_active']) {
        return ['success' => false, 'error' => 'WhatsApp integration is not active'];
    }
    
    $apiType = $config['api_type'] ?? 'web';
    
    if ($apiType === 'business') {
        return sendWhatsAppBusinessMessage($to, $message, $imagePath, $config);
    } else {
        return sendWhatsAppWebMessage($to, $message, $imagePath, $config);
    }
}

function sendWhatsAppWebMessage($to, $message, $imagePath, $config) {
    global $pdo;
    
    if (empty($config['api_url']) || empty($config['api_key'])) {
        return ['success' => false, 'error' => 'WhatsApp Web API not configured. Please configure in Settings.'];
    }
    
    $sessionToken = $config['session_token'] ?? null;
    
    if (!$sessionToken) {
        return ['success' => false, 'error' => 'WhatsApp session not connected. Please connect WhatsApp in Settings.'];
    }
    
    $apiUrl = rtrim($config['api_url'], '/');
    
    $to = preg_replace('/[^0-9]/', '', $to);
    if (strlen($to) == 10) {
        $to = '91' . $to;
    }
    
    $results = [];
    
    if (!empty($message)) {
        $payload = [
            'to' => $to,
            'type' => 'text',
            'text' => [
                'body' => $message
            ]
        ];
        
        $textResult = sendWhatsAppPayload($apiUrl, $payload, $sessionToken);
        $results['text'] = $textResult;
    } else {
        $results['text'] = ['success' => true];
    }
    
    if ($imagePath && file_exists($imagePath)) {
        $uploadResult = uploadMediaToWhatsApp($apiUrl, $imagePath, $sessionToken);
        
        if ($uploadResult['success']) {
            $imagePayload = [
                'to' => $to,
                'type' => 'image',
                'image' => [
                    'id' => $uploadResult['mediaId']
                ]
            ];
            
            $imageResult = sendWhatsAppPayload($apiUrl, $imagePayload, $sessionToken);
            $results['image'] = $imageResult;
            
            @unlink($imagePath);
        } else {
            $results['image'] = $uploadResult;
        }
    }
    
    if ($results['text']['success']) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO whatsapp_logs (agent_id, agent_name, phone_number, message_text, status, sent_at)
                SELECT a.id, a.name, ?, ?, 'success', NOW()
                FROM agents a
                JOIN agent_phones ap ON a.id = ap.agent_id
                WHERE ap.phone = ?
                LIMIT 1
            ");
            $cleanPhone = preg_replace('/[^0-9]/', '', $to);
            if (strlen($cleanPhone) > 10) {
                $cleanPhone = substr($cleanPhone, -10);
            }
            $stmt->execute([$to, $message, $cleanPhone]);
        } catch (PDOException $e) {
            error_log("Failed to log WhatsApp message: " . $e->getMessage());
        }
        
        return ['success' => true, 'response' => $results];
    } else {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO whatsapp_logs (agent_id, agent_name, phone_number, message_text, status, error_message, sent_at)
                SELECT a.id, a.name, ?, ?, 'failed', ?, NOW()
                FROM agents a
                JOIN agent_phones ap ON a.id = ap.agent_id
                WHERE ap.phone = ?
                LIMIT 1
            ");
            $cleanPhone = preg_replace('/[^0-9]/', '', $to);
            if (strlen($cleanPhone) > 10) {
                $cleanPhone = substr($cleanPhone, -10);
            }
            $errorMsg = $results['text']['error'] ?? 'Unknown error';
            $stmt->execute([$to, $message, $errorMsg, $cleanPhone]);
        } catch (PDOException $e) {
            error_log("Failed to log WhatsApp error: " . $e->getMessage());
        }
        
        return $results['text'];
    }
}

function sendWhatsAppPayload($apiUrl, $payload, $sessionToken) {
    $ch = curl_init($apiUrl . '/api/v1/messages?sessionId=hisaab_portal');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $sessionToken,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        return ['success' => false, 'error' => 'Connection error: ' . $curlError];
    }
    
    if ($httpCode == 200) {
        $result = json_decode($response, true);
        
        if (is_array($result) && !isset($result['status']) && isset($result[0])) {
            $result = $result[0];
        }
        
        if (isset($result['status']) && $result['status'] === 'success') {
            return ['success' => true, 'response' => $result];
        } else {
            return ['success' => false, 'error' => $result['message'] ?? 'Unknown error'];
        }
    } else {
        $errorData = json_decode($response, true);
        $errorMsg = $errorData['message'] ?? 'HTTP Error ' . $httpCode;
        return ['success' => false, 'error' => $errorMsg];
    }
}

function uploadMediaToWhatsApp($apiUrl, $filePath, $sessionToken) {
    $ch = curl_init($apiUrl . '/api/v1/media');
    
    $cfile = new CURLFile($filePath, mime_content_type($filePath), basename($filePath));
    
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, ['file' => $cfile]);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $sessionToken
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        return ['success' => false, 'error' => 'Upload error: ' . $curlError];
    }
    
    if ($httpCode == 201) {
        $result = json_decode($response, true);
        if (isset($result['status']) && $result['status'] === 'success' && isset($result['mediaId'])) {
            return ['success' => true, 'mediaId' => $result['mediaId']];
        }
    }
    
    return ['success' => false, 'error' => 'Upload failed: HTTP ' . $httpCode];
}

function sendWhatsAppBusinessMessage($to, $message, $imagePath, $config) {
    global $pdo;
    
    if (empty($config['access_token']) || empty($config['phone_number_id'])) {
        return ['success' => false, 'error' => 'WhatsApp Business API not configured. Please configure Facebook Business Manager in Settings.'];
    }
    
    $to = preg_replace('/[^0-9]/', '', $to);
    if (strlen($to) == 10) {
        $to = '91' . $to;
    }
    
    $results = [];
    $graphApiUrl = WHATSAPP_GRAPH_API_URL . '/' . $config['phone_number_id'] . '/messages';
    
    if (!empty($message)) {
        $payload = [
            'messaging_product' => 'whatsapp',
            'to' => $to,
            'type' => 'text',
            'text' => [
                'body' => $message
            ]
        ];
        
        $textResult = sendGraphApiRequest($graphApiUrl, $payload, $config['access_token']);
        $results['text'] = $textResult;
    } else {
        $results['text'] = ['success' => true];
    }
    
    if ($imagePath && file_exists($imagePath)) {
        $mediaUrl = uploadMediaToFacebook($config['phone_number_id'], $imagePath, $config['access_token']);
        
        if ($mediaUrl['success']) {
            $imagePayload = [
                'messaging_product' => 'whatsapp',
                'to' => $to,
                'type' => 'image',
                'image' => [
                    'id' => $mediaUrl['media_id']
                ]
            ];
            
            $imageResult = sendGraphApiRequest($graphApiUrl, $imagePayload, $config['access_token']);
            $results['image'] = $imageResult;
            
            @unlink($imagePath);
        } else {
            $results['image'] = $mediaUrl;
        }
    }
    
    if ($results['text']['success']) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO whatsapp_logs (agent_id, agent_name, phone_number, message_text, status, sent_at)
                SELECT a.id, a.name, ?, ?, 'success', NOW()
                FROM agents a
                JOIN agent_phones ap ON a.id = ap.agent_id
                WHERE ap.phone = ?
                LIMIT 1
            ");
            $cleanPhone = preg_replace('/[^0-9]/', '', $to);
            if (strlen($cleanPhone) > 10) {
                $cleanPhone = substr($cleanPhone, -10);
            }
            $stmt->execute([$to, $message, $cleanPhone]);
        } catch (PDOException $e) {
            error_log("Failed to log WhatsApp message: " . $e->getMessage());
        }
        
        return ['success' => true, 'response' => $results];
    } else {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO whatsapp_logs (agent_id, agent_name, phone_number, message_text, status, error_message, sent_at)
                SELECT a.id, a.name, ?, ?, 'failed', ?, NOW()
                FROM agents a
                JOIN agent_phones ap ON a.id = ap.agent_id
                WHERE ap.phone = ?
                LIMIT 1
            ");
            $cleanPhone = preg_replace('/[^0-9]/', '', $to);
            if (strlen($cleanPhone) > 10) {
                $cleanPhone = substr($cleanPhone, -10);
            }
            $errorMsg = $results['text']['error'] ?? 'Unknown error';
            $stmt->execute([$to, $message, $errorMsg, $cleanPhone]);
        } catch (PDOException $e) {
            error_log("Failed to log WhatsApp error: " . $e->getMessage());
        }
        
        return $results['text'];
    }
}

function sendGraphApiRequest($url, $payload, $accessToken) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $accessToken,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        return ['success' => false, 'error' => 'Connection error: ' . $curlError];
    }
    
    $result = json_decode($response, true);
    
    if ($httpCode >= 200 && $httpCode < 300) {
        return ['success' => true, 'response' => $result];
    } else {
        $errorMsg = isset($result['error']['message']) ? $result['error']['message'] : 'HTTP Error ' . $httpCode;
        return ['success' => false, 'error' => $errorMsg];
    }
}

function uploadMediaToFacebook($phoneNumberId, $filePath, $accessToken) {
    $url = WHATSAPP_GRAPH_API_URL . '/' . $phoneNumberId . '/media';
    
    $cfile = new CURLFile($filePath, mime_content_type($filePath), basename($filePath));
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, [
        'file' => $cfile,
        'messaging_product' => 'whatsapp'
    ]);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $accessToken
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode >= 200 && $httpCode < 300) {
        $result = json_decode($response, true);
        if (isset($result['id'])) {
            return ['success' => true, 'media_id' => $result['id']];
        }
    }
    
    return ['success' => false, 'error' => 'Upload failed: HTTP ' . $httpCode];
}

function generateAgentReport($agentId) {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT a.name, a.id
        FROM agents a
        WHERE a.id = ?
    ");
    $stmt->execute([$agentId]);
    $agent = $stmt->fetch();
    
    if (!$agent) {
        return null;
    }
    
    $stmt = $pdo->prepare("
        SELECT 
            s.name as site_name,
            b.branch_code,
            b.balance
        FROM branches b
        JOIN sites s ON b.site_id = s.id
        WHERE b.agent_id = ?
        ORDER BY s.name, b.branch_code
    ");
    $stmt->execute([$agentId]);
    $branches = $stmt->fetchAll();
    
    $stmt = $pdo->query("SELECT header_template, footer_template FROM whatsapp_config WHERE id = 1");
    $templates = $stmt->fetch();
    
    $totalBalance = 0;
    $message = '';
    
    if ($templates && !empty($templates['header_template'])) {
        $header = str_replace(
            ['{agent}', '{date}', '{time}'],
            [$agent['name'], date('d-M-Y'), date('h:i A')],
            $templates['header_template']
        );
        $message .= $header . "\n\n";
    }
    
    $message .= "*Hisaab Report - " . $agent['name'] . "*\n";
    $message .= "Date: " . date('d-M-Y h:i A') . "\n\n";
    
    $currentSite = '';
    foreach ($branches as $branch) {
        if ($currentSite != $branch['site_name']) {
            if ($currentSite != '') {
                $message .= "\n";
            }
            $message .= "*" . $branch['site_name'] . "*\n";
            $currentSite = $branch['site_name'];
        }
        $message .= "  • " . $branch['branch_code'] . ": ₹" . number_format($branch['balance'], 2) . "\n";
        $totalBalance += $branch['balance'];
    }
    
    $message .= "\n━━━━━━━━━━━━━━━\n";
    $message .= "*Total Balance: ₹" . number_format($totalBalance, 2) . "*";
    
    if ($templates && !empty($templates['footer_template'])) {
        $footer = str_replace(
            ['{agent}', '{total}', '{date}', '{time}'],
            [$agent['name'], '₹' . number_format($totalBalance, 2), date('d-M-Y'), date('h:i A')],
            $templates['footer_template']
        );
        $message .= "\n\n" . $footer;
    }
    
    return $message;
}

function generateBranchDetailsPNG($agentId) {
    global $pdo;
    
    $stmt = $pdo->prepare("SELECT name FROM agents WHERE id = ?");
    $stmt->execute([$agentId]);
    $agent = $stmt->fetch();
    
    if (!$agent) {
        return null;
    }
    
    $stmt = $pdo->prepare("
        SELECT 
            s.name as site_name,
            b.branch_code,
            b.balance
        FROM branches b
        JOIN sites s ON b.site_id = s.id
        WHERE b.agent_id = ?
        ORDER BY s.name, b.branch_code
    ");
    $stmt->execute([$agentId]);
    $branches = $stmt->fetchAll();
    
    $hasNoBranches = empty($branches);
    
    $width = 800;
    $rowHeight = 35;
    $headerHeight = 80;
    $footerHeight = 50;
    $rows = $hasNoBranches ? 1 : (count($branches) + 1);
    $height = $headerHeight + ($rows * $rowHeight) + $footerHeight;
    
    $image = imagecreatetruecolor($width, $height);
    
    $white = imagecolorallocate($image, 255, 255, 255);
    $black = imagecolorallocate($image, 0, 0, 0);
    $headerBg = imagecolorallocate($image, 41, 128, 185);
    $rowBg1 = imagecolorallocate($image, 248, 249, 250);
    $rowBg2 = imagecolorallocate($image, 255, 255, 255);
    $borderColor = imagecolorallocate($image, 200, 200, 200);
    $green = imagecolorallocate($image, 40, 167, 69);
    $red = imagecolorallocate($image, 220, 53, 69);
    
    imagefilledrectangle($image, 0, 0, $width, $height, $white);
    
    $titleFont = 5;
    $title = "Branch Details Report - " . $agent['name'];
    $titleWidth = imagefontwidth($titleFont) * strlen($title);
    $titleX = ($width - $titleWidth) / 2;
    imagestring($image, $titleFont, $titleX, 20, $title, $headerBg);
    
    $date = date('d-M-Y h:i A');
    $dateWidth = imagefontwidth($titleFont) * strlen($date);
    $dateX = ($width - $dateWidth) / 2;
    imagestring($image, $titleFont, $dateX, 45, $date, $black);
    
    $y = $headerHeight;
    imagefilledrectangle($image, 0, $y, $width, $y + $rowHeight, $headerBg);
    
    $font = 3;
    imagestring($image, $font, 20, $y + 10, "Site Name", $white);
    imagestring($image, $font, 320, $y + 10, "Branch Code", $white);
    imagestring($image, $font, 560, $y + 10, "Balance", $white);
    
    $y += $rowHeight;
    
    if ($hasNoBranches) {
        imagefilledrectangle($image, 0, $y, $width, $y + $rowHeight, $rowBg1);
        $noDataMsg = "No branches assigned to this agent";
        $msgWidth = imagefontwidth($font) * strlen($noDataMsg);
        $msgX = ($width - $msgWidth) / 2;
        imagestring($image, $font, $msgX, $y + 10, $noDataMsg, $black);
        $totalBalance = 0;
        $y += $rowHeight;
    } else {
        $totalBalance = 0;
        $rowIndex = 0;
        
        foreach ($branches as $branch) {
            $bgColor = ($rowIndex % 2 == 0) ? $rowBg1 : $rowBg2;
            imagefilledrectangle($image, 0, $y, $width, $y + $rowHeight, $bgColor);
            
            imagerectangle($image, 0, $y, $width, $y + $rowHeight, $borderColor);
            
            imagestring($image, $font, 20, $y + 10, substr($branch['site_name'], 0, 30), $black);
            imagestring($image, $font, 320, $y + 10, $branch['branch_code'], $black);
            
            $balance = number_format($branch['balance'], 2);
            $balanceColor = ($branch['balance'] < 0) ? $red : $green;
            imagestring($image, $font, 560, $y + 10, 'Rs. ' . $balance, $balanceColor);
            
            $totalBalance += $branch['balance'];
            $y += $rowHeight;
            $rowIndex++;
        }
    }
    
    imagefilledrectangle($image, 0, $y, $width, $y + $rowHeight, $headerBg);
    imagestring($image, $font, 20, $y + 10, "TOTAL BALANCE", $white);
    $totalText = 'Rs. ' . number_format($totalBalance, 2);
    imagestring($image, $font, 560, $y + 10, $totalText, $white);
    
    $filename = '/tmp/branch_report_' . $agentId . '_' . time() . '.png';
    imagepng($image, $filename);
    imagedestroy($image);
    
    return $filename;
}
