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
- Vite for build tooling.
- TailwindCSS for styling
- React Router for navigation
- Context API for state management

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM with SQLite
- JWT authentication
- Nodemailer for email notifications

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


## License

This project is private and proprietary.

## Support

For support, email milanjohnso09@gmail.com

---

**TRUST POS v2.4.0** - Business Intelligence Platform
