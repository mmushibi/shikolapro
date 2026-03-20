const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs').promises;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'shikola-pro-secret-key-2024';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Set proper MIME types for static files
app.use((req, res, next) => {
    if (req.path.endsWith('.js')) {
        res.set('Content-Type', 'application/javascript');
    } else if (req.path.endsWith('.css')) {
        res.set('Content-Type', 'text/css');
    }
    next();
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Serve static files from frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Database paths
const DB_PATH = path.join(__dirname, 'database');
const USERS_DB = path.join(DB_PATH, 'users.json');
const INSTITUTIONS_DB = path.join(DB_PATH, 'institutions.json');
const COURSES_DB = path.join(DB_PATH, 'courses.json');
const ENROLLMENTS_DB = path.join(DB_PATH, 'enrollments.json');
const NOTIFICATIONS_DB = path.join(DB_PATH, 'notifications.json');
const ATTENDANCE_DB = path.join(DB_PATH, 'attendance.json');
const GRADES_DB = path.join(DB_PATH, 'grades.json');
const ASSIGNMENTS_DB = path.join(DB_PATH, 'assignments.json');
const SUBMISSIONS_DB = path.join(DB_PATH, 'submissions.json');
const COMMUNICATIONS_DB = path.join(DB_PATH, 'communications.json');
const FINANCIAL_DB = path.join(DB_PATH, 'financial.json');
const REPORTS_DB = path.join(DB_PATH, 'reports.json');
const AUDIT_DB = path.join(DB_PATH, 'audit.json');
const ADMISSIONS_DB = path.join(DB_PATH, 'admissions.json');
const CERTIFICATES_DB = path.join(DB_PATH, 'certificates.json');
const TRANSCRIPTS_DB = path.join(DB_PATH, 'transcripts.json');
const SETTINGS_DB = path.join(DB_PATH, 'settings.json');
const MEDICAL_DB = path.join(DB_PATH, 'medical.json');
const DISCIPLINARY_DB = path.join(DB_PATH, 'disciplinary.json');
const HOSTEL_ROOMS_DB = path.join(DB_PATH, 'hostel_rooms.json');
const HOSTEL_ALLOCATIONS_DB = path.join(DB_PATH, 'hostel_allocations.json');
const HOSTEL_RESIDENTS_DB = path.join(DB_PATH, 'hostel_residents.json');

// Initialize database directory and files
async function initializeDatabase() {
    try {
        await fs.mkdir(DB_PATH, { recursive: true });
        
        const dbFiles = [
            { path: USERS_DB, defaultData: getDefaultUsers() },
            { path: INSTITUTIONS_DB, defaultData: getDefaultInstitutions() },
            { path: COURSES_DB, defaultData: [] },
            { path: ENROLLMENTS_DB, defaultData: [] },
            { path: NOTIFICATIONS_DB, defaultData: [] },
            { path: ATTENDANCE_DB, defaultData: [] },
            { path: GRADES_DB, defaultData: [] },
            { path: ASSIGNMENTS_DB, defaultData: [] },
            { path: SUBMISSIONS_DB, defaultData: [] },
            { path: COMMUNICATIONS_DB, defaultData: [] },
            { path: FINANCIAL_DB, defaultData: [] },
            { path: REPORTS_DB, defaultData: [] },
            { path: AUDIT_DB, defaultData: [] },
            { path: ADMISSIONS_DB, defaultData: [] },
            { path: CERTIFICATES_DB, defaultData: [] },
            { path: TRANSCRIPTS_DB, defaultData: [] },
            { path: SETTINGS_DB, defaultData: [] },
            { path: MEDICAL_DB, defaultData: [] },
            { path: DISCIPLINARY_DB, defaultData: [] },
            { path: HOSTEL_ROOMS_DB, defaultData: [] },
            { path: HOSTEL_ALLOCATIONS_DB, defaultData: [] },
            { path: HOSTEL_RESIDENTS_DB, defaultData: [] }
        ];

        for (const { path, defaultData } of dbFiles) {
            try {
                await fs.access(path);
            } catch {
                await fs.writeFile(path, JSON.stringify(defaultData, null, 2));
            }
        }

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// Get default users with hashed passwords
function getDefaultUsers() {
    const defaultUsers = [
        {
            id: 'admin_001',
            name: 'System Administrator',
            email: 'admin@shikola.com',
            password: 'admin123', // Will be hashed
            role: 'system-admin',
            tenantId: null,
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'ops_001',
            name: 'Operations Administrator',
            email: 'ops@shikola.com',
            password: 'ops123', // Will be hashed
            role: 'operations-admin',
            tenantId: null,
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'tenant_001',
            name: 'Tenant Administrator',
            email: 'tenant@shikola.com',
            password: 'tenant123', // Will be hashed
            role: 'tenant-admin',
            tenantId: 'tenant_001',
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'staff_001',
            name: 'Teacher John',
            email: 'john@shikola.com',
            password: 'staff123', // Will be hashed
            role: 'staff',
            tenantId: 'tenant_001',
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'student_001',
            name: 'Student Jane',
            email: 'jane@shikola.com',
            password: 'student123', // Will be hashed
            role: 'student',
            tenantId: 'tenant_001',
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'parent_001',
            name: 'Parent Bob',
            email: 'bob@shikola.com',
            password: 'parent123', // Will be hashed
            role: 'parent',
            tenantId: 'tenant_001',
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];

    // Hash passwords
    return defaultUsers.map(user => ({
        ...user,
        password: bcrypt.hashSync(user.password, 10)
    }));
}

// Get default institutions
function getDefaultInstitutions() {
    return [
        {
            id: "institution_001",
            name: "Shikola Central University",
            code: "ZCU",
            type: "university",
            status: "active",
            subscription: {
                plan: "premium",
                expiresAt: "2026-12-31T23:59:59.999Z",
                features: ["full_system", "unlimited_users", "advanced_analytics", "priority_support"]
            },
            contact: {
                email: "admin@zcu.edu.zm",
                phone: "+260 211 123456",
                address: "Great East Road, Lusaka, Zambia"
            },
            settings: {
                timezone: "Africa/Lusaka",
                currency: "ZMW",
                academicYear: "2026",
                semester: "1",
                gradingScale: "A-F",
                attendancePolicy: "75%"
            },
            departments: [
                {
                    id: "dept_001",
                    name: "Computer Science",
                    code: "CS",
                    head: "John Banda",
                    programs: ["BSc Computer Science", "MSc Computer Science"]
                },
                {
                    id: "dept_002",
                    name: "Business Administration",
                    code: "BA",
                    head: "Mary Mwale",
                    programs: ["BBA", "MBA"]
                },
                {
                    id: "dept_003",
                    name: "Medicine",
                    code: "MED",
                    head: "Dr. Sarah Mwale",
                    programs: ["MBBS", "BSc Nursing"]
                },
                {
                    id: "dept_004",
                    name: "Finance",
                    code: "FIN",
                    head: "David Chanda",
                    programs: []
                },
                {
                    id: "dept_005",
                    name: "Human Resources",
                    code: "HR",
                    head: "Grace Banda",
                    programs: []
                },
                {
                    id: "dept_006",
                    name: "Registry",
                    code: "REG",
                    head: "Peter Mwansa",
                    programs: []
                }
            ],
            statistics: {
                totalStudents: 1250,
                totalStaff: 85,
                totalPrograms: 15,
                activeCourses: 120
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];
}

// Database helper functions
async function readDatabase(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return [];
    }
}

async function writeDatabase(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
        return false;
    }
}

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Logging middleware
async function logAction(action, entity, entityId, userId, details = {}) {
    const log = {
        id: uuidv4(),
        action,
        entity,
        entityId,
        userId,
        timestamp: new Date().toISOString(),
        details: {
            ...details,
            userAgent: req.get('User-Agent'),
            ip: req.ip
        }
    };

    const logs = await readDatabase(AUDIT_DB);
    logs.push(log);
    await writeDatabase(AUDIT_DB, logs);
}

// API Routes

// Authentication
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const users = await readDatabase(USERS_DB);
        const user = users.find(u => u.email === email && u.active);

        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.role, 
                tenantId: user.tenantId 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            message: 'Login successful',
            token,
            user: userWithoutPassword
        });

        await logAction('login', 'user', user.id, user.id);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
    try {
        await logAction('logout', 'user', req.user.id, req.user.id);
        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const users = await readDatabase(USERS_DB);
        const user = users.find(u => u.id === req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User Management
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const { role, tenantId, search, page = 1, limit = 10 } = req.query;
        let users = await readDatabase(USERS_DB);

        // Filter based on user permissions
        if (req.user.role !== 'system-admin' && req.user.role !== 'operations-admin') {
            // Tenant admins can only see users from their tenant
            users = users.filter(u => u.tenantId === req.user.tenantId);
        }

        // Apply filters
        if (role) {
            users = users.filter(u => u.role === role);
        }
        if (tenantId) {
            users = users.filter(u => u.tenantId === tenantId);
        }
        if (search) {
            const searchLower = search.toLowerCase();
            users = users.filter(u => 
                u.name.toLowerCase().includes(searchLower) ||
                u.email.toLowerCase().includes(searchLower)
            );
        }

        // Remove passwords
        users = users.map(({ password, ...user }) => user);

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedUsers = users.slice(startIndex, endIndex);

        res.json({
            users: paginatedUsers,
            total: users.length,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(users.length / limit)
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/users', authenticateToken, async (req, res) => {
    try {
        const { name, email, password, role, tenantId } = req.body;

        // Validation
        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'Name, email, password, and role are required' });
        }

        // Check permissions
        if (req.user.role !== 'system-admin' && req.user.role !== 'operations-admin' && req.user.role !== 'tenant-admin') {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        // Check if user already exists
        const users = await readDatabase(USERS_DB);
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }

        // Create new user
        const newUser = {
            id: uuidv4(),
            name,
            email,
            password: bcrypt.hashSync(password, 10),
            role,
            tenantId: tenantId || (req.user.role === 'tenant-admin' ? req.user.tenantId : null),
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        users.push(newUser);
        await writeDatabase(USERS_DB, users);

        const { password: _, ...userWithoutPassword } = newUser;

        await logAction('create', 'user', newUser.id, req.user.id, { email, role });

        res.status(201).json({
            message: 'User created successfully',
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role, tenantId, active } = req.body;

        const users = await readDatabase(USERS_DB);
        const userIndex = users.findIndex(u => u.id === id);

        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[userIndex];

        // Check permissions
        if (req.user.role !== 'system-admin' && req.user.role !== 'operations-admin') {
            if (req.user.role === 'tenant-admin' && user.tenantId !== req.user.tenantId) {
                return res.status(403).json({ error: 'Cannot modify users from other tenants' });
            }
        }

        // Update user
        const updatedUser = {
            ...user,
            name: name || user.name,
            email: email || user.email,
            role: role || user.role,
            tenantId: tenantId !== undefined ? tenantId : user.tenantId,
            active: active !== undefined ? active : user.active,
            updatedAt: new Date().toISOString()
        };

        // Hash new password if provided
        if (req.body.password) {
            updatedUser.password = bcrypt.hashSync(req.body.password, 10);
        }

        users[userIndex] = updatedUser;
        await writeDatabase(USERS_DB, users);

        const { password: _, ...userWithoutPassword } = updatedUser;

        await logAction('update', 'user', id, req.user.id, { changes: req.body });

        res.json({
            message: 'User updated successfully',
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (id === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        const users = await readDatabase(USERS_DB);
        const userIndex = users.findIndex(u => u.id === id);

        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[userIndex];

        // Check permissions
        if (req.user.role !== 'system-admin' && req.user.role !== 'operations-admin') {
            if (req.user.role === 'tenant-admin' && user.tenantId !== req.user.tenantId) {
                return res.status(403).json({ error: 'Cannot delete users from other tenants' });
            }
        }

        users.splice(userIndex, 1);
        await writeDatabase(USERS_DB, users);

        await logAction('delete', 'user', id, req.user.id, { email: user.email });

        res.json({
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Generic data endpoints for other entities
app.get('/api/data/:entity', authenticateToken, async (req, res) => {
    try {
        const { entity } = req.params;
        const validEntities = ['courses', 'enrollments', 'notifications', 'attendance', 'grades', 'assignments', 'submissions', 'communications', 'financial', 'reports', 'institutions', 'users', 'admissions', 'certificates', 'transcripts', 'settings', 'medical', 'disciplinary', 'hostel_rooms', 'hostel_allocations', 'hostel_residents'];
        
        if (!validEntities.includes(entity)) {
            return res.status(400).json({ error: 'Invalid entity' });
        }

        const dbPath = path.join(DB_PATH, `${entity}.json`);
        const data = await readDatabase(dbPath);

        // Apply tenant filtering for non-admin users
        let filteredData = data;
        if (req.user.role !== 'system-admin' && req.user.role !== 'operations-admin') {
            filteredData = data.filter(item => !item.tenantId || item.tenantId === req.user.tenantId);
        }

        res.json(filteredData);
    } catch (error) {
        console.error('Get data error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/data/:entity', authenticateToken, async (req, res) => {
    try {
        const { entity } = req.params;
        const validEntities = ['courses', 'enrollments', 'notifications', 'attendance', 'grades', 'assignments', 'submissions', 'communications', 'financial', 'reports', 'institutions', 'users', 'admissions', 'certificates', 'transcripts', 'settings', 'medical', 'disciplinary', 'hostel_rooms', 'hostel_allocations', 'hostel_residents'];
        
        if (!validEntities.includes(entity)) {
            return res.status(400).json({ error: 'Invalid entity' });
        }

        const dbPath = path.join(DB_PATH, `${entity}.json`);
        const data = await readDatabase(dbPath);

        const newItem = {
            id: uuidv4(),
            ...req.body,
            tenantId: req.user.tenantId || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        data.push(newItem);
        await writeDatabase(dbPath, data);

        await logAction('create', entity, newItem.id, req.user.id);

        // Broadcast real-time update to all connected clients
        broadcastUpdate(req.app, entity, 'create', newItem);

        res.status(201).json({
            message: `${entity} created successfully`,
            data: newItem
        });
    } catch (error) {
        console.error('Create data error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Unified Student Data endpoint for cross-module synchronization
app.post('/api/unified-students', authenticateToken, async (req, res) => {
    try {
        const studentData = req.body;
        
        // Validate required fields
        if (!studentData.name || !studentData.email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }
        
        // Check if student already exists
        const existingUsers = await readDatabase(USERS_DB);
        const existingStudent = existingUsers.find(user => 
            user.email === studentData.email && (user.role === 'student' || user.role === 'applicant')
        );
        
        let newStudent;
        if (existingStudent) {
            // Update existing student
            const updatedStudent = {
                ...existingStudent,
                ...studentData,
                updatedAt: new Date().toISOString(),
                moduleAccess: {
                    ...existingStudent.moduleAccess,
                    [studentData.sourceModule || 'unknown']: true
                }
            };
            
            const index = existingUsers.findIndex(user => user.id === existingStudent.id);
            existingUsers[index] = updatedStudent;
            await writeDatabase(USERS_DB, existingUsers);
            
            // Broadcast update
            broadcastUpdate(req.app, 'users', 'update', updatedStudent);
            
            newStudent = updatedStudent;
        } else {
            // Create new student
            newStudent = {
                id: uuidv4(),
                name: studentData.name,
                email: studentData.email,
                role: 'student',
                status: studentData.status || 'active',
                tenantId: req.user.tenantId || null,
                institutionId: req.user.institutionId || null,
                institutionName: req.user.institutionName || null,
                moduleAccess: {
                    hr: studentData.sourceModule === 'hr',
                    accountant: studentData.sourceModule === 'accountant',
                    registry: studentData.sourceModule === 'registry',
                    hostel: studentData.sourceModule === 'hostel',
                    admin: studentData.sourceModule === 'admin'
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                ...studentData
            };
            
            existingUsers.push(newStudent);
            await writeDatabase(USERS_DB, existingUsers);
            
            // Broadcast creation
            broadcastUpdate(req.app, 'users', 'create', newStudent);
        }
        
        // Create financial record if needed
        if (studentData.sourceModule !== 'accountant') {
            const financialData = await readDatabase(FINANCIAL_DB);
            const existingFinancial = financialData.find(f => f.studentId === newStudent.id);
            
            if (!existingFinancial) {
                const newFinancialRecord = {
                    id: uuidv4(),
                    studentId: newStudent.id,
                    studentName: newStudent.name,
                    balance: 0,
                    totalFees: 0,
                    paidFees: 0,
                    status: 'pending',
                    feeHistory: [],
                    tenantId: req.user.tenantId || null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                financialData.push(newFinancialRecord);
                await writeDatabase(FINANCIAL_DB, financialData);
                
                // Broadcast financial record creation
                broadcastUpdate(req.app, 'financial', 'create', newFinancialRecord);
            }
        }
        
        // Log action
        await logAction('create', 'student', newStudent.id, req.user.id);
        
        res.status(201).json({
            message: 'Student data saved successfully across all modules',
            data: newStudent
        });
        
    } catch (error) {
        console.error('Unified student data error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Comprehensive Academic Data endpoints
app.post('/api/academic/grades', authenticateToken, async (req, res) => {
    try {
        const gradeData = req.body;
        const newGrade = {
            id: uuidv4(),
            ...gradeData,
            tenantId: req.user.tenantId || null,
            createdAt: new Date().toISOString()
        };

        const grades = await readDatabase(path.join(DB_PATH, 'grades.json'));
        grades.push(newGrade);
        await writeDatabase(path.join(DB_PATH, 'grades.json'), grades);

        broadcastUpdate(req.app, 'grades', 'create', newGrade);
        await logAction('create', 'grade', newGrade.id, req.user.id);

        res.status(201).json({
            message: 'Grade added successfully',
            data: newGrade
        });
    } catch (error) {
        console.error('Add grade error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/academic/attendance', authenticateToken, async (req, res) => {
    try {
        const attendanceData = req.body;
        const newAttendance = {
            id: uuidv4(),
            ...attendanceData,
            tenantId: req.user.tenantId || null,
            createdAt: new Date().toISOString()
        };

        const attendance = await readDatabase(path.join(DB_PATH, 'attendance.json'));
        attendance.push(newAttendance);
        await writeDatabase(path.join(DB_PATH, 'attendance.json'), attendance);

        broadcastUpdate(req.app, 'attendance', 'create', newAttendance);
        await logAction('create', 'attendance', newAttendance.id, req.user.id);

        res.status(201).json({
            message: 'Attendance recorded successfully',
            data: newAttendance
        });
    } catch (error) {
        console.error('Add attendance error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/academic/assignments', authenticateToken, async (req, res) => {
    try {
        const assignmentData = req.body;
        const newAssignment = {
            id: uuidv4(),
            ...assignmentData,
            tenantId: req.user.tenantId || null,
            createdAt: new Date().toISOString()
        };

        const assignments = await readDatabase(path.join(DB_PATH, 'assignments.json'));
        assignments.push(newAssignment);
        await writeDatabase(path.join(DB_PATH, 'assignments.json'), assignments);

        broadcastUpdate(req.app, 'assignments', 'create', newAssignment);
        await logAction('create', 'assignment', newAssignment.id, req.user.id);

        res.status(201).json({
            message: 'Assignment created successfully',
            data: newAssignment
        });
    } catch (error) {
        console.error('Add assignment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Enhanced Financial endpoints
app.post('/api/financial/fee-structures', authenticateToken, async (req, res) => {
    try {
        const feeData = req.body;
        const newFeeStructure = {
            id: uuidv4(),
            ...feeData,
            tenantId: req.user.tenantId || null,
            isActive: true,
            createdAt: new Date().toISOString()
        };

        const financial = await readDatabase(path.join(DB_PATH, 'financial.json'));
        financial.push(newFeeStructure);
        await writeDatabase(path.join(DB_PATH, 'financial.json'), financial);

        broadcastUpdate(req.app, 'financial', 'create', newFeeStructure);
        await logAction('create', 'fee_structure', newFeeStructure.id, req.user.id);

        res.status(201).json({
            message: 'Fee structure created successfully',
            data: newFeeStructure
        });
    } catch (error) {
        console.error('Add fee structure error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/financial/payments', authenticateToken, async (req, res) => {
    try {
        const paymentData = req.body;
        const newPayment = {
            id: uuidv4(),
            ...paymentData,
            tenantId: req.user.tenantId || null,
            createdAt: new Date().toISOString()
        };

        // Update student financial record
        const financial = await readDatabase(path.join(DB_PATH, 'financial.json'));
        const studentRecord = financial.find(f => f.studentId === paymentData.studentId);
        
        if (studentRecord) {
            studentRecord.paidFees = (studentRecord.paidFees || 0) + paymentData.amount;
            studentRecord.balance = (studentRecord.totalFees || 0) - studentRecord.paidFees;
            studentRecord.status = studentRecord.balance <= 0 ? 'paid' : 'partial';
            studentRecord.lastPayment = paymentData.date;
            studentRecord.feeHistory = studentRecord.feeHistory || [];
            studentRecord.feeHistory.push(newPayment);
            
            await writeDatabase(path.join(DB_PATH, 'financial.json'), financial);
            broadcastUpdate(req.app, 'financial', 'update', studentRecord);
        }

        await logAction('create', 'payment', newPayment.id, req.user.id);

        res.status(201).json({
            message: 'Payment processed successfully',
            data: newPayment
        });
    } catch (error) {
        console.error('Process payment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Communication endpoints
app.post('/api/communications/messages', authenticateToken, async (req, res) => {
    try {
        const messageData = req.body;
        const newMessage = {
            id: uuidv4(),
            ...messageData,
            tenantId: req.user.tenantId || null,
            read: false,
            createdAt: new Date().toISOString()
        };

        const communications = await readDatabase(path.join(DB_PATH, 'communications.json'));
        communications.push(newMessage);
        await writeDatabase(path.join(DB_PATH, 'communications.json'), communications);

        broadcastUpdate(req.app, 'communications', 'create', newMessage);
        await logAction('create', 'message', newMessage.id, req.user.id);

        res.status(201).json({
            message: 'Message sent successfully',
            data: newMessage
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/communications/notifications', authenticateToken, async (req, res) => {
    try {
        const notificationData = req.body;
        const newNotification = {
            id: uuidv4(),
            ...notificationData,
            tenantId: req.user.tenantId || null,
            read: false,
            createdAt: new Date().toISOString()
        };

        const communications = await readDatabase(path.join(DB_PATH, 'communications.json'));
        communications.push(newNotification);
        await writeDatabase(path.join(DB_PATH, 'communications.json'), communications);

        broadcastUpdate(req.app, 'communications', 'create', newNotification);
        await logAction('create', 'notification', newNotification.id, req.user.id);

        res.status(201).json({
            message: 'Notification created successfully',
            data: newNotification
        });
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Medical records endpoints
app.post('/api/medical/records', authenticateToken, async (req, res) => {
    try {
        const recordData = req.body;
        const newRecord = {
            id: uuidv4(),
            ...recordData,
            tenantId: req.user.tenantId || null,
            createdAt: new Date().toISOString()
        };

        const medical = await readDatabase(path.join(DB_PATH, 'medical.json'));
        medical.push(newRecord);
        await writeDatabase(path.join(DB_PATH, 'medical.json'), medical);

        broadcastUpdate(req.app, 'medical', 'create', newRecord);
        await logAction('create', 'medical_record', newRecord.id, req.user.id);

        res.status(201).json({
            message: 'Medical record added successfully',
            data: newRecord
        });
    } catch (error) {
        console.error('Add medical record error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Disciplinary endpoints
app.post('/api/disciplinary/incidents', authenticateToken, async (req, res) => {
    try {
        const incidentData = req.body;
        const newIncident = {
            id: uuidv4(),
            ...incidentData,
            tenantId: req.user.tenantId || null,
            status: 'open',
            createdAt: new Date().toISOString()
        };

        const disciplinary = await readDatabase(path.join(DB_PATH, 'disciplinary.json'));
        disciplinary.push(newIncident);
        await writeDatabase(path.join(DB_PATH, 'disciplinary.json'), disciplinary);

        broadcastUpdate(req.app, 'disciplinary', 'create', newIncident);
        await logAction('create', 'disciplinary_incident', newIncident.id, req.user.id);

        res.status(201).json({
            message: 'Disciplinary incident recorded successfully',
            data: newIncident
        });
    } catch (error) {
        console.error('Add disciplinary incident error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Enhanced Hostel endpoints
app.post('/api/hostel/allocations', authenticateToken, async (req, res) => {
    try {
        const allocationData = req.body;
        const newAllocation = {
            id: uuidv4(),
            ...allocationData,
            tenantId: req.user.tenantId || null,
            status: 'active',
            createdAt: new Date().toISOString()
        };

        const allocations = await readDatabase(path.join(DB_PATH, 'hostel_allocations.json'));
        allocations.push(newAllocation);
        await writeDatabase(path.join(DB_PATH, 'hostel_allocations.json'), allocations);

        // Update room status
        const rooms = await readDatabase(path.join(DB_PATH, 'hostel_rooms.json'));
        const room = rooms.find(r => r.id === allocationData.roomId);
        if (room) {
            room.occupied = (room.occupied || 0) + 1;
            room.status = room.occupied >= room.capacity ? 'full' : 'occupied';
            await writeDatabase(path.join(DB_PATH, 'hostel_rooms.json'), rooms);
            broadcastUpdate(req.app, 'hostel_rooms', 'update', room);
        }

        broadcastUpdate(req.app, 'hostel_allocations', 'create', newAllocation);
        await logAction('create', 'hostel_allocation', newAllocation.id, req.user.id);

        res.status(201).json({
            message: 'Room allocated successfully',
            data: newAllocation
        });
    } catch (error) {
        console.error('Allocate room error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Real-time updates endpoint using Server-Sent Events
app.get('/api/realtime', authenticateToken, (req, res) => {
    // Set headers for SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection message
    res.write('data: {"type": "connected", "message": "Real-time connection established"}\n\n');

    // Store the connection for broadcasting updates
    const clientId = Date.now() + '_' + Math.random();
    const connections = req.app.get('sseConnections') || new Map();
    connections.set(clientId, res);
    req.app.set('sseConnections', connections);

    console.log(`SSE client connected: ${clientId}`);

    // Handle client disconnect
    req.on('close', () => {
        connections.delete(clientId);
        console.log(`SSE client disconnected: ${clientId}`);
    });

    // Send periodic heartbeat
    const heartbeat = setInterval(() => {
        if (connections.has(clientId)) {
            res.write('data: {"type": "heartbeat"}\n\n');
        } else {
            clearInterval(heartbeat);
        }
    }, 30000);
});

// Helper function to broadcast updates to all connected clients
function broadcastUpdate(app, entity, action, data) {
    const connections = app.get('sseConnections') || new Map();
    const message = {
        type: 'data_update',
        entity,
        action,
        payload: data,
        timestamp: new Date().toISOString()
    };

    connections.forEach((res, clientId) => {
        try {
            res.write(`data: ${JSON.stringify(message)}\n\n`);
        } catch (error) {
            console.error(`Error sending to client ${clientId}:`, error);
            connections.delete(clientId);
        }
    });
}

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Start server
async function startServer() {
    await initializeDatabase();
    
    app.listen(PORT, () => {
        console.log(`🚀 Shikola Pro Server running on port ${PORT}`);
        console.log(`📊 Database: ${DB_PATH}`);
        console.log(`🌐 Frontend: http://localhost:${PORT}`);
        console.log(`🔐 API: http://localhost:${PORT}/api`);
        console.log('\n👤 Default Login Credentials:');
        console.log('System Admin: admin@shikola.com / admin123');
        console.log('Operations Admin: ops@shikola.com / ops123');
        console.log('Tenant Admin: tenant@shikola.com / tenant123');
        console.log('Staff: john@shikola.com / staff123');
        console.log('Student: jane@shikola.com / student123');
        console.log('Parent: bob@shikola.com / parent123');
    });
}

startServer().catch(console.error);
