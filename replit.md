# Hospital Management System (HMS)

## Overview

This is a comprehensive Hospital Management System built as a full-stack web application for managing hospital operations including patient records, laboratory tests, pharmacy prescriptions, and discharge summaries. The system provides role-based access for doctors and staff members, with features for patient registration, test management, prescription creation, and PDF report generation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built with **React** and **TypeScript**, utilizing a component-based architecture with modern UI patterns:

- **UI Framework**: Radix UI components with shadcn/ui styling system for consistent, accessible components
- **Styling**: Tailwind CSS with custom CSS variables for theming and responsive design
- **State Management**: React Context for authentication state, TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **PDF Generation**: jsPDF for client-side PDF report generation

The frontend follows a modular structure with separate pages for login, dashboard, lab management, pharmacy, and discharge summaries. Protected routes ensure proper authentication before accessing sensitive areas.

### Backend Architecture
The server-side is built with **Node.js** and **Express**, providing RESTful APIs with JWT-based authentication:

- **Framework**: Express.js with TypeScript for type safety
- **Authentication**: JWT tokens with bcrypt for password hashing
- **API Design**: RESTful endpoints organized by feature modules (patients, lab tests, prescriptions, discharge summaries)
- **Middleware**: Request logging, error handling, and authentication middleware
- **Development**: Vite integration for hot reloading in development mode

The backend implements a storage abstraction layer to separate business logic from data persistence concerns.

### Data Storage
The application uses **PostgreSQL** as the primary database with **Drizzle ORM** for type-safe database operations:

- **Database**: PostgreSQL hosted on Neon for scalable cloud database
- **ORM**: Drizzle ORM with schema-first approach for type safety
- **Migration**: Drizzle Kit for database schema migrations
- **Connection**: Connection pooling for optimal performance

The database schema includes tables for users, patients, lab tests, prescriptions, and discharge summaries with proper foreign key relationships and constraints.

### Authentication & Authorization
Role-based authentication system supporting two user roles:

- **JWT Implementation**: Secure token-based authentication with configurable expiration
- **Password Security**: bcrypt hashing with salt for secure password storage
- **Role Management**: Doctor and Staff roles with appropriate access controls
- **Session Management**: Client-side token storage with automatic token verification

### External Dependencies

- **Database**: Neon PostgreSQL for cloud-hosted database storage
- **UI Components**: Radix UI primitives for accessible component foundation
- **Styling**: Tailwind CSS for utility-first styling approach
- **Icons**: Lucide React for consistent iconography
- **PDF Generation**: jsPDF for client-side report generation
- **Date Handling**: date-fns for date manipulation and formatting
- **Form Validation**: Zod for runtime type checking and validation
- **HTTP Client**: Fetch API with TanStack Query for server state management
- **Development Tools**: Vite for fast development builds and HMR
- **TypeScript**: Full type safety across frontend, backend, and shared schemas

The system is designed for deployment on Replit with development-specific tooling including cartographer for dependency visualization and runtime error overlays.