# 🎓 Shikola Pro - Comprehensive University Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-JSON%20Files-green)](https://www.json.org/)

A **comprehensive multi-tenant, multi-branch college/university management system** built with modern web technologies. Shikola Pro provides complete administrative control over academic, financial, and operational aspects of educational institutions.

## 🌟 Key Features

### 🎯 **Core Modules**
- **Admin Portal** - System administration and configuration
- **HR Management** - Staff recruitment, training, and performance
- **Academic Registry** - Student records, certificates, transcripts
- **Financial Management** - Fee structures, payments, budgeting
- **Hostel Management** - Room allocation, resident management

### 🚀 **Advanced Features**
- **✅ Cross-Module Data Sharing** - Real-time data synchronization
- **✅ Comprehensive Student Profiles** - Complete student lifecycle management
- **✅ Multi-Tenant Architecture** - Support for multiple institutions
- **✅ Real-time Notifications** - Live updates across all modules
- **✅ Advanced Search** - Global search across all data categories
- **✅ Role-Based Access Control** - Granular permissions system
- **✅ Audit Trail** - Complete activity logging
- **✅ Responsive Design** - Mobile-friendly interface

## 🏗️ Technical Architecture

### **Frontend Stack**
- **HTML5/CSS3/JavaScript** - Modern web standards
- **Tailwind CSS** - Utility-first CSS framework
- **Alpine.js** - Reactive JavaScript framework
- **Font Awesome** - Icon library

### **Backend Stack**
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **JSON Database** - File-based data storage
- **JWT Authentication** - Secure token-based auth
- **Server-Sent Events** - Real-time updates

### **Data Management**
- **Unified Student Service** - Centralized data management
- **Cross-Module Synchronization** - Real-time data sharing
- **Comprehensive Data Categories**:
  - 📚 Academic (Grades, Attendance, Assignments)
  - 💰 Financial (Fees, Payments, Budgets)
  - 🏠 Hostel (Rooms, Allocations, Residents)
  - 📧 Communications (Messages, Notifications)
  - 🏥 Medical (Records, Emergencies, Insurance)
  - ⚖️ Disciplinary (Incidents, Actions, Warnings)

## 🚀 Quick Start

### **Prerequisites**
- Node.js 16.0 or higher
- npm or yarn package manager

### **Installation**

1. **Clone the repository**
```bash
git clone https://github.com/mmushibi/shikolapro.git
cd shikolapro
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the server**
```bash
node server.js
```

4. **Access the application**
```
🌐 Frontend: http://localhost:3000
🔐 API: http://localhost:3000/api
```

### **Default Login Credentials**

| Role | Email | Password |
|-------|---------|----------|
| System Admin | admin@shikola.com | admin123 |
| Operations Admin | ops@shikola.com | ops123 |
| Tenant Admin | tenant@shikola.com | tenant123 |
| Staff | john@shikola.com | staff123 |
| Student | jane@shikola.com | student123 |
| Parent | bob@shikola.com | parent123 |

## 📊 Module Overview

### **🏛️ Admin Portal**
- System configuration and settings
- User management and permissions
- Institution management
- System monitoring and analytics

### **👥 HR Management**
- Staff recruitment and onboarding
- Employee records and profiles
- Training management
- Performance evaluation
- Leave management

### **📜 Academic Registry**
- Student admission and enrollment
- Course management and scheduling
- Grade and transcript management
- Certificate generation
- Attendance tracking

### **💰 Financial Management**
- Fee structure management
- Payment processing and tracking
- Budget management
- Financial reporting
- Invoice generation

### **🏠 Hostel Management**
- Room allocation and management
- Resident tracking
- Visitor management
- Facility maintenance
- Hostel analytics

## 🔧 Configuration

### **Environment Variables**
```env
PORT=3000
JWT_SECRET=shikola-pro-secret-key-2024
DB_PATH=./database
NODE_ENV=development
```

### **Database Structure**
```
database/
├── users.json              # User accounts and profiles
├── admissions.json         # Student admissions
├── financial.json          # Financial records
├── grades.json            # Academic grades
├── attendance.json        # Attendance records
├── hostel_rooms.json      # Hostel room data
├── communications.json    # Messages and notifications
├── medical.json          # Medical records
├── disciplinary.json     # Disciplinary records
└── [other data files...]
```

## 🧪 Testing

### **Test Pages**
- **Cross-Module Test**: `http://localhost:3000/test-cross-module.html`
- **Comprehensive Data Test**: `http://localhost:3000/test-comprehensive-data.html`

### **Test Coverage**
- ✅ Student data creation and management
- ✅ Cross-module data sharing
- ✅ Real-time synchronization
- ✅ Academic data operations
- ✅ Financial transactions
- ✅ Hostel management
- ✅ Communication systems
- ✅ Medical and disciplinary records

## 🔄 Real-time Features

### **Cross-Module Data Sharing**
- **Live Updates**: Data changes appear instantly across all modules
- **Unified Student Service**: Centralized student data management
- **Event Broadcasting**: Real-time notifications for data changes
- **Cross-tab Synchronization**: Data sync between browser tabs

### **Communication System**
- **Instant Messages**: Real-time messaging between users
- **Notifications**: System-wide announcements and alerts
- **Priority-based**: Different priority levels for messages
- **Read Status**: Track message and notification read status

## 🔐 Security Features

### **Authentication & Authorization**
- **JWT Tokens**: Secure token-based authentication
- **Role-Based Access**: Granular permissions by user role
- **Multi-Tenant**: Institution-based data isolation
- **Session Management**: Secure session handling

### **Data Protection**
- **Input Validation**: Server-side data validation
- **XSS Protection**: Cross-site scripting prevention
- **CSRF Protection**: Cross-site request forgery prevention
- **Rate Limiting**: API request rate limiting

## 📈 Analytics & Reporting

### **System Statistics**
- **Student Metrics**: Enrollment, attendance, performance
- **Financial Analytics**: Revenue, expenses, payment trends
- **Staff Analytics**: HR metrics, training completion
- **Hostel Analytics**: Occupancy rates, facility usage

### **Reporting Features**
- **Academic Reports**: Grade reports, transcripts
- **Financial Reports**: Fee statements, payment history
- **HR Reports**: Employee performance, training reports
- **Custom Reports**: Flexible report generation

## 🌐 API Documentation

### **Authentication**
```javascript
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
```

### **Student Data**
```javascript
GET /api/unified-students
POST /api/unified-students
PUT /api/unified-students/:id
DELETE /api/unified-students/:id
```

### **Academic Data**
```javascript
GET /api/academic/grades
POST /api/academic/grades
GET /api/academic/attendance
POST /api/academic/attendance
```

### **Financial Data**
```javascript
GET /api/financial/fee-structures
POST /api/financial/fee-structures
POST /api/financial/payments
```

## 🤝 Contributing

We welcome contributions to improve Shikola Pro! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### **Development Guidelines**
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Alpine.js** - For reactive UI components
- **Tailwind CSS** - For utility-first styling
- **Express.js** - For the backend framework
- **Font Awesome** - For beautiful icons

## 📞 Support

For support and questions:
- **Email**: support@shikola.com
- **Documentation**: [Wiki](https://github.com/mmushibi/shikolapro/wiki)
- **Issues**: [GitHub Issues](https://github.com/mmushibi/shikolapro/issues)

## 🚀 Roadmap

### **Upcoming Features**
- [ ] Mobile applications (iOS/Android)
- [ ] Advanced analytics dashboard
- [ ] Integration with learning management systems
- [ ] Automated scheduling system
- [ ] AI-powered insights
- [ ] Cloud deployment options

### **Enhancements**
- [ ] Multi-language support
- [ ] Advanced reporting features
- [ ] Integration with payment gateways
- [ ] Email/SMS notifications
- [ ] Data export/import functionality

---

## 🎯 **Project Status: Production Ready**

Shikola Pro is a **comprehensive, production-ready** university management system with advanced features for educational institutions. The system provides complete administrative control with modern web technologies and real-time capabilities.

**Built with ❤️ by Sepio Corp for educational excellence** 🎓
