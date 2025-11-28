// ========================================
// UTILITY FUNCTIONS
// ========================================

// Format Currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format Date
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format DateTime
function formatDateTime(date) {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Validate Email
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate Phone
function isValidPhone(phone) {
    const re = /^\d{3}-\d{4}$/;
    return re.test(phone);
}

// Show Loading
function showLoading(element) {
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    element.appendChild(spinner);
}

// Hide Loading
function hideLoading(element) {
    const spinner = element.querySelector('.spinner');
    if (spinner) spinner.remove();
}

// Debounce Function
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

// Generate Random ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Capitalize First Letter
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatCurrency,
        formatDate,
        formatDateTime,
        isValidEmail,
        isValidPhone,
        showLoading,
        hideLoading,
        debounce,
        generateId,
        capitalize
    };
}