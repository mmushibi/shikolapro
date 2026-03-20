// Unified Student Data Service for Shikola Pro
// Enables cross-module data sharing between Admin, HR, Accountant, Registry, and Hostel
console.log('Unified Student Data Service loaded');

window.unifiedStudentService = {
    // Central storage for all student-related data
    studentData: {
        students: [],
        admissions: [],
        enrollments: [],
        financial: [],
        academic: {
            grades: [],
            attendance: [],
            assignments: [],
            courses: [],
            transcripts: []
        },
        hostel: {
            residents: [],
            allocations: [],
            rooms: [],
            visitors: []
        },
        hr: {
            recruitment: [],
            employees: [],
            training: [],
            performance: []
        },
        registry: {
            certificates: [],
            admissions: [],
            transcripts: [],
            reports: []
        },
        communications: {
            messages: [],
            notifications: [],
            announcements: []
        },
        medical: {
            records: [],
            emergencies: [],
            insurance: []
        },
        disciplinary: {
            incidents: [],
            actions: [],
            warnings: []
        }
    },

    // Module mappings
    moduleMappings: {
        hr: {
            recruitment: 'hr.recruitment',
            employees: 'hr.employees',
            training: 'hr.training',
            performance: 'hr.performance'
        },
        accountant: {
            studentFees: 'financial',
            payroll: 'financial',
            invoices: 'financial',
            expenses: 'financial',
            budget: 'financial'
        },
        registry: {
            admissions: 'registry.admissions',
            certificates: 'registry.certificates',
            transcripts: 'registry.transcripts',
            courses: 'academic.courses',
            grades: 'academic.grades',
            attendance: 'academic.attendance'
        },
        hostel: {
            residents: 'hostel.residents',
            allocations: 'hostel.allocations',
            rooms: 'hostel.rooms',
            visitors: 'hostel.visitors'
        },
        academic: {
            grades: 'academic.grades',
            attendance: 'academic.attendance',
            assignments: 'academic.assignments',
            courses: 'academic.courses',
            transcripts: 'academic.transcripts'
        },
        communications: {
            messages: 'communications.messages',
            notifications: 'communications.notifications',
            announcements: 'communications.announcements'
        },
        medical: {
            records: 'medical.records',
            emergencies: 'medical.emergencies',
            insurance: 'medical.insurance'
        },
        disciplinary: {
            incidents: 'disciplinary.incidents',
            actions: 'disciplinary.actions',
            warnings: 'disciplinary.warnings'
        }
    },

    // Initialize the service
    init: function() {
        console.log('Unified Student Service initialized');
        this.loadFromServer();
        this.setupRealtimeSync();
        this.setupStorageEvents();
        this.migrateLegacyData();
    },

    // Load data from server API
    async loadFromServer() {
        try {
            if (window.sharedApiClient) {
                // Load core student data
                const students = await sharedApiClient.getData('users');
                const admissions = await sharedApiClient.getData('admissions');
                const financial = await sharedApiClient.getData('financial');
                
                this.studentData.students = students.filter(user => user.role === 'student' || user.role === 'applicant');
                this.studentData.admissions = admissions;
                this.studentData.financial = financial;
                
                console.log('Loaded student data from server:', {
                    students: this.studentData.students.length,
                    admissions: this.studentData.admissions.length,
                    financial: this.studentData.financial.length
                });
            }
        } catch (error) {
            console.error('Error loading from server:', error);
            this.loadFromLocalStorage();
        }
    },

    // Fallback to localStorage
    loadFromLocalStorage() {
        try {
            const cached = localStorage.getItem('unifiedStudentData');
            if (cached) {
                this.studentData = JSON.parse(cached);
                console.log('Loaded cached student data');
            }
        } catch (error) {
            console.error('Error loading cached data:', error);
        }
    },

    // Save data to both server and localStorage
    async saveData(entity, data, sourceModule = null) {
        try {
            // Update local cache
            this.studentData[entity] = data;
            localStorage.setItem('unifiedStudentData', JSON.stringify(this.studentData));
            
            // Save to server if available
            if (window.sharedApiClient) {
                const serverEntity = this.mapToServerEntity(entity);
                if (serverEntity) {
                    await sharedApiClient.createData(serverEntity, data);
                }
            }
            
            // Broadcast real-time update
            this.broadcastUpdate(entity, data, sourceModule);
            
            console.log(`Saved ${entity} data from ${sourceModule || 'unknown'}`);
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    },

    // Map local entity to server entity
    mapToServerEntity(localEntity) {
        const entityMap = {
            'students': 'users',
            'admissions': 'admissions',
            'financial': 'financial',
            'enrollments': 'enrollments'
        };
        return entityMap[localEntity] || null;
    },

    // Add new student (unified across all modules)
    async addStudent(studentData, sourceModule) {
        const newStudent = {
            id: this.generateId(),
            role: 'student',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tenantId: this.getCurrentTenantId(),
            sourceModule: sourceModule,
            ...studentData,
            // Track which modules have access/updates
            moduleAccess: {
                hr: sourceModule === 'hr',
                accountant: sourceModule === 'accountant',
                registry: sourceModule === 'registry',
                hostel: sourceModule === 'hostel',
                admin: sourceModule === 'admin'
            }
        };

        try {
            // Save to server first
            if (window.sharedApiClient) {
                const response = await sharedApiClient.request('/unified-students', {
                    method: 'POST',
                    body: JSON.stringify(newStudent)
                });
                
                if (response.data) {
                    // Use server response
                    newStudent.id = response.data.id;
                    newStudent.createdAt = response.data.createdAt;
                }
            }
            
            // Add to local cache
            this.studentData.students.push(newStudent);
            localStorage.setItem('unifiedStudentData', JSON.stringify(this.studentData));
            
            // Also create financial record
            await this.createStudentFinancialRecord(newStudent.id, newStudent.name);
            
            // Broadcast update
            this.broadcastUpdate('students', this.studentData.students, sourceModule);
            
            console.log(`New student added from ${sourceModule}:`, newStudent);
            return newStudent;
        } catch (error) {
            console.error('Error adding student:', error);
            
            // Fallback to local only
            this.studentData.students.push(newStudent);
            localStorage.setItem('unifiedStudentData', JSON.stringify(this.studentData));
            await this.createStudentFinancialRecord(newStudent.id, newStudent.name);
            this.broadcastUpdate('students', this.studentData.students, sourceModule);
            
            return newStudent;
        }
    },

    // Update existing student
    async updateStudent(studentId, updates, sourceModule) {
        const index = this.studentData.students.findIndex(s => s.id === studentId);
        if (index === -1) return null;

        this.studentData.students[index] = {
            ...this.studentData.students[index],
            ...updates,
            updatedAt: new Date().toISOString(),
            // Update module access
            moduleAccess: {
                ...this.studentData.students[index].moduleAccess,
                [sourceModule]: true
            }
        };

        await this.saveData('students', this.studentData.students, sourceModule);
        
        console.log(`Student updated from ${sourceModule}:`, this.studentData.students[index]);
        return this.studentData.students[index];
    },

    // Get students with module-specific filtering
    getStudents(options = {}) {
        let students = [...this.studentData.students];
        
        // Filter by module access if specified
        if (options.module) {
            students = students.filter(student => 
                student.moduleAccess && student.moduleAccess[options.module]
            );
        }
        
        // Filter by status
        if (options.status) {
            students = students.filter(student => student.status === options.status);
        }
        
        // Filter by search query
        if (options.search) {
            const query = options.search.toLowerCase();
            students = students.filter(student => 
                student.name?.toLowerCase().includes(query) ||
                student.email?.toLowerCase().includes(query) ||
                student.id?.toLowerCase().includes(query)
            );
        }
        
        return students;
    },

    // Get student by ID
    getStudent(studentId) {
        return this.studentData.students.find(s => s.id === studentId);
    },

    // Create financial record for new student
    async createStudentFinancialRecord(studentId, studentName) {
        const financialRecord = {
            studentId: studentId,
            studentName: studentName,
            balance: 0,
            totalFees: 0,
            paidFees: 0,
            status: 'pending',
            feeHistory: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.studentData.financial.push(financialRecord);
        await this.saveData('financial', this.studentData.financial, 'system');
    },

    // Get student financial data
    getStudentFinancial(studentId) {
        return this.studentData.financial.find(f => f.studentId === studentId);
    },

    // Update student financial data
    async updateStudentFinancial(studentId, financialData, sourceModule) {
        const index = this.studentData.financial.findIndex(f => f.studentId === studentId);
        if (index === -1) return null;

        this.studentData.financial[index] = {
            ...this.studentData.financial[index],
            ...financialData,
            updatedAt: new Date().toISOString()
        };

        await this.saveData('financial', this.studentData.financial, sourceModule);
        return this.studentData.financial[index];
    },

    // Setup real-time synchronization
    setupRealtimeSync() {
        // Subscribe to real-time updates
        if (window.realtimeService) {
            realtimeService.subscribe('users', (update) => {
                if (update.type === 'data_update') {
                    this.handleRealtimeUpdate('students', update.data);
                }
            });
        }
    },

    // Setup storage events for cross-tab communication
    setupStorageEvents() {
        window.addEventListener('storage', (event) => {
            if (event.key === 'unifiedStudentData') {
                try {
                    const newData = JSON.parse(event.newValue);
                    this.studentData = newData;
                    this.notifySubscribers('data_updated', newData);
                } catch (error) {
                    console.error('Error handling storage event:', error);
                }
            }
        });
    },

    // Handle real-time updates
    handleRealtimeUpdate(entity, data) {
        if (this.studentData[entity]) {
            this.studentData[entity] = data;
            this.notifySubscribers('realtime_update', { entity, data });
        }
    },

    // Broadcast updates to all modules
    broadcastUpdate(entity, data, sourceModule) {
        const update = {
            type: 'student_data_update',
            entity: entity,
            data: data,
            sourceModule: sourceModule,
            timestamp: new Date().toISOString()
        };

        // Use existing real-time services
        if (window.realtimeService) {
            // Trigger real-time update
            localStorage.setItem('student_update_' + entity, JSON.stringify(update));
            setTimeout(() => {
                localStorage.removeItem('student_update_' + entity);
            }, 100);
        }

        // Notify subscribers
        this.notifySubscribers('data_updated', update);
    },

    // Event subscribers
    subscribers: new Map(),

    // Subscribe to student data updates
    subscribe(eventType, callback) {
        if (!this.subscribers.has(eventType)) {
            this.subscribers.set(eventType, new Set());
        }
        this.subscribers.get(eventType).add(callback);
        
        return () => {
            this.subscribers.get(eventType).delete(callback);
        };
    },

    // Notify all subscribers
    notifySubscribers(eventType, data) {
        const callbacks = this.subscribers.get(eventType);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in subscriber callback:', error);
                }
            });
        }
    },

    // Migrate legacy data from localStorage
    migrateLegacyData() {
        const legacySources = [
            { key: 'hr_employees', module: 'hr' },
            { key: 'hr_recruitment_applications', module: 'hr' },
            { key: 'accountant_student_fees', module: 'accountant' },
            { key: 'hostel_residents', module: 'hostel' }
        ];

        legacySources.forEach(source => {
            try {
                const legacyData = localStorage.getItem(source.key);
                if (legacyData) {
                    const parsed = JSON.parse(legacyData);
                    this.migrateLegacyDataToUnified(parsed, source.module);
                    // Clear legacy data after migration
                    localStorage.removeItem(source.key);
                }
            } catch (error) {
                console.error('Error migrating legacy data:', error);
            }
        });
    },

    // Migrate individual legacy data
    migrateLegacyDataToUnified(legacyData, module) {
        legacyData.forEach(item => {
            if (item.email || item.name) {
                // Convert to unified student format
                const student = {
                    id: item.id || this.generateId(),
                    name: item.name || item.studentName || item.applicantName,
                    email: item.email,
                    role: 'student',
                    status: item.status || 'active',
                    moduleAccess: { [module]: true },
                    legacyData: item,
                    createdAt: item.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                // Check if student already exists
                const existing = this.studentData.students.find(s => 
                    s.email === student.email || s.id === student.id
                );

                if (!existing) {
                    this.studentData.students.push(student);
                }
            }
        });
    },

    // Get current tenant ID
    getCurrentTenantId() {
        if (window.sharedAuth && sharedAuth.getCurrentUser) {
            const user = sharedAuth.getCurrentUser();
            return user?.tenantId || null;
        }
        return null;
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Get comprehensive student profile
    getStudentProfile(studentId) {
        const student = this.studentData.students.find(s => s.id === studentId);
        if (!student) return null;

        return {
            basic: student,
            financial: this.studentData.financial.find(f => f.studentId === studentId),
            academic: {
                grades: this.studentData.academic.grades.filter(g => g.studentId === studentId),
                attendance: this.studentData.academic.attendance.filter(a => a.studentId === studentId),
                assignments: this.studentData.academic.assignments.filter(a => a.studentId === studentId),
                courses: this.studentData.academic.courses.filter(c => c.enrolledStudents?.includes(studentId)),
                transcripts: this.studentData.academic.transcripts.filter(t => t.studentId === studentId)
            },
            hostel: {
                allocation: this.studentData.hostel.allocations.find(a => a.studentId === studentId),
                resident: this.studentData.hostel.residents.find(r => r.studentId === studentId),
                visitors: this.studentData.hostel.visitors.filter(v => v.studentId === studentId)
            },
            hr: {
                recruitment: this.studentData.hr.recruitment.find(r => r.email === student.email),
                training: this.studentData.hr.training.filter(t => t.participants?.includes(studentId)),
                performance: this.studentData.hr.performance.filter(p => p.studentId === studentId)
            },
            registry: {
                certificates: this.studentData.registry.certificates.filter(c => c.studentId === studentId),
                admissions: this.studentData.registry.admissions.find(a => a.studentId === studentId),
                transcripts: this.studentData.registry.transcripts.filter(t => t.studentId === studentId)
            },
            communications: {
                messages: this.studentData.communications.messages.filter(m => m.studentId === studentId),
                notifications: this.studentData.communications.notifications.filter(n => n.studentId === studentId)
            },
            medical: {
                records: this.studentData.medical.records.filter(r => r.studentId === studentId),
                emergencies: this.studentData.medical.emergencies.filter(e => e.studentId === studentId),
                insurance: this.studentData.medical.insurance.find(i => i.studentId === studentId)
            },
            disciplinary: {
                incidents: this.studentData.disciplinary.incidents.filter(i => i.studentId === studentId),
                actions: this.studentData.disciplinary.actions.filter(a => a.studentId === studentId),
                warnings: this.studentData.disciplinary.warnings.filter(w => w.studentId === studentId)
            }
        };
    },

    // Academic data management
    async addGrade(gradeData) {
        const grade = {
            id: this.generateId(),
            ...gradeData,
            createdAt: new Date().toISOString()
        };
        
        this.studentData.academic.grades.push(grade);
        await this.saveData('academic.grades', this.studentData.academic.grades, 'academic');
        return grade;
    },

    async addAttendance(attendanceData) {
        const attendance = {
            id: this.generateId(),
            ...attendanceData,
            createdAt: new Date().toISOString()
        };
        
        this.studentData.academic.attendance.push(attendance);
        await this.saveData('academic.attendance', this.studentData.academic.attendance, 'academic');
        return attendance;
    },

    async addAssignment(assignmentData) {
        const assignment = {
            id: this.generateId(),
            ...assignmentData,
            createdAt: new Date().toISOString()
        };
        
        this.studentData.academic.assignments.push(assignment);
        await this.saveData('academic.assignments', this.studentData.academic.assignments, 'academic');
        return assignment;
    },

    // Enhanced financial management
    async addFeeStructure(feeData) {
        const feeStructure = {
            id: this.generateId(),
            ...feeData,
            createdAt: new Date().toISOString(),
            isActive: true
        };
        
        // Add to financial data
        this.studentData.financial.push(feeStructure);
        await this.saveData('financial', this.studentData.financial, 'accountant');
        return feeStructure;
    },

    async processPayment(studentId, paymentData) {
        const financial = this.studentData.financial.find(f => f.studentId === studentId);
        if (!financial) throw new Error('Student financial record not found');

        const payment = {
            id: this.generateId(),
            studentId: studentId,
            amount: paymentData.amount,
            method: paymentData.method,
            date: paymentData.date || new Date().toISOString().split('T')[0],
            description: paymentData.description,
            createdAt: new Date().toISOString()
        };

        // Update financial record
        financial.paidFees = (financial.paidFees || 0) + paymentData.amount;
        financial.balance = (financial.totalFees || 0) - financial.paidFees;
        financial.status = financial.balance <= 0 ? 'paid' : 'partial';
        financial.lastPayment = paymentData.date;
        financial.feeHistory = financial.feeHistory || [];
        financial.feeHistory.push(payment);

        await this.saveData('financial', this.studentData.financial, 'accountant');
        return payment;
    },

    // Communication management
    async sendMessage(messageData) {
        const message = {
            id: this.generateId(),
            ...messageData,
            createdAt: new Date().toISOString(),
            read: false
        };
        
        this.studentData.communications.messages.push(message);
        await this.saveData('communications.messages', this.studentData.communications.messages, 'communications');
        return message;
    },

    async addNotification(notificationData) {
        const notification = {
            id: this.generateId(),
            ...notificationData,
            createdAt: new Date().toISOString(),
            read: false
        };
        
        this.studentData.communications.notifications.push(notification);
        await this.saveData('communications.notifications', this.studentData.communications.notifications, 'communications');
        return notification;
    },

    // Hostel management
    async allocateRoom(allocationData) {
        const allocation = {
            id: this.generateId(),
            ...allocationData,
            status: 'active',
            createdAt: new Date().toISOString()
        };
        
        this.studentData.hostel.allocations.push(allocation);
        await this.saveData('hostel.allocations', this.studentData.hostel.allocations, 'hostel');
        
        // Update room status
        const room = this.studentData.hostel.rooms.find(r => r.id === allocation.roomId);
        if (room) {
            room.occupied = (room.occupied || 0) + 1;
            room.status = room.occupied >= room.capacity ? 'full' : 'occupied';
            await this.saveData('hostel.rooms', this.studentData.hostel.rooms, 'hostel');
        }
        
        return allocation;
    },

    // Medical records management
    async addMedicalRecord(recordData) {
        const record = {
            id: this.generateId(),
            ...recordData,
            createdAt: new Date().toISOString()
        };
        
        this.studentData.medical.records.push(record);
        await this.saveData('medical.records', this.studentData.medical.records, 'medical');
        return record;
    },

    // Disciplinary management
    async addDisciplinaryIncident(incidentData) {
        const incident = {
            id: this.generateId(),
            ...incidentData,
            createdAt: new Date().toISOString(),
            status: 'open'
        };
        
        this.studentData.disciplinary.incidents.push(incident);
        await this.saveData('disciplinary.incidents', this.studentData.disciplinary.incidents, 'disciplinary');
        return incident;
    },

    // Get data by category with filtering
    getDataByCategory(category, filters = {}) {
        let data = [];
        
        // Navigate to the category
        const categoryPath = category.split('.');
        let currentData = this.studentData;
        
        for (const path of categoryPath) {
            currentData = currentData[path];
            if (!currentData) return [];
        }
        
        data = [...currentData];
        
        // Apply filters
        if (filters.studentId) {
            data = data.filter(item => item.studentId === filters.studentId);
        }
        
        if (filters.status) {
            data = data.filter(item => item.status === filters.status);
        }
        
        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            data = data.filter(item => new Date(item.createdAt || item.date) >= fromDate);
        }
        
        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            data = data.filter(item => new Date(item.createdAt || item.date) <= toDate);
        }
        
        return data;
    },

    // Search across all student data
    searchStudentData(query, options = {}) {
        const results = {
            students: [],
            academic: [],
            financial: [],
            hostel: [],
            communications: [],
            medical: [],
            disciplinary: []
        };
        
        const searchQuery = query.toLowerCase();
        
        // Search students
        results.students = this.studentData.students.filter(student => 
            student.name?.toLowerCase().includes(searchQuery) ||
            student.email?.toLowerCase().includes(searchQuery) ||
            student.id?.toLowerCase().includes(searchQuery)
        );
        
        // Search academic data
        ['grades', 'attendance', 'assignments', 'courses', 'transcripts'].forEach(category => {
            const matches = this.studentData.academic[category].filter(item =>
                item.subject?.toLowerCase().includes(searchQuery) ||
                item.description?.toLowerCase().includes(searchQuery) ||
                item.studentId?.toLowerCase().includes(searchQuery)
            );
            if (matches.length > 0) results.academic.push(...matches);
        });
        
        // Search financial data
        results.financial = this.studentData.financial.filter(item =>
            item.studentName?.toLowerCase().includes(searchQuery) ||
            item.description?.toLowerCase().includes(searchQuery) ||
            item.studentId?.toLowerCase().includes(searchQuery)
        );
        
        // Search hostel data
        ['residents', 'allocations', 'rooms', 'visitors'].forEach(category => {
            const matches = this.studentData.hostel[category].filter(item =>
                item.studentName?.toLowerCase().includes(searchQuery) ||
                item.roomNumber?.toLowerCase().includes(searchQuery) ||
                item.studentId?.toLowerCase().includes(searchQuery)
            );
            if (matches.length > 0) results.hostel.push(...matches);
        });
        
        return results;
    },

    // Get statistics for dashboard
    getStatistics() {
        return {
            totalStudents: this.studentData.students.length,
            activeStudents: this.studentData.students.filter(s => s.status === 'active').length,
            pendingAdmissions: this.studentData.admissions.length,
            totalFinancialRecords: this.studentData.financial.length,
            outstandingFees: this.studentData.financial.filter(f => f.balance > 0).length,
            academicStats: {
                totalGrades: this.studentData.academic.grades.length,
                totalAttendance: this.studentData.academic.attendance.length,
                totalAssignments: this.studentData.academic.assignments.length,
                totalCourses: this.studentData.academic.courses.length
            },
            hostelStats: {
                totalResidents: this.studentData.hostel.residents.length,
                totalAllocations: this.studentData.hostel.allocations.length,
                occupiedRooms: this.studentData.hostel.rooms.filter(r => r.status === 'occupied').length
            },
            communicationStats: {
                totalMessages: this.studentData.communications.messages.length,
                totalNotifications: this.studentData.communications.notifications.length,
                unreadMessages: this.studentData.communications.messages.filter(m => !m.read).length
            },
            moduleStats: {
                hr: this.studentData.students.filter(s => s.moduleAccess?.hr).length,
                accountant: this.studentData.students.filter(s => s.moduleAccess?.accountant).length,
                registry: this.studentData.students.filter(s => s.moduleAccess?.registry).length,
                hostel: this.studentData.students.filter(s => s.moduleAccess?.hostel).length,
                academic: this.studentData.students.filter(s => s.moduleAccess?.academic).length
            }
        };
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.unifiedStudentService.init();
});

// Global event listener for cross-module communication
window.addEventListener('message', (event) => {
    if (event.data.type === 'student_data_request') {
        // Handle requests from other modules/frames
        const response = {
            type: 'student_data_response',
            data: window.unifiedStudentService.getStudents(event.data.options)
        };
        event.source.postMessage(response, '*');
    }
});
