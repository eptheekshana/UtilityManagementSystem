// ========================================
// BILL GENERATION WIZARD
// ========================================

let currentStep = 1;
let selectedCustomer = null;
let selectedMeter = null;
let billCalculation = null;

document.addEventListener('DOMContentLoaded', function() {
    setupWizard();
    loadCustomers();
});

// SETUP WIZARD
function setupWizard() {
    document.getElementById('nextToStep2').addEventListener('click', () => goToStep(2));
    document.getElementById('nextToStep3').addEventListener('click', calculateBill);
    document.getElementById('generateBillBtn').addEventListener('click', generateBill);
}

// LOAD CUSTOMERS
async function loadCustomers() {
    try {
        const response = await fetch('http://localhost:3000/api/customers', {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayCustomers(result.data);
        }
        
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

// DISPLAY CUSTOMERS
function displayCustomers(customers) {
    const container = document.getElementById('customerResults');
    container.innerHTML = '';
    
    customers.forEach(customer => {
        const card = document.createElement('div');
        card.className = 'customer-card';
        card.innerHTML = `
            <h4>${customer.FirstName} ${customer.LastName}</h4>
            <p><i class="fas fa-id-card"></i> ID: ${customer.CustomerID}</p>
            <p><i class="fas fa-envelope"></i> ${customer.Email}</p>
            <p><i class="fas fa-phone"></i> ${customer.Phone}</p>
        `;
        card.onclick = () => selectCustomer(customer);
        container.appendChild(card);
    });
}

// SELECT CUSTOMER
async function selectCustomer(customer) {
    selectedCustomer = customer;
    
    // Highlight selected
    document.querySelectorAll('.customer-card').forEach(c => c.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    
    // Load customer meters
    await loadCustomerMeters(customer.CustomerID);
    
    document.getElementById('meterSelection').style.display = 'block';
}

// LOAD CUSTOMER METERS
async function loadCustomerMeters(customerId) {
    try {
        const response = await fetch(`http://localhost:3000/api/meters?customerId=${customerId}`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayMeters(result.data);
        }
        
    } catch (error) {
        console.error('Error loading meters:', error);
    }
}

// DISPLAY METERS
function displayMeters(meters) {
    const container = document.getElementById('meterList');
    container.innerHTML = '';
    
    meters.forEach(meter => {
        const card = document.createElement('div');
        card.className = 'meter-select-card';
        card.innerHTML = `
            <div class="meter-icon-small">
                <i class="fas fa-tachometer-alt"></i>
            </div>
            <h5>${meter.MeterNumber}</h5>
            <p>${meter.UtilityType}</p>
            <span class="badge">${meter.MeterType}</span>
        `;
        card.onclick = () => selectMeter(meter);
        container.appendChild(card);
    });
}

// SELECT METER
function selectMeter(meter) {
    selectedMeter = meter;
    
    document.querySelectorAll('.meter-select-card').forEach(c => c.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    
    document.getElementById('nextToStep2').disabled = false;
}

// GO TO STEP
function goToStep(step) {
    // Hide all steps
    document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
    
    // Show target step
    document.getElementById(`step${step}`).classList.add('active');
    currentStep = step;
    
    if (step === 2) {
        populateStep2();
    }
}

// POPULATE STEP 2
function populateStep2() {
    document.getElementById('selectedCustomerName').textContent = 
        `${selectedCustomer.FirstName} ${selectedCustomer.LastName}`;
    document.getElementById('selectedMeterNumber').textContent = selectedMeter.MeterNumber;
    
    // Load latest reading
    loadLatestReading();
}

// LOAD LATEST READING
async function loadLatestReading() {
    try {
        const response = await fetch(
            `http://localhost:3000/api/readings/latest?meterId=${selectedMeter.MeterID}`,
            {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                }
            }
        );
        
        const result = await response.json();
        
        if (result.success && result.data) {
            document.getElementById('previousReading').textContent = result.data.CurrentReading;
            document.getElementById('currentReading').textContent = result.data.CurrentReading;
            document.getElementById('consumption').textContent = '0';
        }
        
    } catch (error) {
        console.error('Error loading reading:', error);
    }
}

// CALCULATE BILL
async function calculateBill() {
    const periodStart = document.querySelector('input[name="periodStart"]').value;
    const periodEnd = document.querySelector('input[name="periodEnd"]').value;
    
    if (!periodStart || !periodEnd) {
        alert('Please select billing period');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3000/api/billing/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            },
            body: JSON.stringify({
                meterId: selectedMeter.MeterID,
                periodStart,
                periodEnd
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            billCalculation = result.data;
            populateStep3();
            goToStep(3);
        }
        
    } catch (error) {
        console.error('Error calculating bill:', error);
        alert('Failed to calculate bill');
    }
}

// POPULATE STEP 3
function populateStep3() {
    document.getElementById('billCustomerName').textContent = 
        `${selectedCustomer.FirstName} ${selectedCustomer.LastName}`;
    document.getElementById('billMeterNumber').textContent = selectedMeter.MeterNumber;
    document.getElementById('billUtilityType').textContent = selectedMeter.UtilityType;
    document.getElementById('billPeriod').textContent = 
        `${formatDate(billCalculation.periodStart)} - ${formatDate(billCalculation.periodEnd)}`;
    
    document.getElementById('billConsumption').textContent = `${billCalculation.consumption} units`;
    document.getElementById('billRate').textContent = formatCurrency(billCalculation.rate);
    document.getElementById('billBaseAmount').textContent = formatCurrency(billCalculation.baseAmount);
    document.getElementById('billTax').textContent = formatCurrency(billCalculation.taxAmount);
    document.getElementById('billTotal').textContent = formatCurrency(billCalculation.totalAmount);
    document.getElementById('billDueDate').textContent = formatDate(billCalculation.dueDate);
}

// GENERATE BILL
async function generateBill() {
    const btn = document.getElementById('generateBillBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    btn.disabled = true;
    
    try {
        const response = await fetch('http://localhost:3000/api/billing/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            },
            body: JSON.stringify({
                meterId: selectedMeter.MeterID,
                periodStart: billCalculation.periodStart,
                periodEnd: billCalculation.periodEnd
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            btn.innerHTML = '<i class="fas fa-check"></i> Success!';
            btn.style.background = 'linear-gradient(135deg, #11998e, #38ef7d)';
            
            setTimeout(() => {
                window.location.href = `view_bill.html?id=${result.data.BillingID}`;
            }, 1500);
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('Error generating bill:', error);
        btn.innerHTML = '<i class="fas fa-times"></i> Failed';
        btn.style.background = 'linear-gradient(135deg, #fa709a, #fee140)';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
            btn.disabled = false;
        }, 2000);
        
        alert('Failed to generate bill: ' + error.message);
    }
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