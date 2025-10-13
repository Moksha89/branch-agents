// Global WhatsApp functionality
(function() {
    'use strict';
    
    // Function to send WhatsApp report to individual agent
    window.sendWhatsApp = function(agentId, agentName) {
        const whatsappToken = localStorage.getItem('whatsapp_session_token');
        if (!whatsappToken) {
            alert('❌ WhatsApp is not connected. Please connect WhatsApp in Settings → WhatsApp Connection first.');
            return;
        }
        
        const button = document.querySelector(`.whatsapp-btn[data-agent-id="${agentId}"]`);
        if (!button) {
            console.error('WhatsApp button not found for agent:', agentId);
            return;
        }
        
        const originalText = button.innerHTML;
        button.innerHTML = '⏳ Sending...';
        button.disabled = true;
        
        // Sync token to PHP session first
        $.ajax({
            url: SITE_URL + '/api/save_whatsapp_token.php',
            method: 'POST',
            data: { session_token: whatsappToken },
            success: function() {
                // Now send the WhatsApp message
                $.ajax({
                    url: SITE_URL + '/api/send_whatsapp.php',
                    method: 'POST',
                    data: { agent_id: agentId },
                    dataType: 'json',
                    success: function(response) {
                        button.innerHTML = originalText;
                        button.disabled = false;
                        
                        if (response.success) {
                            alert('✅ Report sent successfully to ' + agentName);
                        } else {
                            alert('❌ Failed to send report: ' + (response.error || 'Unknown error'));
                        }
                    },
                    error: function(xhr) {
                        button.innerHTML = originalText;
                        button.disabled = false;
                        
                        let errorMsg = 'Network error';
                        try {
                            const response = JSON.parse(xhr.responseText);
                            errorMsg = response.error || errorMsg;
                        } catch(e) {}
                        alert('❌ Failed to send report: ' + errorMsg);
                    }
                });
            },
            error: function() {
                button.innerHTML = originalText;
                button.disabled = false;
                alert('❌ Failed to sync WhatsApp session. Please try again.');
            }
        });
    };
})();
