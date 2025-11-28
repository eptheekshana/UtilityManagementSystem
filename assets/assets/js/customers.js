// ========================================
// CUSTOMERS PAGE JAVASCRIPT
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    loadCustomers();
    
    // Search
    document.getElementById('searchCustomer').addEventListener('input', filterCustomers);
    
    // Filters
    document.getElementById('filterType').addEventListener('change', filterCustomers);
    document.getElementById('filterStatus').addEventListener('change', filterCustomers);
    
    // Form Submit
    document.getElementById('addCustomerForm').addEventListener('submit', addCustomer);
});

let customersData = [];

// LOAD CUSTOMERS
async function loadCustomers() {
    try {
        const response = await fetch('http://localhost:3000/api/customers', {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
        });
        
        const result = await response.json();
        customersData = result.data;
        displayCustomers(customersData);
        
    } catch (error) {
        console.error('Error loading customers:', error);
        showNotification('error', 'Failed to load customers');
    }
}

// DISPLAY CUSTOMERS
function displayCustomers(customers) {
    const tbody = document.getElementById('customersTableBody');
    tbody.innerHTML = '';
    
    customers.forEach(customer => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${customer.CustomerID}</td>
            <td>${customer.FirstName} ${customer.LastName}</td>
            <td>${customer.Email}</td>
            <td>${customer.Phone}</td>
            <td>${customer.Address}, ${customer.City}</td>
            <td><span class="badge badge-${customer.CustomerType.toLowerCase()}">${customer.CustomerType}</span></td>
            <td><span class="status-badge ${customer.IsActive ? 'active' : 'inactive'}">${customer.IsActive ? 'Active' : 'Inactive'}</span></td>
            <td>
                <button class="btn-icon" onclick="editCustomer(${customer.CustomerID})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" onclick="viewCustomer(${customer.CustomerID})" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon danger" onclick="deleteCustomer(${customer.CustomerID})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// FILTER CUSTOMERS
function filterCustomers() {
    const searchTerm = document.getElementById('searchCustomer').value.toLowerCase();
    const typeFilter = document.getElementById('filterType').value;
    const statusFilter = document.getElementById('filterStatus').value;
    
    let filtered = customersData;
    
    if (searchTerm) {
        filtered = filtered.filter(c => 
            c.FirstName.toLowerCase().includes(searchTerm) ||
            c.LastName.toLowerCase().includes(searchTerm) ||
            c.Email.toLowerCase().includes(searchTerm)
        );
    }
    
    if (typeFilter) {
        filtered = filtered.filter(c => c.CustomerType === typeFilter);
    }
    
    if (statusFilter !== '') {
        filtered = filtered.filter(c => c.IsActive == statusFilter);
    }
    
    displayCustomers(filtered);
}

// ADD CUSTOMER
async function addCustomer(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const customerData = Object.fromEntries(formData);
    
    try {
        const response = await fetch('http://localhost:3000/api/customers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            },
            body: JSON.stringify(customerData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('success', 'Customer added successfully');
            closeAddCustomerModal();
            loadCustomers();
        }
        
    } catch (error) {
        console.error('Error adding customer:', error);
        showNotification('error', 'Failed to add customer');
    }
}

// MODAL FUNCTIONS
function openAddCustomerModal() {
    document.getElementById('addCustomerModal').style.display = 'flex';
}

function closeAddCustomerModal() {
    document.getElementById('addCustomerModal').style.display = 'none';
    document.getElementById('addCustomerForm').reset();
}

// NOTIFICATION
function showNotification(type, message) {
    // Same as auth.js notification function
}