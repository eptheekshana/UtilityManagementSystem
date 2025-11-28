// ========================================
// UMS DASHBOARD JAVASCRIPT
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    
    // Check authentication
    checkAuth();
    
    // Load user data
    loadUserData();
    
    // Load dashboard data
    loadDashboardData();
    
    // Initialize charts
    initializeCharts();
    
    // Sidebar toggle
    document.getElementById('toggleSidebar').addEventListener('click', toggleSidebar);
    
    // Role-based menu visibility
    setupRoleBasedMenu();
});

// ========================================
// AUTHENTICATION CHECK
// ========================================
function checkAuth() {
    const user = sessionStorage.getItem('user');
    const token = sessionStorage.getItem('token');
    
    if (!user || !token) {
        window.location.href = 'index.html';
        return;
    }
}

// ========================================
// LOAD USER DATA
// ========================================
function loadUserData() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userRole').textContent = user.role;
}

// ========================================
// LOAD DASHBOARD DATA
// ========================================
async function loadDashboardData() {
    try {
        const response = await fetch('http://localhost:3000/api/dashboard/stats', {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        
        // Update stat cards
        document.getElementById('totalCustomers').textContent = data.totalCustomers;
        document.getElementById('totalRevenue').textContent = `$${data.totalRevenue.toLocaleString()}`;
        document.getElementById('pendingBills').textContent = data.pendingBills;
        document.getElementById('defaulters').textContent = data.defaulters;
        
        // Update recent payments table
        updateRecentPayments(data.recentPayments);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// ========================================
// INITIALIZE CHARTS
// ========================================
function initializeCharts() {
    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    new Chart(revenueCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Revenue ($)',
                data: [45000, 52000, 48000, 61000, 58000, 67000],
                borderColor: '#4facfe',
                backgroundColor: 'rgba(79, 172, 254, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#4facfe',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#4facfe',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // Consumption Chart (Bar)
    const consumptionCtx = document.getElementById('consumptionChart').getContext('2d');
    new Chart(consumptionCtx, {
        type: 'bar',
        data: {
            labels: ['Electricity', 'Water', 'Gas', 'Sewage'],
            datasets: [{
                label: 'Consumption (Units)',
                data: [145000, 98000, 67000, 54000],
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(79, 172, 254, 0.8)',
                    'rgba(240, 147, 251, 0.8)',
                    'rgba(250, 112, 154, 0.8)'
                ],
                borderColor: [
                    '#667eea',
                    '#4facfe',
                    '#f093fb',
                    '#fa709a'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // Meter Status Chart (Doughnut)
    const meterStatusCtx = document.getElementById('meterStatusChart').getContext('2d');
    new Chart(meterStatusCtx, {
        type: 'doughnut',
        data: {
            labels: ['Active', 'Inactive', 'Maintenance'],
            datasets: [{
                data: [75, 15, 10],
                backgroundColor: [
                    '#4facfe',
                    '#fa709a',
                    '#fee140'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

// ========================================
// UPDATE RECENT PAYMENTS TABLE
// ========================================
function updateRecentPayments(payments) {
    const tbody = document.getElementById('recentPayments');
    tbody.innerHTML = '';
    
    payments.forEach(payment => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${payment.customerName}</td>
            <td>$${payment.amount.toFixed(2)}</td>
            <td>${new Date(payment.date).toLocaleDateString()}</td>
            <td><span class="status-badge ${payment.status}">${payment.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// ========================================
// SIDEBAR TOGGLE
// ========================================
function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('active');
}

// ========================================
// ROLE-BASED MENU
// ========================================
function setupRoleBasedMenu() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    const role = user.role;
    
    // Hide all sections first
    document.querySelectorAll('.nav-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show relevant section
    document.querySelector(`[data-role="${role}"]`).style.display = 'block';
}

// ========================================
// LOGOUT
// ========================================
function logout() {
    sessionStorage.clear();
    window.location.href = 'index.html';
}