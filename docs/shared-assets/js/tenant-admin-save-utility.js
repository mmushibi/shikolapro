// Tenant Admin Save Utility for Shikola Pro
console.log('Tenant Admin Save Utility loaded');

window.tenantAdminSave = {
    // Initialize the save utility
    init: function() {
        console.log('Tenant Admin Save Utility initialized');
        this.setupAutoSave();
        this.setupFormValidation();
    },

    // Generic save function for any form data
    async saveData(endpoint, data, options = {}) {
        const {
            method = 'POST',
            successMessage = 'Data saved successfully!',
            errorMessage = 'Failed to save data',
            showLoading = true,
            redirectOnSuccess = null
        } = options;

        try {
            if (showLoading) {
                this.showLoading(true);
            }

            const response = await window.sharedApiClient.request(endpoint, {
                method: method,
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                this.showSuccess(successMessage);
                
                if (redirectOnSuccess) {
                    setTimeout(() => {
                        window.location.href = redirectOnSuccess;
                    }, 1500);
                }
                
                return { success: true, data: result };
            } else {
                throw new Error(result.message || errorMessage);
            }

        } catch (error) {
            console.error('Save error:', error);
            this.showError(errorMessage + ': ' + error.message);
            return { success: false, error: error.message };
        } finally {
            if (showLoading) {
                this.showLoading(false);
            }
        }
    },

    // Save department data
    async saveDepartment(departmentData) {
        const endpoint = departmentData.id 
            ? `/departments/${departmentData.id}` 
            : '/departments';
        
        const method = departmentData.id ? 'PUT' : 'POST';
        
        return this.saveData(endpoint, departmentData, {
            method: method,
            successMessage: `Department ${departmentData.id ? 'updated' : 'created'} successfully!`,
            errorMessage: `Failed to ${departmentData.id ? 'update' : 'create'} department`
        });
    },

    // Save course data
    async saveCourse(courseData) {
        const endpoint = courseData.id 
            ? `/courses/${courseData.id}` 
            : '/courses';
        
        const method = courseData.id ? 'PUT' : 'POST';
        
        return this.saveData(endpoint, courseData, {
            method: method,
            successMessage: `Course ${courseData.id ? 'updated' : 'created'} successfully!`,
            errorMessage: `Failed to ${courseData.id ? 'update' : 'create'} course`
        });
    },

    // Save timetable entry
    async saveTimetable(timetableData) {
        const endpoint = timetableData.id 
            ? `/timetable/${timetableData.id}` 
            : '/timetable';
        
        const method = timetableData.id ? 'PUT' : 'POST';
        
        return this.saveData(endpoint, timetableData, {
            method: method,
            successMessage: `Timetable entry ${timetableData.id ? 'updated' : 'created'} successfully!`,
            errorMessage: `Failed to ${timetableData.id ? 'update' : 'create'} timetable entry`
        });
    },

    // Save exam schedule
    async saveExam(examData) {
        const endpoint = examData.id 
            ? `/exams/${examData.id}` 
            : '/exams';
        
        const method = examData.id ? 'PUT' : 'POST';
        
        return this.saveData(endpoint, examData, {
            method: method,
            successMessage: `Exam ${examData.id ? 'updated' : 'created'} successfully!`,
            errorMessage: `Failed to ${examData.id ? 'update' : 'create'} exam`
        });
    },

    // Save communication
    async saveCommunication(communicationData) {
        const endpoint = communicationData.id 
            ? `/communications/${communicationData.id}` 
            : '/communications';
        
        const method = communicationData.id ? 'PUT' : 'POST';
        
        return this.saveData(endpoint, communicationData, {
            method: method,
            successMessage: `Communication ${communicationData.id ? 'updated' : 'sent'} successfully!`,
            errorMessage: `Failed to ${communicationData.id ? 'update' : 'send'} communication`
        });
    },

    // Save finance data
    async saveFinanceData(financeData, type) {
        const endpoint = type 
            ? `/finance/${type}/${financeData.id || ''}` 
            : '/finance';
        
        const method = financeData.id ? 'PUT' : 'POST';
        
        return this.saveData(endpoint, financeData, {
            method: method,
            successMessage: `Financial data ${financeData.id ? 'updated' : 'created'} successfully!`,
            errorMessage: `Failed to ${financeData.id ? 'update' : 'create'} financial data`
        });
    },

    // Save user data
    async saveUser(userData) {
        const endpoint = userData.id 
            ? `/users/${userData.id}` 
            : '/users';
        
        const method = userData.id ? 'PUT' : 'POST';
        
        return this.saveData(endpoint, userData, {
            method: method,
            successMessage: `User ${userData.id ? 'updated' : 'created'} successfully!`,
            errorMessage: `Failed to ${userData.id ? 'update' : 'create'} user`
        });
    },

    // Save settings
    async saveSettings(settingsData) {
        return this.saveData('/settings', settingsData, {
            method: 'PUT',
            successMessage: 'Settings updated successfully!',
            errorMessage: 'Failed to update settings'
        });
    },

    // Delete data
    async deleteData(endpoint, id, options = {}) {
        const {
            successMessage = 'Item deleted successfully!',
            errorMessage = 'Failed to delete item',
            confirmMessage = 'Are you sure you want to delete this item?'
        } = options;

        if (!confirm(confirmMessage)) {
            return { success: false, cancelled: true };
        }

        try {
            this.showLoading(true);

            const response = await window.sharedApiClient.request(`${endpoint}/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showSuccess(successMessage);
                return { success: true };
            } else {
                throw new Error(errorMessage);
            }

        } catch (error) {
            console.error('Delete error:', error);
            this.showError(errorMessage + ': ' + error.message);
            return { success: false, error: error.message };
        } finally {
            this.showLoading(false);
        }
    },

    // Auto-save functionality
    setupAutoSave: function() {
        const autoSaveForms = document.querySelectorAll('[data-auto-save]');
        
        autoSaveForms.forEach(form => {
            let saveTimeout;
            const inputs = form.querySelectorAll('input, select, textarea');
            
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    clearTimeout(saveTimeout);
                    saveTimeout = setTimeout(() => {
                        this.autoSaveForm(form);
                    }, 2000); // Auto-save after 2 seconds of inactivity
                });
            });
        });
    },

    // Auto-save form data
    async autoSaveForm(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        const endpoint = form.dataset.autoSave;
        
        try {
            await this.saveData(endpoint, data, {
                successMessage: 'Auto-saved',
                errorMessage: 'Auto-save failed',
                showLoading: false
            });
        } catch (error) {
            console.error('Auto-save error:', error);
        }
    },

    // Form validation
    setupFormValidation: function() {
        const forms = document.querySelectorAll('form[data-validate]');
        
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                    return false;
                }
            });
        });
    },

    // Validate form
    validateForm: function(form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                this.showFieldError(field, 'This field is required');
                isValid = false;
            } else {
                this.clearFieldError(field);
            }
            
            // Email validation
            if (field.type === 'email' && field.value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(field.value)) {
                    this.showFieldError(field, 'Please enter a valid email address');
                    isValid = false;
                }
            }
            
            // Phone validation
            if (field.type === 'tel' && field.value) {
                const phoneRegex = /^[\d\s\-\+\(\)]+$/;
                if (!phoneRegex.test(field.value)) {
                    this.showFieldError(field, 'Please enter a valid phone number');
                    isValid = false;
                }
            }
        });
        
        return isValid;
    },

    // Show field error
    showFieldError: function(field, message) {
        field.classList.add('border-red-500');
        
        let errorElement = field.parentNode.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error text-red-500 text-xs mt-1';
            field.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
    },

    // Clear field error
    clearFieldError: function(field) {
        field.classList.remove('border-red-500');
        
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    },

    // Show loading state
    showLoading: function(show) {
        const loadingOverlay = document.getElementById('loading-overlay');
        
        if (show) {
            if (!loadingOverlay) {
                const overlay = document.createElement('div');
                overlay.id = 'loading-overlay';
                overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                overlay.innerHTML = `
                    <div class="bg-white rounded-lg p-6 flex items-center gap-3">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                        <span class="text-sm text-slate-600">Saving...</span>
                    </div>
                `;
                document.body.appendChild(overlay);
            }
        } else {
            if (loadingOverlay) {
                loadingOverlay.remove();
            }
        }
    },

    // Show success message
    showSuccess: function(message) {
        this.showMessage(message, 'success');
    },

    // Show error message
    showError: function(message) {
        this.showMessage(message, 'error');
    },

    // Show message
    showMessage: function(message, type = 'info') {
        const messageContainer = document.getElementById('message-container');
        
        if (!messageContainer) {
            const container = document.createElement('div');
            container.id = 'message-container';
            container.className = 'fixed top-4 right-4 z-50 space-y-2';
            document.body.appendChild(container);
        }
        
        const messageElement = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
        
        messageElement.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in`;
        messageElement.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" class="ml-4 hover:opacity-75">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.getElementById('message-container').appendChild(messageElement);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 5000);
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (window.tenantAdminSave) {
        window.tenantAdminSave.init();
    }
});
