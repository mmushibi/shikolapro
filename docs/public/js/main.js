// Main JavaScript for Shikola Pro Landing Page

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initMobileMenu();
    initHeroSlider();
    initSmoothScrolling();
    initScrollAnimations();
    initContactForm();
});

// Contact Form Functionality
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitBtn = this.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('.btn-text');
            const spinner = submitBtn.querySelector('.loading-spinner');
            
            // Validate form
            if (!validateContactForm(formData)) {
                return;
            }
            
            // Show loading state
            btnText.style.display = 'none';
            spinner.style.display = 'inline-block';
            submitBtn.disabled = true;
            
            // Simulate API call
            setTimeout(() => {
                // Hide loading state
                btnText.style.display = 'inline';
                spinner.style.display = 'none';
                submitBtn.disabled = false;
                
                // Show success message
                showModal('Message Sent!', 'Thank you for contacting us. We will get back to you within 24 hours.');
                
                // Reset form
                this.reset();
            }, 2000);
        });
    }
}

function validateContactForm(formData) {
    const name = formData.get('name');
    const email = formData.get('email');
    const subject = formData.get('subject');
    const message = formData.get('message');
    
    if (!name || !email || !subject || !message) {
        showModal('Error', 'Please fill in all required fields.');
        return false;
    }
    
    if (!validateEmail(email)) {
        showModal('Error', 'Please enter a valid email address.');
        return false;
    }
    
    if (message.length < 10) {
        showModal('Error', 'Message must be at least 10 characters long.');
        return false;
    }
    
    return true;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showModal(title, message) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('messageModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'messageModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modalTitle">Message</h3>
                    <button class="close-modal" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <p id="modalMessage"></p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="closeModal()">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Add modal styles
        const modalStyles = document.createElement('style');
        modalStyles.textContent = `
            .modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 1000;
                align-items: center;
                justify-content: center;
            }
            .modal.show {
                display: flex;
            }
            .modal-content {
                background: white;
                border-radius: 15px;
                max-width: 500px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
            }
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1.5rem;
                border-bottom: 1px solid #f8f9fa;
            }
            .modal-header h3 {
                margin: 0;
                color: #006994;
            }
            .close-modal {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #333;
            }
            .modal-body {
                padding: 1.5rem;
            }
            .modal-footer {
                padding: 1.5rem;
                border-top: 1px solid #f8f9fa;
                text-align: right;
            }
        `;
        document.head.appendChild(modalStyles);
    }
    
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('messageModal');
    if (modal) {
        modal.classList.remove('show');
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

// Mobile Menu Toggle
function initMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            mobileToggle.classList.toggle('active');
        });
    }
}

// Hero Slider
function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const prevBtn = document.querySelector('.nav-btn.prev');
    const nextBtn = document.querySelector('.nav-btn.next');
    let currentSlide = 0;
    
    if (slides.length === 0) return;
    
    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        slides[index].classList.add('active');
    }
    
    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }
    
    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
    }
    
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    
    // Auto-advance slides every 5 seconds
    setInterval(nextSlide, 5000);
}

// Smooth Scrolling
function initSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Scroll Animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe feature cards, stats, and module items
    const animateElements = document.querySelectorAll('.feature-card, .stat-item, .module-item');
    animateElements.forEach(element => {
        observer.observe(element);
    });
}

// Add CSS animation classes
const style = document.createElement('style');
style.textContent = `
    .feature-card, .stat-item, .module-item {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease;
    }
    
    .feature-card.animate-in, .stat-item.animate-in, .module-item.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .feature-card:nth-child(1).animate-in { transition-delay: 0.1s; }
    .feature-card:nth-child(2).animate-in { transition-delay: 0.2s; }
    .feature-card:nth-child(3).animate-in { transition-delay: 0.3s; }
    .feature-card:nth-child(4).animate-in { transition-delay: 0.4s; }
    .feature-card:nth-child(5).animate-in { transition-delay: 0.5s; }
    .feature-card:nth-child(6).animate-in { transition-delay: 0.6s; }
    
    .stat-item:nth-child(1).animate-in { transition-delay: 0.1s; }
    .stat-item:nth-child(2).animate-in { transition-delay: 0.2s; }
    .stat-item:nth-child(3).animate-in { transition-delay: 0.3s; }
    .stat-item:nth-child(4).animate-in { transition-delay: 0.4s; }
    
    .module-item:nth-child(1).animate-in { transition-delay: 0.1s; }
    .module-item:nth-child(2).animate-in { transition-delay: 0.2s; }
    .module-item:nth-child(3).animate-in { transition-delay: 0.3s; }
    .module-item:nth-child(4).animate-in { transition-delay: 0.4s; }
    .module-item:nth-child(5).animate-in { transition-delay: 0.5s; }
    .module-item:nth-child(6).animate-in { transition-delay: 0.6s; }
`;
document.head.appendChild(style);
