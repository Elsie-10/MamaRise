# MamaRise Client

> Frontend application for MamaRise - Supporting mothers through postpartum recovery, wellbeing, and return to work.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The development server will start at `http://localhost:5173` by default.

## 📁 Project Structure

```
src/
├── components/          # Reusable components
│   └── PrivateRoute.jsx    # Route protection component
├── context/            # React Context for state management
│   └── AuthContext.jsx     # Authentication context
├── pages/              # Page components
│   ├── Auth/              # Authentication pages
│   │   ├── Signup.jsx
│   │   ├── Login.jsx
│   │   └── Auth.css
│   ├── Dashboard/         # Main dashboard
│   │   ├── Dashboard.jsx
│   │   └── Dashboard.css
│   ├── Planner/           # Return-to-Work Planner
│   │   ├── Planner.jsx
│   │   └── Planner.css
│   ├── Wellbeing/         # Wellbeing Check-In
│   │   ├── Wellbeing.jsx
│   │   └── Wellbeing.css
│   └── Appointments/      # Appointments & Milestones
│       ├── Appointments.jsx
│       └── Appointments.css
├── services/           # API service layer
│   └── api.js             # Axios API client and endpoints
├── App.jsx            # Main app component with routing
├── App.css            # Global styles
├── main.jsx           # React entry point
└── style.css          # Additional global styles
```

## 🔑 Key Features

### 1. Authentication (Signup/Login)
- User registration with email, phone, and baby birth date
- Secure login with JWT tokens
- Auto-logout on 401 errors
- Token persistence in localStorage

### 2. Dashboard
- Welcome greeting with user's baby birth date
- Quick access to all three MVP features
- Recent activity feed
- Upcoming milestones display

### 3. Return-to-Work Planner
Create personalized return-to-work plans with:
- Planned return date
- Work type selection (6 options including gig work, farming, trading)
- Breastfeeding preference
- Childcare arrangement
- Generates weekly preparation checklist

### 4. Wellbeing Check-In
Track daily wellbeing with:
- Mood selector (happy, neutral, sad, anxious with emoji indicators)
- Sleep quality rating
- Stress level slider (1-10)
- Optional notes
- Check-in history display

### 5. Appointments & Milestones
- Display of 4 key postpartum milestones:
  - Six-week postpartum check-up
  - Three-month follow-up
  - Six-month follow-up
  - Family planning appointment
- Schedule and manage appointments
- Appointment status tracking

## 🔌 API Integration

The app connects to the backend API at `http://localhost:5000/api/v1`. 

### Authentication Endpoints
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh token

### Planner Endpoints
- `POST /planner/plans` - Create plan
- `GET /planner/plans/{id}` - Get plan details
- `PUT /planner/plans/{id}` - Update plan
- `GET /planner/plans/{id}/checklist` - Get checklist
- `PUT /planner/plans/{id}/checklist` - Update checklist

### Wellbeing Endpoints
- `POST /wellbeing/check-ins` - Create check-in
- `GET /wellbeing/check-ins` - Get all check-ins
- `GET /wellbeing/check-ins/{id}` - Get check-in details

### Appointments Endpoints
- `POST /appointments` - Create appointment
- `GET /appointments` - Get all appointments
- `GET /appointments/{id}` - Get appointment details
- `PUT /appointments/{id}` - Update appointment
- `GET /appointments/milestones` - Get milestones

### Dashboard Endpoints
- `GET /dashboard` - Get dashboard data
- `GET /dashboard/profile` - Get user profile
- `PUT /dashboard/profile` - Update user profile

## 🎨 Styling

The app uses a modern design system with:
- **Color Scheme**: Purple gradient (#667eea to #764ba2)
- **Responsive**: Mobile-first design with breakpoints at 768px
- **Animations**: Smooth transitions and hover effects
- **Accessibility**: Proper contrast and focus states

### Global CSS Variables
```css
--primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
--primary-color: #667eea
--primary-dark: #764ba2
--text-dark: #333
--text-light: #666
--bg-light: #f8f9fa
--error-color: #e74c3c
--success-color: #27ae60
```

## 🔐 Security Features

- JWT token-based authentication
- Automatic token refresh on 401 errors
- Secure token storage in localStorage
- Protected routes via PrivateRoute component
- CSRF protection via Axios defaults

## 📱 Responsive Design

All pages are fully responsive with:
- Mobile-first approach
- Breakpoint at 768px
- Touch-friendly buttons and inputs
- Optimized layouts for all screen sizes

## 🚧 Environment Variables

Create a `.env` file in the client folder:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

Or set the API base URL in `src/services/api.js`:
```javascript
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5000/api/v1'
```

## 🧪 Testing

Testing setup coming soon. Currently using manual testing against the backend API.

## 📦 Dependencies

- **react**: ^18.2.0 - UI library
- **react-dom**: ^18.2.0 - React DOM rendering
- **react-router-dom**: ^6.14.0 - Client-side routing
- **axios**: ^1.4.0 - HTTP client

## 🔧 Development

### Available Scripts

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Code Organization

- **Components**: Reusable UI components in `src/components/`
- **Pages**: Full page components in `src/pages/`
- **Services**: API calls and external services in `src/services/`
- **Context**: Global state management in `src/context/`

## 🚀 Deployment

To deploy to production:

1. Build the app: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Ensure environment variables are set correctly
4. Configure CORS on backend to accept your frontend domain

## 🐛 Debugging

The app uses browser developer tools for debugging:
- Check Network tab for API calls
- Use Console for error messages
- Use React DevTools extension to inspect components
- Check Application tab for localStorage (tokens)

## 📝 Code Style

- ES6+ JavaScript
- Functional React components with hooks
- Consistent CSS naming conventions
- Proper error handling and validation

## 🤝 Contributing

When adding new features:
1. Create feature in separate branch
2. Follow existing code structure
3. Add corresponding CSS file for each component
4. Update this README with new routes/endpoints
5. Test on mobile and desktop views

## 📄 License

Part of the MamaRise project.

## 🆘 Support

For issues or questions:
1. Check existing GitHub issues
2. Review server API documentation
3. Check browser console for error messages
4. Verify backend API is running
