// ========================================
// METERS PAGE JAVASCRIPT
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    loadMeters();
    loadCustomers();
    
    // Filters
    document.getElementById('searchMeter').addEventListener('input', filterMeters);
    document.getElementById('filterUtilityType').addEventListener('change', filterMeters);
    document.getElementById('filterMeterType').addEventListener('change', filterMeters);
    document.getElementById('filterStatus').addEventListener('change', filterMeters);
    
    // Form
    document.getElementById('addMeterForm').addEventListener('submit', addMeter);
});

let metersData = [];
let customersData = [];

// LOAD METERS
async function loadMeters() {
    try {
        const response = await fetch('http://localhost:3000/api/meters', {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
        });
        
        const result = await response.json();
        metersData = result.data;
        
        updateStats();
        displayMetersGrid(metersData);
        displayMetersTable(metersData);
        
    } catch (error) {
        console.error('Error loading meters:', error);
        showNotification('error', 'Failed to load meters');
    }
}

// LOAD CUSTOMERS FOR DROPDOWN
async function loadCustomers() {
    try {
        const response = await fetch('http://localhost:3000/api/customers', {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
        });
        
        const result = await response.json();
        customersData = result.data;
        
        const select = document.getElementById('customerSelect');
        customersData.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.CustomerID;
            option.textContent = `${customer.FirstName} ${customer.LastName} (${customer.CustomerID})`;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

// UPDATE STATS
function updateStats() {
    const total = metersData.length;
    const active = metersData.filter(m => m.Status === 'Active').length;
    const maintenance = metersData.filter(m => m.Status === 'Maintenance').length;
    const faulty = metersData.filter(m => m.Status === 'Faulty').length;
    
    document.getElementById('totalMeters').textContent = total;
    document.getElementById('activeMeters').textContent = active;
    document.getElementById('maintenanceMeters').textContent = maintenance;
    document.getElementById('faultyMeters').textContent = faulty;
}

// DISPLAY METERS GRID
function displayMetersGrid(meters) {
    const grid = document.getElementById('gridView');
    grid.innerHTML = '';
    
    meters.forEach(meter => {
        const card = document.createElement('div');
        card.className = 'meter-card';
        card.innerHTML = `
            <div class="meter-card-header ${meter.Status.toLowerCase()}">
                <div class="meter-icon">
                    <i class="fas fa-${getUtilityIcon(meter.UtilityType)}"></i>
                </div>
                <div class="meter-status-badge ${meter.Status.toLowerCase()}">
                    ${meter.Status}
                </div>
            </div>
            <div class="meter-card-body">
                <h3>${meter.MeterNumber}</h3>
                <div class="meter-info">
                    <div class="info-item">
                        <i class="fas fa-user"></i>
                        <span>${meter.CustomerName || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-bolt"></i>
                        <span>${meter.UtilityType}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-microchip"></i>
                        <span>${meter.MeterType}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-calendar"></i>
                        <span>${new Date(meter.InstallationDate).toLocaleDateString()}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${meter.Location}</span>
                    </div>
                </div>
            </div>
            <div class="meter-card-footer">
                <button class="btn-icon" onclick="viewMeterDetails(${meter.MeterID})" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="editMeter(${meter.MeterID})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" onclick="addReading(${meter.MeterID})" title="Add Reading">
                    <i class="fas fa-book"></i>
                </button>
                <button class="btn-icon danger" onclick="deleteMeter(${meter.MeterID})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// DISPLAY METERS TABLE
function displayMetersTable(meters) {
    const tbody = document.getElementById('metersTableBody');
    tbody.innerHTML = '';
    
    meters.forEach(meter => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${meter.MeterID}</td>
            <td><strong>${meter.MeterNumber}</strong></td>
            <td>${meter.CustomerName || 'Unassigned'}</td>
            <td><span class="badge badge-${meter.UtilityType.toLowerCase()}">${meter.UtilityType}</span></td>
            <td>${meter.MeterType}</td>
            <td>${new Date(meter.InstallationDate).toLocaleDateString()}</td>
            <td><span class="status-badge ${meter.Status.toLowerCase()}">${meter.Status}</span></td>
            <td>
                <button class="btn-icon" onclick="viewMeterDetails(${meter.MeterID})" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="editMeter(${meter.MeterID})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon danger" onclick="deleteMeter(${meter.MeterID})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// FILTER METERS
function filterMeters() {
    const searchTerm = document.getElementById('searchMeter').value.toLowerCase();
    const utilityFilter = document.getElementById('filterUtilityType').value;
    const typeFilter = document.getElementById('filterMeterType').value;
    const statusFilter = document.getElementById('filterStatus').value;
    
    let filtered = metersData;
    
    if (searchTerm) {
        filtered = filtered.filter(m => 
            m.MeterNumber.toLowerCase().includes(searchTerm) ||
            (m.CustomerName && m.CustomerName.toLowerCase().includes(searchTerm))
        );
    }
    
    if (utilityFilter) {
        filtered = filtered.filter(m => m.UtilityType === utilityFilter);
    }
    
    if (typeFilter) {
        filtered = filtered.filter(m => m.MeterType === typeFilter);
    }
    
    if (statusFilter) {
        filtered = filtered.filter(m => m.Status === statusFilter);
    }
    
    displayMetersGrid(filtered);
    displayMetersTable(filtered);
}

// ADD METER
async function addMeter(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const meterData = Object.fromEntries(formData);
    
    try {
        const response = await fetch('http://localhost:3000/api/meters', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            },
            body: JSON.stringify(meterData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('success', 'Meter registered successfully');
            closeAddMeterModal();
            loadMeters();
        }
        
    } catch (error) {
        console.error('Error adding meter:', error);
        showNotification('error', 'Failed to register meter');
    }
}

// VIEW METER DETAILS
async function viewMeterDetails(meterID) {
    try {
        const response = await fetch(`http://localhost:3000/api/meters/${meterID}`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
        });
        
        const result = await response.json();
        const meter = result.data;
        
        const content = document.getElementById('meterDetailsContent');
        content.innerHTML = `
            <div class="details-grid">
                <div class="detail-section">
                    <h3>Meter Information</h3>
                    <div class="detail-item">
                        <label>Meter ID:</label>
                        <span>${meter.MeterID}</span>
                    </div>
                    <div class="detail-item">
                        <label>Meter Number:</label>
                        <span>${meter.MeterNumber}</span>
                    </div>
                    <div class="detail-item">
                        <label>Utility Type:</label>
                        <span><span class="badge badge-${meter.UtilityType.toLowerCase()}">${meter.UtilityType}</span></span>
                    </div>
                    <div class="detail-item">
                        <label>Meter Type:</label>
                        <span>${meter.MeterType}</span>
                    </div>
                    <div class="detail-item">
                        <label>Status:</label>
                        <span><span class="status-badge ${meter.Status.toLowerCase()}">${meter.Status}</span></span>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>Installation Details</h3>
                    <div class="detail-item">
                        <label>Installation Date:</label>
                        <span>${new Date(meter.InstallationDate).toLocaleDateString()}</span>
                    </div>
                    <div class="detail-item">
                        <label>Location:</label>
                        <span>${meter.Location}</span>
                    </div>
                    <div class="detail-item">
                        <label>Initial Reading:</label>
                        <span>${meter.InitialReading}</span>
                    </div>
                    <div class="detail-item">
                        <label>Last Maintenance:</label>
                        <span>${meter.LastMaintenanceDate ? new Date(meter.LastMaintenanceDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-actions">
                <button class="btn-primary" onclick="window.location.href='readings.html?meter=${meter.MeterID}'">
                    <i class="fas fa-book"></i> View Readings
                </button>
                <button class="btn-secondary" onclick="editMeter(${meter.MeterID})">
                    <i class="fas fa-edit"></i> Edit Meter
                </button>
            </div>
        `;
        
        document.getElementById('meterDetailsModal').style.display = 'flex';
        
    } catch (error) {
        console.error('Error loading meter details:', error);
        showNotification('error', 'Failed to load meter details');
    }
}

// TOGGLE VIEW
function toggleView(view) {
    const gridView = document.getElementById('gridView');
    const tableView = document.getElementById('tableView');
    const buttons = document.querySelectorAll('.toggle-btn');
    
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if (view === 'grid') {
        gridView.style.display = 'grid';
        tableView.style.display = 'none';
        buttons[0].classList.add('active');
    } else {
        gridView.style.display = 'none';
        tableView.style.display = 'block';
        buttons[1].classList.add('active');
    }
}

// UTILITY ICON MAPPING
function getUtilityIcon(utilityType) {
    const icons = {
        'Electricity': 'bolt',
        'Water': 'tint',
        'Gas': 'fire',
        'Sewage': 'recycle'
    };
    return icons[utilityType] || 'tachometer-alt';
}

// MODAL FUNCTIONS
function openAddMeterModal() {
    document.getElementById('addMeterModal').style.display = 'flex';
}

function closeAddMeterModal() {
    document.getElementById('addMeterModal').style.display = 'none';
    document.getElementById('addMeterForm').reset();
}

function closeMeterDetailsModal() {
    document.getElementById('meterDetailsModal').style.display = 'none';
}

// DELETE METER
async function deleteMeter(meterID) {
    if (!confirm('Are you sure you want to delete this meter?')) return;
    
    try {
        const response = await fetch(`http://localhost:3000/api/meters/${meterID}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('success', 'Meter deleted successfully');
            loadMeters();
        }
        
    } catch (error) {
        console.error('Error deleting meter:', error);
        showNotification('error', 'Failed to delete meter');
    }
}

// NOTIFICATION
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