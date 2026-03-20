// Authentication JavaScript for Shikola Pro

document.addEventListener('DOMContentLoaded', function() {
    // Initialize authentication functionality
    initInstitutionSelection();
    initPasswordStrength();
    initFormValidation();
    initPasswordToggle();
    initSocialAuth();
    initTabs();
});

// Tab Functionality
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabBtns.length === 0) return;
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            
            // Remove active class from all buttons and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            const targetContent = document.getElementById(targetTab + '-tab');
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// Next Tab Function
function nextTab() {
    const basicTab = document.getElementById('basic-tab');
    const personalTab = document.getElementById('personal-tab');
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    // Validate first tab fields
    const institutionType = document.getElementById('institutionType').value;
    const institutionName = document.getElementById('institutionName').value;
    const email = document.getElementById('email').value;
    const address = document.getElementById('address').value;
    
    if (!institutionType) {
        showModal('Error', 'Please select your institution type.');
        return;
    }
    
    if (!institutionName) {
        showModal('Error', 'Please enter your institution name.');
        return;
    }
    
    if (!email) {
        showModal('Error', 'Please enter your email address.');
        return;
    }
    
    if (!validateEmail(email)) {
        showModal('Error', 'Please enter a valid email address.');
        return;
    }
    
    if (!address) {
        showModal('Error', 'Please enter your institution address.');
        return;
    }
    
    // Switch to personal tab
    basicTab.classList.remove('active');
    personalTab.classList.add('active');
    
    tabBtns[0].classList.remove('active');
    tabBtns[1].classList.add('active');
}

// Role Selection for Sign In
function initRoleSelection() {
    const roleOptions = document.querySelectorAll('.role-option');
    const roleInput = document.getElementById('userRole');
    
    if (roleOptions.length === 0) return;
    
    roleOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            roleOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Set hidden input value
            if (roleInput) {
                roleInput.value = this.dataset.role;
            }
        });
    });
}

// Institution Selection for Sign Up
function initInstitutionSelection() {
    const institutionOptions = document.querySelectorAll('.institution-option');
    const institutionInput = document.getElementById('institutionType');
    
    if (institutionOptions.length === 0) return;
    
    institutionOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            institutionOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Set hidden input value
            if (institutionInput) {
                institutionInput.value = this.dataset.type;
            }
        });
    });
}

// Password Strength Checker
function initPasswordStrength() {
    const passwordInput = document.getElementById('password');
    const strengthFill = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');
    
    if (!passwordInput || !strengthFill || !strengthText) return;
    
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strength = checkPasswordStrength(password);
        
        // Update strength bar
        strengthFill.className = 'strength-fill';
        if (password.length > 0) {
            strengthFill.classList.add(strength.level);
        }
        
        // Update strength text
        strengthText.textContent = strength.text;
        strengthText.style.color = strength.color;
    });
}

function checkPasswordStrength(password) {
    let score = 0;
    let feedback = [];
    
    // Length check
    if (password.length >= 8) score++;
    else feedback.push('at least 8 characters');
    
    // Lowercase check
    if (/[a-z]/.test(password)) score++;
    else feedback.push('lowercase letter');
    
    // Uppercase check
    if (/[A-Z]/.test(password)) score++;
    else feedback.push('uppercase letter');
    
    // Number check
    if (/[0-9]/.test(password)) score++;
    else feedback.push('number');
    
    // Special character check
    if (/[^A-Za-z0-9]/.test(password)) score++;
    else feedback.push('special character');
    
    // Determine strength level
    if (score <= 2) {
        return {
            level: 'weak',
            text: 'Weak password',
            color: '#dc3545'
        };
    } else if (score <= 4) {
        return {
            level: 'medium',
            text: 'Medium strength',
            color: '#ffc107'
        };
    } else {
        return {
            level: 'strong',
            text: 'Strong password',
            color: '#28a745'
        };
    }
}

// Form Validation
function initFormValidation() {
    const signinForm = document.getElementById('signinForm');
    const signupForm = document.getElementById('signupForm');
    
    if (signinForm) {
        signinForm.addEventListener('submit', handleSignIn);
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignUp);
    }
}

function handleSignIn(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const spinner = submitBtn.querySelector('.loading-spinner');
    
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';
    submitBtn.disabled = true;
    
    // Validate form
    if (!validateSignInForm(formData)) {
        // Hide loading state
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
        submitBtn.disabled = false;
        return;
    }
    
    // Simulate API call
    setTimeout(() => {
        // Store user session
        const email = formData.get('email');
        sessionStorage.setItem('userEmail', email);
        localStorage.setItem('userEmail', email);
        
        // Show success state with checkmark
        spinner.style.display = 'none';
        submitBtn.innerHTML = '<i class="fas fa-check success-check"></i>';
        submitBtn.style.background = '#28a745';
        
        // Determine role and redirect after short delay
        setTimeout(() => {
            const role = determineRoleFromCredentials(email);
            sessionStorage.setItem('userRole', role);
            localStorage.setItem('userRole', role);
            redirectBasedOnRole(role);
        }, 800);
    }, 2000);
}

function handleSignUp(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const spinner = submitBtn.querySelector('.loading-spinner');
    
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';
    submitBtn.disabled = true;
    
    // Validate form
    if (!validateSignUpForm(formData)) {
        // Hide loading state
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
        submitBtn.disabled = false;
        return;
    }
    
    // Simulate API call
    setTimeout(() => {
        // Hide loading state
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
        submitBtn.disabled = false;
        
        // Show success message
        showModal('Account Created!', 'Your account has been created successfully. Please check your email to verify your account.');
        
        // Reset form
        form.reset();
        
        // Clear selections
        document.querySelectorAll('.role-option.selected, .institution-option.selected').forEach(opt => {
            opt.classList.remove('selected');
        });
    }, 2000);
}

function validateSignInForm(formData) {
    const email = formData.get('email');
    const password = formData.get('password');
    
    if (!email || !password) {
        alert('Please fill in all required fields.');
        return false;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters long.');
        return false;
    }
    
    return true;
}

function validateSignUpForm(formData) {
    const institutionType = formData.get('institutionType');
    const institutionName = formData.get('institutionName');
    const fullName = formData.get('fullName');
    const email = formData.get('email');
    const address = formData.get('address');
    const phone = formData.get('phone');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const accountType = formData.get('accountType');
    const terms = formData.get('terms');
    
    if (!institutionType) {
        showModal('Error', 'Please select your institution type.');
        return false;
    }
    
    if (!institutionName) {
        showModal('Error', 'Please enter your institution name.');
        return false;
    }
    
    if (!fullName) {
        showModal('Error', 'Please enter your full name.');
        return false;
    }
    
    if (!email) {
        showModal('Error', 'Please enter your email address.');
        return false;
    }
    
    if (!validateEmail(email)) {
        showModal('Error', 'Please enter a valid email address.');
        return false;
    }
    
    if (!address) {
        showModal('Error', 'Please enter your institution address.');
        return false;
    }
    
    if (!phone) {
        showModal('Error', 'Please enter your phone number.');
        return false;
    }
    
    if (!password) {
        showModal('Error', 'Please enter a password.');
        return false;
    }
    
    if (password.length < 8) {
        showModal('Error', 'Password must be at least 8 characters long.');
        return false;
    }
    
    if (password !== confirmPassword) {
        showModal('Error', 'Passwords do not match.');
        return false;
    }
    
    if (!terms) {
        showModal('Error', 'Please accept the terms and conditions.');
        return false;
    }
    
    return true;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Password Toggle
function initPasswordToggle() {
    // This function is called by onclick attributes in HTML
}

function togglePassword(fieldId) {
    const passwordField = document.getElementById(fieldId);
    const toggleBtn = passwordField.nextElementSibling;
    const icon = toggleBtn.querySelector('i');
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordField.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Social Authentication
function initSocialAuth() {
    const googleBtn = document.querySelector('.btn-google');
    const microsoftBtn = document.querySelector('.btn-microsoft');
    
    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            showModal('Google Sign-In', 'Google sign-in integration would be implemented here using OAuth 2.0.');
        });
    }
    
    if (microsoftBtn) {
        microsoftBtn.addEventListener('click', () => {
            showModal('Microsoft Sign-In', 'Microsoft sign-in integration would be implemented here using OAuth 2.0.');
        });
    }
}

// Modal Functions
function showModal(title, message) {
    const modal = document.getElementById('messageModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    
    if (modal && modalTitle && modalMessage) {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modal.classList.add('show');
    }
}

function closeModal() {
    const modal = document.getElementById('messageModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Determine role based on user credentials (simulation)
function determineRoleFromCredentials(email) {
    // In a real application, this would be determined by the server response
    // For demo purposes, we'll simulate role determination based on email patterns
    
    if (email.includes('sysadmin') || email.includes('system') || email.includes('administrator')) {
        return 'system-admin';
    } else if (email.includes('tenant') || email.includes('superadmin')) {
        return 'tenant';
    } else if (email.includes('accountant') || email.includes('finance') || email.includes('billing')) {
        return 'accountant';
    } else if (email.includes('hr') || email.includes('human') || email.includes('personnel')) {
        return 'hr';
    } else if (email.includes('registry') || email.includes('records') || email.includes('admissions')) {
        return 'registry';
    } else if (email.includes('hostel') || email.includes('accommodation') || email.includes('dormitory')) {
        return 'hostel';
    } else if (email.includes('operations') || email.includes('ops') || email.includes('facilities')) {
        return 'operations';
    } else if (email.includes('staff') || email.includes('employee') || email.includes('support')) {
        return 'staff';
    } else if (email.includes('lecturer') || email.includes('teacher') || email.includes('prof')) {
        return 'lecturer';
    } else if (email.includes('parent') || email.includes('guardian')) {
        return 'parent';
    } else {
        // Default to student for all other emails
        return 'student';
    }
}

// Redirect based on role
function redirectBasedOnRole(role) {
    // In a real application, this would redirect to actual home pages
    const dashboards = {
        'system-admin': '../pages/system-admin/home.html',
        'tenant': '../pages/tenant-admin/home.html',
        'accountant': '../pages/staff/accountant/home.html',
        'hr': '../pages/staff/hr/home.html',
        'registry': '../pages/staff/registry/home.html',
        'hostel': '../pages/staff/hostel/home.html',
        'operations': '../pages/operations/home.html',
        'staff': '../pages/staff/home.html',
        'lecturer': '../pages/staff/home.html',
        'student': '../pages/student/home.html',
        'parent': '../pages/parent/home.html'
    };
    
    // For demo purposes, create a simple home page if it doesn't exist
    const targetUrl = dashboards[role] || '../pages/student/home.html';
    
    console.log(`Redirecting to: ${targetUrl}`);
    
    // Try to redirect to home page
    try {
        window.location.href = targetUrl;
    } catch (error) {
        console.error('Redirect failed:', error);
        // Fallback: show a message with the intended destination
        showModal('Redirect Info', `Would redirect to ${role} home page at ${targetUrl}`);
    }
}

// Global Logout Function
async function logout() {
    try {
        // Clear session storage
        sessionStorage.clear();
        
        // Clear local storage
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        localStorage.removeItem('authToken');
        
        // Call API logout if available
        if (window.sharedApiClient && window.sharedApiClient.logout) {
            await window.sharedApiClient.logout();
        }
        
        // Redirect to sign in page
        window.location.href = '../pages/signin.html';
    } catch (error) {
        console.error('Logout error:', error);
        // Still redirect even if API call fails
        window.location.href = '../pages/signin.html';
    }
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('messageModal');
    if (event.target === modal) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});
