# Hospital Management System (HMS)

## Overview

This is a comprehensive Hospital Management System built as a full-stack web application for managing hospital operations including patient records, laboratory tests, pharmacy prescriptions, and discharge summaries. The system provides role-based access for doctors and staff members, with features for enhanced patient registration, multi-step lab test workflow, prescription creation, and PDF report generation.

## Recent Changes (Latest)

**Centralized Patient Registration System (August 2025)**
- Added new "Patient Registration" module as the first card on dashboard with green theme
- Created comprehensive patient registration form with unique ID generation for cross-module access
- Implemented smart auto-fill functionality (salutation auto-suggests gender)
- Added complete patient profile fields: salutation, name, age/units, gender, contact, email, address, blood group, emergency contacts, referring doctor
- Integrated existing patient search functionality with real-time filtering by name, ID, or phone
- Established single patient profile system that works across all hospital modules (lab tests, surgical case sheets, pharmacy, consultations)
- Enhanced form validation and professional UI design with proper spacing and responsive layout

**Professional Surgical Case Sheet System (August 2025)**
- Implemented complete surgical case sheet functionality with professional NAKSHATRA HOSPITAL format
- Added unique case sheet numbering system (SCS + patient ID + counter format like SCS1234-01)
- Created comprehensive PDF generation with dotted line formatting matching hospital templates
- Fixed form validation and server-side database integration with proper error handling
- Implemented patient dropdown with real database data and auto-fill functionality
- Added professional 2-column layout for investigations and examinations sections
- Successfully integrated PDFKit for enhanced PDF formatting with hospital branding
- System now fully functional: form submission → database storage → immediate PDF download

**Enhanced Lab Testing Workflow (August 2025)**
- Redesigned lab testing into a comprehensive 4-step process: Patient Registration → Test Selection → Results Entry → Report Generation
- Enhanced patient registration form with professional fields: salutation, age units, blood group, emergency contacts, email, address, and referring doctor information
- Added smart auto-fill functionality (salutation automatically suggests gender)
- Implemented comprehensive form validation with phone number (10-digit) and email format validation
- Created professional progress indicators and step-by-step navigation
- Fixed authentication issues with JWT token handling in API requests

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