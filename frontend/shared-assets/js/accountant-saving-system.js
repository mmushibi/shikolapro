// Accountant Data Saving System for Shikola Pro
console.log('Accountant Saving System loaded');

window.accountantSavingSystem = {
    // Local storage keys
    storageKeys: {
        fees: 'accountant_fees',
        expenses: 'accountant_expenses',
        budget: 'accountant_budget',
        invoices: 'accountant_invoices',
        payroll: 'accountant_payroll',
        reports: 'accountant_reports',
        audit: 'accountant_audit',
        settings: 'accountant_settings',
        studentFees: 'accountant_student_fees'
    },

    // Initialize the saving system
    init: function() {
        console.log('Accountant Saving System initialized');
        this.loadAllData();
    },

    // Load all data from localStorage
    loadAllData: function() {
        const data = {};
        Object.keys(this.storageKeys).forEach(key => {
            const stored = localStorage.getItem(this.storageKeys[key]);
            data[key] = stored ? JSON.parse(stored) : [];
        });
        return data;
    },

    // Save data to localStorage
    saveData: function(type, data) {
        const key = this.storageKeys[type];
        if (!key) {
            console.error('Unknown data type:', type);
            return false;
        }
        
        try {
            localStorage.setItem(key, JSON.stringify(data));
            console.log(`${type} data saved successfully`);
            
            // Broadcast real-time update if system is available
            if (window.accountantRealtimeSystem) {
                accountantRealtimeSystem.broadcastChange(type, 'update', data);
            }
            
            return true;
        } catch (error) {
            console.error(`Error saving ${type} data:`, error);
            return false;
        }
    },

    // Get data of specific type
    getData: function(type) {
        const key = this.storageKeys[type];
        if (!key) {
            console.error('Unknown data type:', type);
            return [];
        }
        
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    },

    // Add new item to data
    addItem: function(type, item) {
        const data = this.getData(type);
        const newItem = {
            id: this.generateId(),
            createdAt: new Date().toISOString(),
            ...item
        };
        
        data.unshift(newItem);
        this.saveData(type, data);
        return newItem;
    },

    // Update existing item
    updateItem: function(type, id, updates) {
        const data = this.getData(type);
        const index = data.findIndex(item => item.id === id);
        
        if (index !== -1) {
            data[index] = {
                ...data[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveData(type, data);
            return data[index];
        }
        
        return null;
    },

    // Delete item
    deleteItem: function(type, id) {
        const data = this.getData(type);
        const filteredData = data.filter(item => item.id !== id);
        
        if (filteredData.length !== data.length) {
            this.saveData(type, filteredData);
            return true;
        }
        
        return false;
    },

    // Generate unique ID
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Show success message
    showSuccess: function(message) {
        if (window.sharedMessages) {
            sharedMessages.showSuccess(message);
        } else {
            alert(message);
        }
    },

    // Show error message
    showError: function(message) {
        if (window.sharedMessages) {
            sharedMessages.showError(message);
        } else {
            alert(message);
        }
    },

    // Sync with server (if API is available)
    syncWithServer: async function(type, data, action = 'save') {
        if (!window.sharedApiClient) {
            console.log('API client not available, using local storage only');
            return null;
        }

        try {
            let response;
            switch (action) {
                case 'save':
                    response = await sharedApiClient.request(`/accountant/${type}`, {
                        method: 'POST',
                        body: JSON.stringify(data)
                    });
                    break;
                case 'update':
                    response = await sharedApiClient.request(`/accountant/${type}/${data.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(data)
                    });
                    break;
                case 'delete':
                    response = await sharedApiClient.request(`/accountant/${type}/${data.id}`, {
                        method: 'DELETE'
                    });
                    break;
            }
            
            return response;
        } catch (error) {
            console.error('Server sync failed:', error);
            return null;
        }
    },

    // Fee collection specific methods
    collectFee: function(studentId, amount, note) {
        const studentFees = this.getData('studentFees');
        const studentIndex = studentFees.findIndex(s => s.id === studentId);
        
        if (studentIndex !== -1) {
            const student = studentFees[studentIndex];
            const collectionData = {
                studentId: studentId,
                studentName: student.description,
                amount: parseFloat(amount),
                note: note,
                collectionDate: new Date().toISOString(),
                status: 'approved'
            };

            // Add to fees collection
            this.addItem('fees', collectionData);

            // Update student balance
            studentFees[studentIndex].balance -= parseFloat(amount);
            studentFees[studentIndex].status = 'approved';
            studentFees[studentIndex].lastPayment = new Date().toISOString().split('T')[0];
            
            this.saveData('studentFees', studentFees);
            
            this.showSuccess(`Fee collection of ZMW ${amount} recorded for ${student.description}`);
            return collectionData;
        }
        
        this.showError('Student not found');
        return null;
    },

    // Expense management
    addExpense: function(expenseData) {
        const expense = {
            ...expenseData,
            amount: parseFloat(expenseData.amount),
            date: expenseData.date || new Date().toISOString().split('T')[0],
            status: 'pending'
        };
        
        return this.addItem('expenses', expense);
    },

    // Budget management
    updateBudget: function(budgetData) {
        const existingBudget = this.getData('budget');
        if (existingBudget.length > 0) {
            return this.updateItem('budget', existingBudget[0].id, budgetData);
        } else {
            return this.addItem('budget', budgetData);
        }
    },

    // Invoice management
    createInvoice: function(invoiceData) {
        const invoice = {
            ...invoiceData,
            invoiceNumber: this.generateInvoiceNumber(),
            amount: parseFloat(invoiceData.amount),
            status: 'draft',
            createdAt: new Date().toISOString()
        };
        
        return this.addItem('invoices', invoice);
    },

    // Generate invoice number
    generateInvoiceNumber: function() {
        const prefix = 'INV';
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${prefix}-${year}-${random}`;
    },

    // Payroll management
    addPayrollEntry: function(payrollData) {
        const payroll = {
            ...payrollData,
            amount: parseFloat(payrollData.amount),
            status: 'pending',
            payDate: payrollData.payDate || new Date().toISOString().split('T')[0]
        };
        
        return this.addItem('payroll', payroll);
    },

    // Audit trail
    addAuditEntry: function(action, details) {
        const auditEntry = {
            action: action,
            details: details,
            timestamp: new Date().toISOString(),
            userId: 'accountant', // Would get from auth system
            userName: 'Sarah Johnson' // Would get from auth system
        };
        
        return this.addItem('audit', auditEntry);
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    accountantSavingSystem.init();
});
