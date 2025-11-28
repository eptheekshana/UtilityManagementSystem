// ========================================
// METER READINGS JAVASCRIPT
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    loadMetersForDropdown();
    loadReadings();
    setupForm();
    setupFilters();
});

let readingsData = [];

// LOAD METERS FOR DROPDOWN
async function loadMetersForDropdown() {
    try {
        const response = await fetch('http://localhost:3000/api/meters', {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const select = document.getElementById('meterSelect');
            const filterSelect = document.getElementById('filterMeter');
            
            result.data.forEach(meter => {
                const option = document.createElement('option');
                option.value = meter.MeterID;
                option.textContent = `${meter.MeterNumber} - ${meter.CustomerName || 'Unassigned'}`;
                select.appendChild(option.cloneNode(true));
                filterSelect.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error loading meters:', error);
    }
}

// LOAD READINGS
async function loadReadings() {
    try {
        const response = await fetch('http://localhost:3000/api/readings', {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            readingsData = result.data;
            displayReadings(readingsData);
        }
        
    } catch (error) {
        console.error('Error loading readings:', error);
    }
}

// DISPLAY READINGS
function displayReadings(readings) {
    const tbody = document.getElementById('readingsTableBody');
    tbody.innerHTML = '';
    
    if (readings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px;">
                    <div class="empty-state">
                        <i class="fas fa-book-reader"></i>
                        <h3>No Readings Found</h3>
                        <p>No meter readings available</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    readings.forEach(reading => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${reading.ReadingID}</td>
            <td><strong>${reading.MeterNumber}</strong></td>
            <td>${reading.CustomerName}</td>
            <td>${formatDate(reading.ReadingDate)}</td>
            <td>${reading.PreviousReading}</td>
            <td>${reading.CurrentReading}</td>
            <td><strong>${reading.Consumption}</strong></td>
            <td><span class="badge">${reading.ReadingMethod}</span></td>
            <td>
                <button class="btn-icon" onclick="viewReading(${reading.ReadingID})" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon danger" onclick="deleteReading(${reading.ReadingID})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// SETUP FORM
function setupForm() {
    const form = document.getElementById('quickReadingForm');
    form.addEventListener('submit', addReading);
    
    // Set default date to today
    document.querySelector('input[name="readingDate"]').value = 
        new Date().toISOString().split('T')[0];
}

// ADD READING
async function addReading(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const readingData = {
        meterId: parseInt(formData.get('meterId')),
        currentReading: parseFloat(formData.get('currentReading')),
        readingDate: formData.get('readingDate'),
        readingMethod: formData.get('readingMethod'),
        notes: formData.get('notes') || null
    };
    
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    btn.disabled = true;
    
    try {
        const response = await fetch('http://localhost:3000/api/readings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            },
            body: JSON.stringify(readingData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            btn.innerHTML = '<i class="fas fa-check"></i> Saved!';
            btn.style.background = 'linear-gradient(135deg, #11998e, #38ef7d)';
            
            showNotification('success', 'Reading saved successfully');
            
            e.target.reset();
            loadReadings();
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
                btn.disabled = false;
            }, 2000);
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('Error adding reading:', error);
        btn.innerHTML = '<i class="fas fa-times"></i> Failed';
        btn.style.background = 'linear-gradient(135deg, #fa709a, #fee140)';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
            btn.disabled = false;
        }, 2000);
        
        showNotification('error', 'Failed to save reading: ' + error.message);
    }
}

// SETUP FILTERS
function setupFilters() {
    document.getElementById('filterMeter').addEventListener('change', filterReadings);
    document.getElementById('filterPeriod').addEventListener('change', filterReadings);
}

// FILTER READINGS
function filterReadings() {
    const meterFilter = document.getElementById('filterMeter').value;
    const periodFilter = parseInt(document.getElementById('filterPeriod').value);
    
    let filtered = readingsData;
    
    if (meterFilter) {
        filtered = filtered.filter(r => r.MeterID == meterFilter);
    }
    
    if (periodFilter) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - periodFilter);
        filtered = filtered.filter(r => new Date(r.ReadingDate) >= cutoffDate);
    }
    
    displayReadings(filtered);
}

// VIEW READING
function viewReading(readingId) {
    const reading = readingsData.find(r => r.ReadingID === readingId);
    if (reading) {
        alert(`
Reading Details:
Meter: ${reading.MeterNumber}
Customer: ${reading.CustomerName}
Date: ${formatDate(reading.ReadingDate)}
Previous: ${reading.PreviousReading}
Current: ${reading.CurrentReading}
Consumption: ${reading.Consumption}
Method: ${reading.ReadingMethod}
${reading.Notes ? 'Notes: ' + reading.Notes : ''}
        `);
    }
}

// DELETE READING
async function deleteReading(readingId) {
    if (!confirm('Are you sure you want to delete this reading?')) return;
    
    try {
        const response = await fetch(`http://localhost:3000/api/readings/${readingId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('success', 'Reading deleted successfully');
            loadReadings();
        }
        
    } catch (error) {
        console.error('Error deleting reading:', error);
        showNotification('error', 'Failed to delete reading');
    }
}

// UTILITY FUNCTIONS
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