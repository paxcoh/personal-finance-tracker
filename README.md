# 💰 FinanceFlow - Personal Finance Tracker

A beautiful, full-featured personal finance management application with multi-user support, admin panel, and advanced analytics.

![FinanceFlow Dashboard](xxxxxxxxxx)

## ✨ Features

### 👤 User Features
- **Secure Authentication** - Login/Signup with bcrypt password hashing
- **Transaction Management** - Add, edit, delete income and expenses
- **Personal Analytics** - Interactive charts and insights
- **Currency Support** - Multi-currency with custom currency option
- **Dark/Light Theme** - System-wide theme toggle
- **Profile Management** - Update name, email, avatar
- **Password Change** - Secure password updates
- **Data Export** - Export transactions to CSV

### 👑 Admin Features
- **User Management** - Create, view, and delete users
- **Role Management** - Assign admin or user roles
- **System Analytics** - Platform-wide financial insights
- **Password Management** - Super Admin can change user passwords
- **Audit Logs** - Track user activities

### 🛡️ Super Admin Features
- **Complete System Overview** - Global financial analytics
- **User Password View** - Securely view user passwords (with verification)
- **User Activity Monitoring** - Track registrations and transactions
- **Platform Statistics** - Total users, transactions, income, expenses

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [SQLite](https://www.sqlite.org/) (built-in, no installation needed)

### Installation

1. **Clone the repository**

git clone https://github.com/paxcoh/personal-finance-tracker.git
cd personal-finance-tracker


**Access the application

Open your browser: http://localhost:3000
Default Super Admin: admin@flow.com / admin123



**📁 Project Structure
text
personal-finance-tracker/
├── server.js                 # Main application server
├── package.json             # Dependencies and scripts
├── .env                     # Environment variables
├── .gitignore              # Git ignore file
├── database.db             # SQLite database (auto-created)
└── public/                 # Static files
    ├── index.html          # User dashboard
    ├── login.html          # Authentication page
    ├── admin.html          # Admin panel
    ├── analytics.html      # Personal analytics
    ├── settings.html       # User settings
    ├── super-analytics.html # System analytics (Super Admin)
    ├── app.js              # Dashboard logic
    ├── admin.js            # Admin panel logic
    ├── auth.js             # Authentication logic
    ├── analytics.js        # Personal analytics logic
    ├── settings.js         # Settings logic
    └── super-analytics.js  # System analytics logic


**🎯 User Roles

Role	Capabilities
User	Manage transactions, personal analytics, profile settings
Admin	User management, platform overview, system analytics
Super Admin	All admin features + password viewing, full system control

**🔐 Default Accounts
Role	Email	Password
Super Admin	admin@flow.com	admin123
⚠️ Important: Change the default password after first login!

**🛠️ Technology Stack
Backend
Node.js - JavaScript runtime

Express.js - Web framework

SQLite - Lightweight database

bcryptjs - Password hashing

express-session - Session management

Frontend
HTML5 / CSS3 - Structure and styling

Tailwind CSS - Utility-first CSS framework

JavaScript (Vanilla) - Client-side logic

Chart.js - Interactive charts

Lucide Icons - Beautiful icon set

**📊 Database Schema
sql
users:
  - id (INTEGER PRIMARY KEY)
  - name (TEXT)
  - email (TEXT UNIQUE)
  - password (TEXT)
  - role (TEXT) ['user', 'admin']
  - avatar (TEXT)
  - currency (TEXT)
  - currency_symbol (TEXT)
  - theme (TEXT)
  - language (TEXT)
  - notifications (INTEGER)
  - budget_limit (REAL)
  - is_super_admin (INTEGER)
  - created_at (DATETIME)
  - updated_at (DATETIME)

transactions:
  - id (INTEGER PRIMARY KEY)
  - user_id (INTEGER)
  - type (TEXT) ['income', 'expense']
  - category (TEXT)
  - amount (REAL)
  - date (TEXT)
  - description (TEXT)
  - is_recurring (INTEGER)
  - recurring_frequency (TEXT)
  - created_at (DATETIME)

categories:
  - id (INTEGER PRIMARY KEY)
  - user_id (INTEGER)
  - name (TEXT)
  - type (TEXT) ['income', 'expense']
  - color (TEXT)
  - icon (TEXT)
  - is_default (INTEGER)

budgets:
  - id (INTEGER PRIMARY KEY)
  - user_id (INTEGER)
  - category (TEXT)
  - amount (REAL)
  - month (INTEGER)
  - year (INTEGER)

savings_goals:
  - id (INTEGER PRIMARY KEY)
  - user_id (INTEGER)
  - name (TEXT)
  - target_amount (REAL)
  - current_amount (REAL)
  - deadline (DATE)
  - status (TEXT)

audit_logs:
  - id (INTEGER PRIMARY KEY)
  - user_id (INTEGER)
  - action (TEXT)
  - details (TEXT)
  - ip_address (TEXT)
  - timestamp (DATETIME)
🔧 Configuration
Environment Variables (.env)
env
# Server Configuration
PORT=3000
NODE_ENV=development

# Session Secret (optional - defaults to built-in)
SESSION_SECRET=your-super-secret-key

# Encryption Key (optional - for advanced features)
ENCRYPTION_KEY=your-32-character-key
🤝 Contributing
Fork the repository

Create your feature branch (git checkout -b feature/AmazingFeature)

Commit your changes (git commit -m 'Add some AmazingFeature')

Push to the branch (git push origin feature/AmazingFeature)

Open a Pull Request

📝 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments
Tailwind CSS for the beautiful styling

Chart.js for interactive charts

Lucide Icons for the icon set

📧 Contact
paxcoh - Email:24pasco@gmail.com

Project Link: https://github.com/paxcoh/personal-finance-tracker

⭐ Show your support
Give a ⭐️ if this project helped you!


