$(document).ready(function() {
    $('#menuToggle').click(function() {
        $('.sidebar').toggleClass('active');
    });
    
    $(document).click(function(e) {
        if (!$(e.target).closest('.sidebar, #menuToggle').length) {
            $('.sidebar').removeClass('active');
        }
    });
    
    $('.editable-balance').on('dblclick', function() {
        var $this = $(this);
        var currentValue = $this.text().replace('₹', '').replace(/,/g, '').trim();
        var branchId = $this.data('branch-id');
        
        var $input = $('<input type="number" step="0.01" class="balance-input" value="' + currentValue + '" />');
        
        $this.html($input);
        $input.focus().select();
        
        $input.on('blur', function() {
            var newValue = parseFloat($(this).val()) || 0;
            updateBalance(branchId, newValue, $this);
        });
        
        $input.on('keypress', function(e) {
            if (e.which === 13) {
                $(this).blur();
            }
        });
    });
    
    function updateBalance(branchId, newBalance, $element) {
        $.ajax({
            url: SITE_URL + '/api/update_balance.php',
            method: 'POST',
            data: {
                branch_id: branchId,
                balance: newBalance
            },
            success: function(response) {
                if (response.success) {
                    $element.html(formatCurrency(newBalance));
                    $element.removeClass('text-danger text-success');
                    $element.addClass(newBalance < 0 ? 'text-danger' : 'text-success');
                    
                    showNotification('Balance updated successfully', 'success');
                    
                    if (typeof refreshTotals === 'function') {
                        refreshTotals();
                    }
                } else {
                    $element.html(formatCurrency($element.data('original-value')));
                    showNotification('Error updating balance', 'error');
                }
            },
            error: function() {
                $element.html(formatCurrency($element.data('original-value')));
                showNotification('Error updating balance', 'error');
            }
        });
    }
    
    function formatCurrency(amount) {
        return '₹' + parseFloat(amount).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
    function showNotification(message, type) {
        var alertClass = type === 'success' ? 'alert-success' : 'alert-error';
        var $alert = $('<div class="alert ' + alertClass + '">' + message + '</div>');
        $('.content-wrapper').prepend($alert);
        
        setTimeout(function() {
            $alert.fadeOut(function() {
                $(this).remove();
            });
        }, 3000);
    }
    
    window.sendWhatsApp = function(agentId, agentName) {
        if (!confirm('Send report to ' + agentName + ' via WhatsApp?')) {
            return;
        }
        
        var $btn = $('button[data-agent-id="' + agentId + '"]');
        var originalText = $btn.html();
        $btn.html('Sending...').prop('disabled', true);
        
        $.ajax({
            url: SITE_URL + '/api/send_whatsapp.php',
            method: 'POST',
            data: { agent_id: agentId },
            success: function(response) {
                if (response.success) {
                    showNotification('WhatsApp message sent successfully', 'success');
                } else {
                    showNotification('Error: ' + response.error, 'error');
                }
                $btn.html(originalText).prop('disabled', false);
            },
            error: function() {
                showNotification('Error sending WhatsApp message', 'error');
                $btn.html(originalText).prop('disabled', false);
            }
        });
    };
});
