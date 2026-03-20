# Shikola Pro - Setup Instructions

## Quick Start Guide

This guide will help you set up Shikola Pro with persistent data storage and user management capabilities.

### Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)
- Modern web browser

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Application**
   ```bash
   npm start
   ```

3. **Access the Application**
   - Open your browser and go to: `http://localhost:3000`
   - The server will start automatically and create the database files

### Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| System Admin | admin@shikola.com | admin123 |
| Operations Admin | ops@shikola.com | ops123 |
| Tenant Admin | tenant@shikola.com | tenant123 |
| Staff | john@shikola.com | staff123 |
| Student | jane@shikola.com | student123 |
| Parent | bob@shikola.com | parent123 |

### Features Implemented

#### ✅ Backend Server
- **Express.js server** with REST API
- **JSON file-based database** for demo purposes
- **JWT authentication** with secure password hashing
- **Role-based access control** (RBAC)
- **Data validation** and error handling
- **Audit logging** for all actions

#### ✅ User Management (Tenant Admin)
- **Create, Read, Update, Delete** users
- **Search and filter** users by name, email, role, status
- **Pagination** for large user lists
- **Role assignment** (Staff, Student, Parent)
- **User activation/deactivation**
- **Real-time updates** with modern UI

#### ✅ Frontend Integration
- **API client** with authentication
- **Fallback to localStorage** if server is unavailable
- **Real-time notifications** system
- **Responsive design** for all devices
- **Toast notifications** for user feedback

#### ✅ Data Persistence
- **Server-side storage** in JSON files
- **Automatic database initialization**
- **Cross-session data retention**
- **Backup and recovery ready**

### Project Structure

```
Shikola Pro v1.0/
├── server.js                 # Main backend server
├── package.json              # Dependencies and scripts
├── .env                     # Environment variables
├── database/                # JSON database files (auto-created)
│   ├── users.json
│   ├── courses.json
│   ├── enrollments.json
│   └── ... (other data files)
├── frontend/                # Frontend application
│   ├── src/pages/tenant-admin/users.html  # User management page
│   └── shared-assets/js/    # Updated JavaScript files
└── README-SETUP.md         # This file
```

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

#### User Management
- `GET /api/users` - List users (with pagination, filtering)
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

#### Data Management
- `GET /api/data/:entity` - Get data (courses, enrollments, etc.)
- `POST /api/data/:entity` - Create data
- `PUT /api/data/:entity/:id` - Update data
- `DELETE /api/data/:entity/:id` - Delete data

### Development Mode

For development with auto-restart:
```bash
npm run dev
```

### Environment Configuration

The `.env` file contains important configuration:
- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - Secret for JWT tokens
- `NODE_ENV` - Environment mode

### Security Features

- **Password hashing** with bcrypt
- **JWT token authentication**
- **Role-based permissions**
- **Input validation** and sanitization
- **Rate limiting** for API endpoints
- **CORS protection**
- **Helmet.js** security headers

### Data Management

The application uses JSON files for data storage:
- All data is stored in the `database/` directory
- Files are automatically created on first run
- Data persists between server restarts
- Easy to backup and migrate

### Troubleshooting

#### Port Already in Use
If port 3000 is busy, change it in `.env`:
```
PORT=3001
```

#### Database Issues
Delete the `database/` folder and restart the server to reinitialize.

#### Permission Issues
Make sure Node.js has write permissions in the project directory.

### Next Steps

1. **Explore the User Management** - Login as Tenant Admin and manage users
2. **Test All Features** - Try creating, editing, and deleting users
3. **Check Data Persistence** - Restart server and verify data remains
4. **Review API Documentation** - Test endpoints directly
5. **Prepare for Demo** - Create sample data for presentation

### Production Deployment

For production deployment:
1. Change `JWT_SECRET` in `.env`
2. Set `NODE_ENV=production`
3. Use a proper database (PostgreSQL, MySQL)
4. Set up HTTPS
5. Configure reverse proxy (nginx/Apache)

### Support

For issues and questions:
- Check the console for error messages
- Verify all dependencies are installed
- Ensure Node.js version is 14+
- Check file permissions

---

**🎉 Your Shikola Pro application is now ready with full data persistence and user management!**
