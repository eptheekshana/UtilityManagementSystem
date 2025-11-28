// ========================================
// BILLING MANAGEMENT JAVASCRIPT
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    loadBills();
    setupFilters();
});

let billsData = [];

// LOAD BILLS
async function loadBills() {
    try {
        const response = await fetch('http://localhost:3000/api/billing', {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            billsData = result.data;
            updateStats();
            displayBills(billsData);
        }
        
    } catch (error) {
        console.error('Error loading bills:', error);
        showNotification('error', 'Failed to load bills');
    }
}

// UPDATE STATS
function updateStats() {
    const total = billsData.length;
    const paid = billsData.filter(b => b.PaymentStatus === 'Paid').length;
    const pending = billsData.filter(b => b.PaymentStatus === 'Pending').length;
    const overdue = billsData.filter(b => b.PaymentStatus === 'Overdue').length;
    
    document.getElementById('totalBills').textContent = total;
    document.getElementById('paidBills').textContent = paid;
    document.getElementById('pendingBills').textContent = pending;
    document.getElementById('overdueBills').textContent = overdue;
}

// DISPLAY BILLS
function displayBills(bills) {
    const tbody = document.getElementById('billsTableBody');
    tbody.innerHTML = '';
    
    if (bills.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px;">
                    <div class="empty-state">
                        <i class="fas fa-file-invoice"></i>
                        <h3>No Bills Found</h3>
                        <p>No billing records match your criteria</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    bills.forEach(bill => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>#${bill.BillingID}</strong></td>
            <td>${bill.CustomerName}</td>
            <td>${bill.MeterNumber}</td>
            <td><span class="badge badge-${bill.UtilityType.toLowerCase()}">${bill.UtilityType}</span></td>
            <td>${formatDate(bill.BillingPeriodStart)} - ${formatDate(bill.BillingPeriodEnd)}</td>
            <td><strong>${formatCurrency(bill.TotalAmount)}</strong></td>
            <td>${formatDate(bill.DueDate)}</td>
            <td><span class="status-badge ${bill.PaymentStatus.toLowerCase()}">${bill.PaymentStatus}</span></td>
            <td>
                <button class="btn-icon" onclick="viewBill(${bill.BillingID})" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="printBill(${bill.BillingID})" title="Print">
                    <i class="fas fa-print"></i>
                </button>
                ${bill.PaymentStatus !== 'Paid' ? `
                    <button class="btn-icon" onclick="processPayment(${bill.BillingID})" title="Pay">
                        <i class="fas fa-credit-card"></i>
                    </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// SETUP FILTERS
function setupFilters() {
    document.getElementById('searchBill').addEventListener('input', filterBills);
    document.getElementById('filterStatus').addEventListener('change', filterBills);
    document.getElementById('filterMonth').addEventListener('change', filterBills);
}

// FILTER BILLS
function filterBills() {
    const searchTerm = document.getElementById('searchBill').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;
    const monthFilter = document.getElementById('filterMonth').value;
    
    let filtered = billsData;
    
    if (searchTerm) {
        filtered = filtered.filter(b => 
            b.CustomerName.toLowerCase().includes(searchTerm) ||
            b.BillingID.toString().includes(searchTerm)
        );
    }
    
    if (statusFilter) {
        filtered = filtered.filter(b => b.PaymentStatus === statusFilter);
    }
    
    if (monthFilter) {
        filtered = filtered.filter(b => {
            const billMonth = new Date(b.BillingDate).getMonth() + 1;
            return billMonth.toString().padStart(2, '0') === monthFilter;
        });
    }
    
    displayBills(filtered);
}

// VIEW BILL
function viewBill(billId) {
    window.location.href = `view_bill.html?id=${billId}`;
}

// PRINT BILL
async function printBill(billId) {
    try {
        const response = await fetch(`http://localhost:3000/api/billing/${billId}`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const bill = result.data;
            
            // Create print window
            const printWindow = window.open('', '', 'width=800,height=600');
            printWindow.document.write(generateBillHTML(bill));
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
        
    } catch (error) {
        console.error('Error printing bill:', error);
        showNotification('error', 'Failed to print bill');
    }
}

// GENERATE BILL HTML
function generateBillHTML(bill) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bill #${bill.BillingID}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
                .bill-details { margin: 20px 0; }
                .row { display: flex; justify-content: space-between; margin: 10px 0; }
                .total { font-size: 20px; font-weight: bold; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>UTILITY MANAGEMENT SYSTEM</h1>
                <p>Bill #${bill.BillingID}</p>
            </div>
            <div class="bill-details">
                <div class="row"><span>Customer:</span><strong>${bill.CustomerName}</strong></div>
                <div class="row"><span>Meter:</span><strong>${bill.MeterNumber}</strong></div>
                <div class="row"><span>Period:</span><strong>${formatDate(bill.BillingPeriodStart)} - ${formatDate(bill.BillingPeriodEnd)}</strong></div>
                <div class="row"><span>Consumption:</span><strong>${bill.Consumption} units</strong></div>
                <div class="row"><span>Rate:</span><strong>${formatCurrency(bill.RateApplied)}/unit</strong></div>
                <div class="row"><span>Base Amount:</span><strong>${formatCurrency(bill.BaseAmount)}</strong></div>
                <div class="row"><span>Tax:</span><strong>${formatCurrency(bill.TaxAmount)}</strong></div>
                <div class="total">
                    <div class="row"><span>TOTAL AMOUNT:</span><strong>${formatCurrency(bill.TotalAmount)}</strong></div>
                </div>
            </div>
        </body>
        </html>
    `;
}

// PROCESS PAYMENT
function processPayment(billId) {
    window.location.href = `../payments/payments.html?billId=${billId}`;
}

// UTILITY FUNCTIONS
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
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