// Authentication state management
let currentUser = null;
const API_BASE_URL = window.location.origin;

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    
    // Setup forms if they exist
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    
    if (signupForm) {
        setupSignupForm();
    }
    
    if (loginForm) {
        setupLoginForm();
    }
});

// ============================================
// AUTHENTICATION STATE
// ============================================

function getToken() {
    return localStorage.getItem('authToken');
}

function setToken(token) {
    localStorage.setItem('authToken', token);
}

function removeToken() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    currentUser = null;
}

function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
    currentUser = user;
}

async function checkAuthStatus() {
    const token = getToken();
    if (!token) {
        updateNavigationUI(false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                setUser(data.user);
                updateNavigationUI(true);
            } else {
                removeToken();
                updateNavigationUI(false);
            }
        } else {
            removeToken();
            updateNavigationUI(false);
        }
    } catch (error) {
        console.error('Auth check error:', error);
        removeToken();
        updateNavigationUI(false);
    }
}

function updateNavigationUI(isLoggedIn) {
    // This will be called from appf.js to update the navigation
    if (window.updateAuthUI) {
        window.updateAuthUI(isLoggedIn, currentUser);
    }
}

// ============================================
// SIGNUP FORM
// ============================================

function setupSignupForm() {
    const form = document.getElementById('signup-form');
    const nameInput = document.getElementById('signup-name');
    const emailInput = document.getElementById('signup-email');
    const passwordInput = document.getElementById('signup-password');
    const confirmInput = document.getElementById('signup-confirm');
    const submitBtn = document.getElementById('signup-btn');

    // Real-time validation
    nameInput.addEventListener('blur', () => validateName(nameInput.value));
    emailInput.addEventListener('blur', () => validateEmail(emailInput.value));
    passwordInput.addEventListener('blur', () => validatePassword(passwordInput.value));
    confirmInput.addEventListener('blur', () => validateConfirmPassword(passwordInput.value, passwordInput.value));

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmInput.value;

        // Validate all fields
        const nameValid = validateName(name);
        const emailValid = validateEmail(email);
        const passwordValid = validatePassword(password);
        const confirmValid = validateConfirmPassword(confirmPassword, password);

        if (!nameValid || !emailValid || !passwordValid || !confirmValid) {
            showNotification('Please fix the errors in the form', 'error');
            return;
        }

        // Disable button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Creating Account...</span>';

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Store token and user
                setToken(data.token);
                setUser(data.user);
                
                showNotification('Account created successfully! Redirecting...', 'success');
                
                // Redirect to home page
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                // Handle validation errors
                if (data.errors && Array.isArray(data.errors)) {
                    data.errors.forEach(error => {
                        const field = error.path || error.param;
                        showFieldError(field, error.msg);
                    });
                } else {
                    showNotification(data.message || 'Signup failed. Please try again.', 'error');
                }
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>Create Account</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
            }
        } catch (error) {
            console.error('Signup error:', error);
            showNotification('Network error. Please check your connection.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Create Account</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
        }
    });
}

// ============================================
// LOGIN FORM
// ============================================

function setupLoginForm() {
    const form = document.getElementById('login-form');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const submitBtn = document.getElementById('login-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        // Clear previous errors
        clearFieldError('email');
        clearFieldError('password');

        // Disable button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Signing In...</span>';

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Store token and user
                setToken(data.token);
                setUser(data.user);
                
                showNotification('Login successful! Redirecting...', 'success');
                
                // Redirect to home page
                setTimeout(() => {
                    const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/';
                    window.location.href = redirectTo;
                }, 1000);
            } else {
                showNotification(data.message || 'Invalid email or password', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>Sign In</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
            }
        } catch (error) {
            console.error('Login error:', error);
            showNotification('Network error. Please check your connection.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Sign In</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
        }
    });
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

function validateName(name) {
    const errorEl = document.getElementById('name-error');
    if (!name || name.length < 2) {
        showFieldError('name', 'Name must be at least 2 characters');
        return false;
    }
    if (name.length > 50) {
        showFieldError('name', 'Name cannot exceed 50 characters');
        return false;
    }
    clearFieldError('name');
    return true;
}

function validateEmail(email) {
    const errorEl = document.getElementById('email-error');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
        showFieldError('email', 'Email is required');
        return false;
    }
    if (!emailRegex.test(email)) {
        showFieldError('email', 'Please enter a valid email address');
        return false;
    }
    clearFieldError('email');
    return true;
}

function validatePassword(password) {
    const errorEl = document.getElementById('password-error');
    if (!password || password.length < 8) {
        showFieldError('password', 'Password must be at least 8 characters');
        return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        showFieldError('password', 'Password must contain uppercase, lowercase, and number');
        return false;
    }
    clearFieldError('password');
    return true;
}

function validateConfirmPassword(confirmPassword, password) {
    const errorEl = document.getElementById('confirm-error');
    if (!confirmPassword) {
        showFieldError('confirm', 'Please confirm your password');
        return false;
    }
    if (confirmPassword !== password) {
        showFieldError('confirm', 'Passwords do not match');
        return false;
    }
    clearFieldError('confirm');
    return true;
}

function showFieldError(field, message) {
    const errorEl = document.getElementById(`${field}-error`);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

function clearFieldError(field) {
    const errorEl = document.getElementById(`${field}-error`);
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '16px 24px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '500',
        zIndex: '10000',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        animation: 'slideInRight 0.3s ease-out',
        maxWidth: '400px'
    });

    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#6366f1',
        warning: '#f59e0b'
    };
    notification.style.backgroundColor = colors[type] || colors.info;

    document.body.appendChild(notification);

    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Export functions for use in other scripts
window.authAPI = {
    getToken,
    getUser: () => getUser() || currentUser,
    isAuthenticated: () => !!getToken(),
    logout: async () => {
        try {
            const token = getToken();
            if (token) {
                await fetch(`${API_BASE_URL}/api/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            removeToken();
            updateNavigationUI(false);
            window.location.href = '/';
        }
    },
    checkAuth: checkAuthStatus
};
