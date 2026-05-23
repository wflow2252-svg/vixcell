# Vixcell Dashboard - Full Stack Project Management System

A comprehensive dashboard for managing client projects and tasks, built with React, Tailwind CSS, Node.js, Express, and SQLite.

## Features

- **Project Management**: Create, read, update, and delete projects
- **Task Management**: Create, read, update, and delete tasks associated with projects
- **Dashboard View**: Visual overview with statistics and charts
- **Glassmorphism UI**: Modern, professional interface with blur effects
- **Responsive Design**: Works on desktop and mobile devices
- **Data Visualization**: Charts showing project and task status distribution
- **Filtering and Pagination**: Efficiently handle large datasets

## Tech Stack

### Frontend
- React 18
- Tailwind CSS 3
- Vite (build tool)
- Recharts (data visualization)
- React Router (navigation)
- Axios (HTTP client)

### Backend
- Node.js
- Express.js
- Sequelize (ORM)
- SQLite (database)
- CORS middleware
- Dotenv (environment variables)

## Project Structure

```
vixcell/
├── backend/                  # Backend server
│   ├── src/
│   │   ├── config/           # Database configuration
│   │   ├── controllers/      # Request handlers
│   │   ├── models/           # Database models
│   │   ├── routes/           # API endpoints
│   │   ├── migrations/       # Database schema migrations
│   │   ├── seeders/          # Sample data
│   │   └── server.js         # Entry point
│   ├── package.json          # Backend dependencies
│   └── .env                  # Environment variables
│
├── frontend/                 # Frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── utils/            # Utility functions (API calls)
│   │   ├── App.jsx           # Main app component
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Global styles
│   ├── index.html            # HTML template
│   ├── package.json          # Frontend dependencies
│   ├── tailwind.config.js    # Tailwind configuration
│   └── vite.config.js        # Vite configuration
│
└── README.md                 # This file
```

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Git

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend root:
   ```env
   PORT=5000
   NODE_ENV=development
   ```

4. Run database migrations:
   ```bash
   npx sequelize-cli db:migrate
   ```

5. Seed the database with sample data:
   ```bash
   npx sequelize-cli db:seed:all
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. The frontend will be available at `http://localhost:5173`

### Production Build

To build the frontend for production:
```bash
# In frontend directory
npm run build
```

The built files will be in the `dist` directory and can be served by any static file server.

## API Endpoints

### Projects
- `GET /api/projects` - Get all projects (with filtering and pagination)
- `GET /api/projects/:id` - Get a single project
- `POST /api/projects` - Create a new project
- `PUT /api/projects/:id` - Update a project
- `DELETE /api/projects/:id` - Delete a project
- `GET /api/projects/stats` - Get project statistics

### Tasks
- `GET /api/tasks` - Get all tasks (with filtering and pagination)
- `GET /api/tasks/:id` - Get a single task
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task
- `GET /api/tasks/stats` - Get task statistics

## Features in Detail

### Dashboard
- Overview cards showing key metrics (total projects, active projects, completed projects, average budget)
- Pie chart showing project status distribution
- Bar chart showing task status distribution
- Recent activities table

### Projects Page
- List view with filtering by status and client name
- Pagination for large datasets
- Create/edit project form with validation
- Delete project functionality
- Link to view project details

### Project Detail Page
- Project information display
- Edit project form
- List of tasks associated with the project
- Navigation to view all tasks for the project

### Tasks Page
- List view with filtering by status, priority, and project
- Pagination for large datasets
- Create/edit task form with validation
- Delete task functionality
- Link to view task details

## Customization

### Changing Theme
Modify the Tailwind configuration in `frontend/tailwind.config.js` to change colors, spacing, or other design tokens.

### Adding New Features
1. Backend:
   - Add new model in `src/models/`
   - Create controller in `src/controllers/`
   - Add routes in `src/routes/`
   - Update `src/server.js` to include new routes

2. Frontend:
   - Add new component in `src/components/`
   - Add new page in `src/pages/`
   - Add API utility functions in `src/utils/api.js`
   - Add routes in `src/App.jsx`

## Database Schema

### Projects Table
- `id` (Integer, Primary Key)
- `name` (String, Required)
- `clientName` (String, Required)
- `status` (Enum: active, on hold, completed, cancelled)
- `startDate` (Date, Required)
- `endDate` (Date, Nullable)
- `budget` (Decimal, Nullable)
- `description` (Text, Nullable)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

### Tasks Table
- `id` (Integer, Primary Key)
- `title` (String, Required)
- `description` (Text, Nullable)
- `status` (Enum: todo, in progress, review, done)
- `priority` (Enum: low, medium, high)
- `dueDate` (Date, Nullable)
- `projectId` (Integer, Foreign Key to Projects)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

## Security Considerations

- CORS is enabled to allow frontend-backend communication
- Input validation should be added for production use
- Authentication and authorization should be implemented for multi-user scenarios
- Environment variables should be used for sensitive configuration
- Regular database backups are recommended

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure SQLite is properly installed
   - Check file permissions for the database file
   - Verify the database path in `src/config/database.js`

2. **API Connection Issues**
   - Verify the backend is running on `http://localhost:5000`
   - Check CORS configuration in `src/server.js`
   - Ensure frontend API base URL is correct in `src/utils/api.js`

3. **Build Errors**
   - Delete `node_modules` and `package-lock.json`/`yarn.lock` then reinstall
   - Ensure you're using compatible versions of Node.js and dependencies

## License

MIT License - Feel free to use this project for personal or commercial purposes.

## Support

For issues and feature requests, please use the GitHub issue tracker.