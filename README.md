# UC Inventory System

This project is a comprehensive web application for managing Unified Communication (UC) devices and their lifecycle management. It includes connectors to popular UC portals, project management, time tracking, and phone number management.

## Overview

The UC Inventory System provides a complete solution for:

1. **Unified Communication Portals Connector**
   - Connects to Teams, Cisco Webex, Polycom, and other UC platforms
   - Automatically syncs devices and their information
   - Performs Lifecycle Management (LCM) for devices

2. **Project Management Portal**
   - Integrates with Jira for project tracking
   - Creates and updates Jira projects based on device needs
   - Manages device assignments and project timelines

3. **ServiceNow Connector**
   - Tracks hours worked by teams
   - Forecasts future team needs
   - Provides capacity planning and resource management

4. **Phone Number Management**
   - Adds and removes phone numbers for teams
   - Manages phone assignments and status
   - Tracks phone number lifecycle

## Architecture

### Backend (Node.js/TypeScript)
- RESTful API for all operations
- Database integration with lowdb
- Authentication and authorization
- Modular services for each integration

### Frontend (React/TypeScript)
- Modern UI with Tailwind CSS
- Component-based architecture
- Real-time data updates
- Responsive design

## Key Features

### Device Management
- Create, read, update, and delete devices
- Device lifecycle tracking
- Team-based device assignment
- Status monitoring and alerts

### Team Management
- Create and manage teams
- Team member management
- Device and phone allocation
- Contact information management

### Phone Number Management
- Bulk import/export of phone numbers
- Assignment management
- Status tracking
- History logging

### Project Management
- Jira integration
- Project lifecycle tracking
- Deadline management
- Resource allocation

### Time Tracking
- Time entry management
- Team capacity planning
- Forecast generation
- Reporting and analytics

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Devices
- `GET /api/devices` - List all devices
- `POST /api/devices` - Create new device
- `GET /api/devices/:id` - Get device by ID
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device

### Teams
- `GET /api/teams` - List all teams
- `POST /api/teams` - Create new team
- `GET /api/teams/:id` - Get team by ID
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

### Phones
- `GET /api/phones` - List all phones
- `POST /api/phones` - Create new phone
- `GET /api/phones/:id` - Get phone by ID
- `PUT /api/phones/:id` - Update phone
- `DELETE /api/phones/:id` - Delete phone

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Time Tracking
- `GET /api/time-entries` - List all time entries
- `POST /api/time-entries` - Create new time entry
- `GET /api/time-entries/user/:userId` - Get time entries by user
- `GET /api/time-entries/date-range` - Get time entries by date range

### Forecasts
- `GET /api/forecasts` - List all forecasts
- `POST /api/forecasts` - Create new forecast
- `GET /api/forecasts/team/:teamId` - Get forecasts by team
- `PUT /api/forecasts/:id` - Update forecast

## Technology Stack

### Backend
- Node.js
- TypeScript
- Express.js
- lowdb (for local database)
- bcryptjs (for password hashing)
- jsonwebtoken (for authentication)

### Frontend
- React
- TypeScript
- Tailwind CSS
- Vite
- Heroicons
- Framer Motion

### Testing
- TypeScript strict mode
- Basic validation
- Test helper utilities

## Installation

### Backend
```bash
cd uc-inventory/backend
npm install
npm run build
npm start
```

### Frontend
```bash
cd uc-inventory/frontend
npm install
npm run dev
```

## Usage

1. Start the backend server
2. Start the frontend application
3. Access the application at `http://localhost:3000`

## Features Demonstration

The application demonstrates the following key features:

1. **Device Inventory**: Manage UC devices from Teams, Webex, Polycom
2. **Team Management**: Organize teams and assign devices
3. **Phone Number Management**: Track and manage phone numbers
4. **Project Management**: Integrate with Jira for project tracking
5. **Time Tracking**: Monitor team hours and forecast needs
6. **Lifecycle Management**: Track device expiry and renewal

## Future Enhancements

- Add support for additional UC platforms
- Implement advanced reporting and analytics
- Add email notifications for device expiry
- Integrate with additional project management tools
- Implement role-based access control
- Add support for multi-tenancy

## License

This project is licensed under the MIT License.
