# TRUST POS - Point of Sale System

A modern, enterprise-grade Point of Sale system built with React, TypeScript, Node.js, and Prisma.

## Features

- **Sales Management**: Full-featured POS interface with cart management
- **Inventory Management**: Track products, stock levels, and categories
- **Customer Management**: Maintain customer records and transaction history
- **Staff Management**: Role-based access control (Owner, Manager, Cashier)
- **Reports & Analytics**: Real-time dashboard with sales insights
- **Order Processing**: Handle orders, returns, and refunds
- **Attendance Tracking**: Monitor staff check-in/check-out times

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- React Router for navigation
- Context API for state management

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM with SQLite
- JWT authentication
- Nodemailer for email notifications

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/BISHOP122222/Trust.git
   cd Trust
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your actual configuration
   npx prisma generate
   npx prisma migrate dev
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

### Default Login Credentials
After setting up the database, a default admin account will be created:
- Email: `admin@trust.com`
- Password: `admin123`

**⚠️ Important: Change these credentials immediately after first login!**

## Environment Variables

### Backend (.env)
```
PORT=5000
DATABASE_URL="file:./trust.db"
JWT_SECRET="your-secret-key"
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD="your-app-password"
FRONTEND_URL=http://localhost:5173
```

## Project Structure

```
Trust/
├── backend/          # Node.js backend
│   ├── prisma/      # Database schema and migrations
│   ├── src/         # Source code
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── server.ts
│   └── .env.example
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   └── lib/
│   └── vite.config.ts
└── README.md
```

## User Roles

- **Owner**: Full system access including staff management
- **Manager**: Access to inventory, sales, reports, and customers
- **Cashier**: Access to POS and attendance tracking only

## Security

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Environment variables for sensitive data
- CORS protection

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For support, email support@trustpos.com

---

**TRUST POS v2.4.0** - Business Intelligence Platform
