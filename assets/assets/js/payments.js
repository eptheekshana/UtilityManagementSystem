// ========================================
// PAYMENT PROCESSING JAVASCRIPT
// ========================================

let selectedBill = null;

document.addEventListener('DOMContentLoaded', function() {
    setupSearch();
    setupPaymentForm();
    
    // Check if bill ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const billId = urlParams.get('billId');
    if (billId) {
        loadBillById(billId);
    }
});

// SETUP SEARCH
function setupSearch() {
    const searchInput = document.getElementById('billSearch');
    searchInput.addEventListener('input', debounce(searchBills, 500));
}

// SEARCH BILLS
async function searchBills() {
    const searchTerm = document.getElementById('billSearch').value;
    
    if (searchTerm.length < 2) {
        document.getElementById('billResults').innerHTML = '';
        return;
    }
    
    try {
        const response = await fetch(
            `http://localhost:3000/api/billing/search?q=${searchTerm}`,
            {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                }
            }
        );
        
        const result = await response.json();
        
        if (result.success) {
            displayBillResults(result.data);
        }
        
    } catch (error) {
        console.error('Error searching bills:', error);
    }
}

// DISPLAY BILL RESULTS
function displayBillResults(bills) {
    const container = document.getElementById('billResults');
    container.innerHTML = '';
    
    if (bills.length === 0) {
        container.innerHTML = '<p class="no-results">No bills found</p>';
        return;
    }
    
    bills.forEach(bill => {
        const item = document.createElement('div');
        item.className = 'bill-result-item';
        item.innerHTML = `
            <div class="bill-result-header">
                <strong>Bill #${bill.BillingID}</strong>
                <span class="status-badge ${bill.PaymentStatus.toLowerCase()}">${bill.PaymentStatus}</span>
            </div>
            <div class="bill-result-info">
                <p><i class="fas fa-user"></i> ${bill.CustomerName}</p>
                <p><i class="fas fa-tachometer-alt"></i> ${bill.MeterNumber}</p>
                <p><i class="fas fa-dollar-sign"></i> Outstanding: <strong>${formatCurrency(bill.OutstandingBalance)}</strong></p>
            </div>
        `;
        item.onclick = () => selectBill(bill);
        container.appendChild(item);
    });
}

// LOAD BILL BY ID
async function loadBillById(billId) {
    try {
        const response = await fetch(
            `http://localhost:3000/api/billing/${billId}`,
            {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                }
            }
        );
        
        const result = await response.json();
        
        if (result.success) {
            selectBill(result.data);
        }
        
    } catch (error) {
        console.error('Error loading bill:', error);
    }
}

// SELECT BILL
function selectBill(bill) {
    selectedBill = bill;
    
    // Highlight selected
    document.querySelectorAll('.bill-result-item').forEach(item => {
        item.classList.remove('selected');
    });
    event.currentTarget?.classList.add('selected');
    
    // Show bill info
    document.getElementById('selectedBillInfo').style.display = 'block';
    document.getElementById('paymentForm').style.display = 'block';
    document.getElementById('noSelectMessage').style.display = 'none';
    
    // Populate bill info
    document.getElementById('displayBillId').textContent = bill.BillingID;
    document.getElementById('displayCustomer').textContent = bill.CustomerName;
    document.getElementById('displayTotal').textContent = formatCurrency(bill.TotalAmount);
    document.getElementById('displayOutstanding').textContent = formatCurrency(bill.OutstandingBalance);
    
    // Set form values
    document.getElementById('billingId').value = bill.BillingID;
    document.getElementById('amountPaid').max = bill.OutstandingBalance;
    document.getElementById('amountPaid').value = bill.OutstandingBalance;
    document.getElementById('maxAmount').textContent = bill.OutstandingBalance.toFixed(2);
}

// SETUP PAYMENT FORM
function setupPaymentForm() {
    const form = document.getElementById('paymentForm');
    const paymentMethod = document.getElementById('paymentMethod');
    
    paymentMethod.addEventListener('change', function() {
        const refGroup = document.getElementById('transactionRefGroup');
        if (['Bank Transfer', 'Mobile Money', 'Cheque'].includes(this.value)) {
            refGroup.style.display = 'block';
        } else {
            refGroup.style.display = 'none';
        }
    });
    
    form.addEventListener('submit', processPayment);
}

// PROCESS PAYMENT
async function processPayment(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const paymentData = Object.fromEntries(formData);
    
    // Validate amount
    if (parseFloat(paymentData.amountPaid) > selectedBill.OutstandingBalance) {
        alert('Payment amount cannot exceed outstanding balance');
        return;
    }
    
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    btn.disabled = true;
    
    try {
        const response = await fetch('http://localhost:3000/api/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            },
            body: JSON.stringify(paymentData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            btn.innerHTML = '<i class="fas fa-check"></i> Success!';
            btn.style.background = 'linear-gradient(135deg, #11998e, #38ef7d)';
            
            showNotification('success', `Payment of ${formatCurrency(paymentData.amountPaid)} processed successfully`);
            
            setTimeout(() => {
                window.location.href = 'receipts.html?paymentId=' + result.data.PaymentID;
            }, 2000);
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('Error processing payment:', error);
        btn.innerHTML = '<i class="fas fa-times"></i> Failed';
        btn.style.background = 'linear-gradient(135deg, #fa709a, #fee140)';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
            btn.disabled = false;
        }, 2000);
        
        showNotification('error', 'Payment processing failed: ' + error.message);
    }
}

// RESET PAYMENT FORM
function resetPaymentForm() {
    document.getElementById('paymentForm').reset();
    document.getElementById('selectedBillInfo').style.display = 'none';
    document.getElementById('paymentForm').style.display = 'none';
    document.getElementById('noSelectMessage').style.display = 'block';
    selectedBill = null;
}

// DEBOUNCE
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// UTILITY FUNCTIONS
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function showNotification(type, message) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#fa709a' : '#4facfe'};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        animation: slideInRight 0.5s ease-out;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.5s ease-out';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

function logout() {
    sessionStorage.clear();
    window.location.href = '../index.html';
}