// ========================================
// UMS LOGIN AUTHENTICATION
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    
    // Toggle Password Visibility
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });

    // Login Form Submission
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;
        const remember = document.getElementById('remember').checked;

        // Show loading state
        const loginBtn = document.querySelector('.login-btn');
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        loginBtn.disabled = true;

        try {
            // API Call to backend
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password,
                    role
                })
            });

            const data = await response.json();

            if (data.success) {
                // Store user data
                sessionStorage.setItem('user', JSON.stringify(data.user));
                sessionStorage.setItem('token', data.token);
                
                if (remember) {
                    localStorage.setItem('rememberedUser', username);
                }

                // Success animation
                loginBtn.innerHTML = '<i class="fas fa-check"></i> Success!';
                loginBtn.style.background = 'linear-gradient(135deg, #11998e, #38ef7d)';

                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);

            } else {
                throw new Error(data.message || 'Login failed');
            }

        } catch (error) {
            // Error handling
            loginBtn.innerHTML = '<i class="fas fa-times"></i> Login Failed';
            loginBtn.style.background = 'linear-gradient(135deg, #fa709a, #fee140)';
            
            setTimeout(() => {
                loginBtn.innerHTML = originalText;
                loginBtn.style.background = '';
                loginBtn.disabled = false;
            }, 2000);

            // Show error message
            showNotification('error', error.message);
        }
    });

    // Load remembered username
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
        document.getElementById('username').value = rememberedUser;
        document.getElementById('remember').checked = true;
    }
});

// Notification Function
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
        background: ${type === 'error' ? 'rgba(250, 112, 154, 0.9)' : 'rgba(79, 172, 254, 0.9)'};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        animation: slideInRight 0.5s ease-out;
        backdrop-filter: blur(10px);
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.5s ease-out';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);