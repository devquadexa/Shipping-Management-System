# Super Shine Cargo Service - Frontend

React-based frontend application for Super Shine Cargo Service management system.

## Features

- Modern React application with React Router
- Role-based authentication (Super Admin, Admin, User)
- Responsive design for mobile and desktop
- API service layer for clean separation of concerns
- Professional blue gradient theme

## Tech Stack

- React 18
- React Router v6
- Axios for API calls
- CSS3 with responsive design

## Project Structure

```
frontend/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── logo.svg          # Super Shine Cargo logo
├── src/
│   ├── api/
│   │   ├── client.js     # Axios instance with interceptors
│   │   └── services/     # API service modules
│   │       ├── authService.js
│   │       ├── customerService.js
│   │       ├── jobService.js
│   │       ├── billingService.js
│   │       └── pettyCashService.js
│   ├── components/       # React components
│   │   ├── Login.js
│   │   ├── Navbar.js
│   │   ├── Dashboard.js
│   │   ├── Customers.js
│   │   ├── Jobs.js
│   │   ├── Billing.js
│   │   ├── PettyCash.js
│   │   └── UserManagement.js
│   ├── context/
│   │   └── AuthContext.js
│   ├── styles/
│   │   ├── Login.css
│   │   └── responsive.css
│   ├── App.js
│   ├── App.css
│   └── index.js
├── .env                  # Environment configuration
├── .env.example
└── package.json
```

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file (or use the existing one):

```env
REACT_APP_API_URL=http://localhost:5000/api
```

For production, update to your actual API URL.

## Development

```bash
npm start
```

Runs on http://localhost:3000

## Build for Production

```bash
npm run build
```

Creates optimized production build in `build/` folder.

## API Services

All API calls are centralized in the `src/api/services/` directory:

- **authService** - Login, user management
- **customerService** - Customer CRUD operations
- **jobService** - Job management and assignment
- **billingService** - Bills and pay items
- **pettyCashService** - Petty cash tracking

## Authentication

The app uses JWT tokens stored in localStorage. The API client automatically:
- Adds auth token to all requests
- Redirects to login on 401 errors
- Handles token refresh

## Responsive Design

The application is fully responsive with breakpoints:
- Mobile: < 480px
- Tablet: 480px - 768px
- Desktop: > 768px

## Default Credentials

- Username: superadmin
- Password: admin123
