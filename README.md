# 🃏 Planning Poker

A complete real-time collaborative Planning Poker application built with React, Node.js, TypeScript, Socket.IO, and MongoDB. This production-ready application enables agile teams to conduct efficient estimation sessions with comprehensive features for session management, voting, and real-time collaboration.

## ✨ Recent Feature Additions

### 📊 Advanced Analytics & Session Closure
- **Session Closure System**: Complete session lockdown with one-click closure by admin
- **Participation Summary**: Comprehensive report showing all participants, their voting averages, and reaction statistics
- **User Voting Averages**: Automatic calculation of each participant's average vote across all stories (numeric votes only)
- **Reaction Analytics**: Track and display emoji reactions per user with detailed counts and breakdowns

### 🏷️ Story Tagging & Organization
- **Multi-tag Support**: Add multiple tags to each user story for better categorization
- **Tag Management**: Easy-to-use tag input system with visual badges
- **Reference System**: Tags help POs and developers identify story context quickly
- **Visual Indicators**: Color-coded tag badges for quick story identification

### ⭐ Automatic Story Point Estimation
- **Real-time Averaging**: Automatic calculation of average votes when revealed
- **Inline Display**: Estimated points shown directly next to story titles
- **Smart Calculation**: Excludes non-numeric votes (?, ☕) from averages
- **Persistent Storage**: Story estimates saved and displayed across sessions

### 🌓 Dark Mode Support
- **Theme Toggle**: Easy-to-access dark mode switch in the application header
- **Persistent Preference**: Theme choice saved in localStorage across sessions
- **CSS Variables**: Smooth theme transitions with optimized color schemes
- **Comprehensive Coverage**: All components and UI elements support both themes

## 🚀 Features

### 🎯 Complete Planning Poker Experience
- **🃏 Fibonacci Voting**: Standard planning poker cards (0, 1, 2, 3, 5, 8, 13, 21, ?, ∞, ☕)
- **📊 Real-time Voting**: Live vote submission and status tracking
- **🔍 Vote Revelation**: Admin-controlled vote reveal with comprehensive metrics
- **📈 Voting Analytics**: Total votes, averages, and detailed distribution
- **⭐ Story Point Estimation**: Automatic average calculation displayed next to story titles
- **🔄 Re-estimation**: Reset voting for new rounds
- **👥 Role-based Access**: Admin, Player, and Viewer roles

### 🎮 Session Management
- **📝 Story Management**: Create, edit, and manage user stories
- **🏷️ Story Tagging System**: Multi-tag support for categorizing user stories (PO and Dev references)
- **⚡ Live Sessions**: Real-time session updates and synchronization  
- **👑 Admin Controls**: Session administration with role management
- **🔒 Session Closure**: Complete session lockdown with participation summary
- **📊 Participation Summary**: Detailed report showing all participants, their reactions, and voting averages
- **🎭 Role Assignment**: Dynamic role changes during sessions
- **🎊 Interactive Elements**: Emoji reactions with falling animations and statistics

### 🌙 User Experience Enhancements
- **🌓 Dark Mode**: Toggle between light and dark themes with localStorage persistence
- **🔄 Real-time Synchronization**: Live updates across all participants
- **📱 Responsive Design**: Mobile-first design with elegant UI
- **🎨 Modern Interface**: Clean, professional design with smooth animations
- **🔐 Konami Code**: Hidden admin override for orphaned sessions
- **👥 Role-based UI**: Different interfaces for Admins, Players, and Viewers
- **📊 Voting Status Indicators**: Visual feedback for voting progress

### 📊 Advanced Analytics & Reporting
- **📈 User Voting Averages**: Automatic calculation of each participant's average vote across all stories
- **🎉 Reaction Statistics**: Track and display emoji reactions per user with counts
- **📋 Comprehensive Summary**: When session closes, displays:
  - All participants who joined the session
  - Total reactions sent by each user
  - Average voting score per participant (numeric votes only)
  - Visual breakdown of reaction types per user

### 🏗️ Technical Excellence
- **TypeScript**: Full type safety across frontend and backend
- **MongoDB Integration**: Persistent data storage with Repository pattern
- **WebSocket Communication**: Real-time bidirectional communication
- **Docker Production Ready**: Complete containerization with multi-service orchestration
- **Repository Pattern**: Clean architecture with In-Memory and MongoDB implementations

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Socket.IO Client** for real-time communication
- **Custom Hooks** for state management
- **CSS Grid/Flexbox** for responsive layouts
- **Create React App** for development tooling

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety and robust development
- **Socket.IO** for real-time WebSocket communication
- **MongoDB 7** with indexes for production-grade persistence
- **Repository Factory Pattern** with environment-based selection
- **Swagger/OpenAPI** for comprehensive API documentation
- **Docker** for containerization and deployment

### Infrastructure
- **Docker Compose** for multi-service orchestration
- **Redis** for session and cache management  
- **MongoDB 7** with optimized collections and indexes
- **Production Architecture** ready for scaling
- **Health Checks** and monitoring endpoints

## 📁 Project Structure

```
planning-poker/
├── 📁 api/                          # Backend API
│   ├── 📁 src/
│   │   ├── 📄 app.ts                # Main application with WebSocket handlers
│   │   ├── 📁 application/
│   │   │   ├── 📁 controllers/      # REST API controllers
│   │   │   │   ├── SessionController.ts    # Session management
│   │   │   │   ├── UserStoryController.ts  # Story operations
│   │   │   │   └── VoteController.ts       # Voting logic
│   │   │   ├── 📁 routes/           # API route definitions
│   │   │   └── 📁 services/         # Business logic services
│   │   │       ├── UserService.ts   # Real-time user management
│   │   │       ├── SessionService.ts # Session orchestration
│   │   │       ├── UserStoryService.ts # Story management
│   │   │       └── VoteService.ts    # Voting business logic
│   │   ├── 📁 domain/               # Domain layer
│   │   │   ├── 📁 entities/         # Business entities
│   │   │   │   ├── User.ts          # User domain model
│   │   │   │   ├── Session.ts       # Session domain model
│   │   │   │   ├── UserStory.ts     # Story domain model
│   │   │   │   └── Vote.ts          # Vote domain model
│   │   │   └── 📁 repositories/     # Repository interfaces
│   │   └── 📁 infrastructure/       # Infrastructure layer
│   │       ├── 📁 database/
│   │       │   └── MongoConnection.ts # MongoDB connection
│   │       └── � repositories/     # Repository implementations
│   │           ├── InMemoryRepositories.ts  # In-memory implementations
│   │           ├── MongoRepositories.ts     # MongoDB implementations
│   │           └── RepositoryFactory.ts     # Factory pattern
├── 📁 frontend/                     # React frontend
│   ├── 📁 src/
│   │   ├── 📄 App.tsx               # Main application
│   │   ├── 📁 components/           # UI components
│   │   │   ├── 📄 CreateSession.tsx # Session creation form
│   │   │   ├── 📄 SessionView.tsx   # Main session interface
│   │   │   ├── 📄 UsersList.tsx     # Role-based user management
│   │   │   └── 📄 Header.tsx        # Application header
│   │   ├── 📁 modules/shared/
│   │   │   ├── � components/       # Shared components
│   │   │   │   ├── UserStoryManager.tsx # Story management
│   │   │   │   └── VotingPanel.tsx      # Voting interface
│   │   │   └── 📁 hooks/            # Custom React hooks
│   │   │       ├── useSocket.ts     # WebSocket management
│   │   │       └── useApi.ts        # API integration
│   │   └── � types/                # TypeScript definitions
├── 📄 docker-compose.yml           # Multi-service orchestration
└── 📄 start.sh                     # Quick start script
```

## 🚦 Quick Start

### Prerequisites
- **Docker** and **Docker Compose**
- **Node.js 22+** (for local development)
- **MongoDB 7+** (if running locally)

### 🐳 Docker Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd planning-poker
   ```

2. **Start all services**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```
   
   Or manually:
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - **Frontend**: http://localhost:3001 (Main application)
   - **API**: http://localhost:3001/api (REST API)
   - **API Documentation**: http://localhost:3001/api-docs (Swagger UI)
   - **Health Check**: http://localhost:3001/health
   - **MongoDB**: localhost:27017
   - **Redis**: localhost:6379

### 💻 Local Development Setup

#### Backend Setup
```bash
cd api
npm install
npm run dev
```

#### Frontend Setup
```bash
cd frontend
npm install
npm start
```

#### Database Setup
Make sure MongoDB is running locally or update the connection settings in `api/.env`

## 🔧 Configuration

### Environment Variables

#### API Configuration (`api/.env`)
```env
# Server Configuration
PORT=3000
SWAGGER_HOST_PORT=3001

# MongoDB Configuration
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DB_NAME=planning-poker
MONGO_USERNAME=root
MONGO_PASSWORD=password

# Environment
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

#### Frontend Configuration (`frontend/.env`)
```env
# API Configuration
REACT_APP_SERVER_URL=http://localhost:3001
REACT_APP_API_BASE_URL=http://localhost:3001

# Environment
NODE_ENV=development
```

## 🎮 Usage

### Creating a Planning Poker Session
1. **Access the application**: Open http://localhost:3001
2. **Create Session**: Click "Create New Session"
3. **Fill Session Details**:
   - Session Name (required)
   - Description (optional)
   - Your Name as creator (required)
4. **Start Session**: You become the Admin automatically

### Joining an Existing Session  
1. **Enter Session ID**: Use the session link or ID
2. **Enter Your Name**: Provide your display name
3. **Join**: You enter as a Player by default
4. **Role Assignment**: Admin can change your role if needed

### Managing User Stories (Admin)
1. **Create Stories**: Add user stories for estimation
2. **Add Tags**: Categorize stories with multiple tags (e.g., "Frontend", "Backend", "API")
3. **Set Current Story**: Select which story to estimate
4. **Start Voting**: Players can now vote on the current story
5. **Reveal Votes**: Show results with automatic average calculation
6. **View Averages**: See estimated points displayed next to story titles
7. **Re-estimate**: Reset votes for another round
8. **Close Session**: Lock session and generate participation summary

### Voting Process (Players)
1. **Select Card**: Choose from Fibonacci sequence (0, 1, 2, 3, 5, 8, 13, 21, ?, ∞, ☕)
2. **Submit Vote**: Your vote is submitted automatically
3. **Wait for Reveal**: Admin controls when to show results
4. **View Results**: See comprehensive voting metrics, distribution, and story average
5. **Send Reactions**: Express feedback with emoji reactions (tracked per user)

### Session Closure & Analytics
1. **Close Session** (Admin only): Locks the session completely
2. **Automatic Calculation**: System calculates each user's voting average
3. **Participation Summary**: Displays comprehensive report with:
   - All participants with their roles
   - Total reactions sent by each user
   - Breakdown of reaction types per user
   - Average voting score per participant (excludes ?, ☕)
4. **Locked State**: No further voting, story changes, or reactions allowed
5. **Real-time Sync**: All participants see the summary simultaneously

### User Interface Customization
- **🌓 Dark Mode Toggle**: Switch themes in header (persists across sessions)
- **🏷️ Story Tags**: Visual badges for story categorization
- **📊 Inline Metrics**: Average points shown directly on story titles
- **🎨 Color-coded Cards**: Different colors for different card values
- **🎭 Role Badges**: Clear visual indication of user roles

### Role-based Features
- **👑 Admin**: 
  - Session management and closure
  - Story creation with tags
  - Vote revelation and re-estimation
  - Role assignment
  - Access to participation analytics
- **🎯 Player**: 
  - Voting on stories
  - Emoji reactions (tracked in statistics)
  - Name changes
  - View voting averages
- **👁️ Viewer**: 
  - Observe session
  - See results and metrics
  - Emoji reactions (tracked in statistics)
  - View participation summary when closed

### Advanced Features
- **🎊 Emoji Reactions System**: Send emojis with falling animations, tracked per user
- **📊 Voting Status**: Real-time indicators showing who has voted
- **� Automatic Averaging**: Story points calculated and displayed automatically
- **🏷️ Tag System**: Multi-tag support for story categorization
- **🌓 Dark Mode**: Persistent theme switching with localStorage
- **�🔄 Live Updates**: All changes synchronized across users via WebSocket
- **🎭 Role Changes**: Dynamic role assignment during sessions
- **🔒 Session Locking**: Complete lockdown with analytics on closure
- **📊 Participation Analytics**: Detailed user statistics and voting averages
- **🔐 Konami Code**: Hidden admin override (↑↓←→↑↓←→)

## 🏗️ Architecture

### Real-time Communication Flow
```
Frontend (React) ←→ Socket.IO ←→ Backend (Node.js) ←→ MongoDB
                                      ↓
                              Service Layer (UserService, SessionService, VoteService)
                                      ↓
                              Repository Layer (MongoDB/InMemory)
                                      ↓
                              Domain Entities (User, Session, UserStory, Vote)
```

### Frontend Architecture
- **Component-Based**: Modular React components with TypeScript
- **Custom Hooks**: Encapsulated state management (useSocket, useApi)
- **Real-time State**: WebSocket integration for live updates
- **Role-based UI**: Conditional rendering based on user roles
- **Responsive Design**: Mobile-first approach with CSS Grid/Flexbox

### Backend Architecture  
- **Clean Architecture**: Domain-driven design with layered approach
- **Repository Pattern**: Abstraction layer for data access
- **Factory Pattern**: Environment-based repository selection
- **Service Layer**: Business logic encapsulation
- **WebSocket Events**: Real-time communication for all features
- **MongoDB Integration**: Production-ready persistence with indexes

### Data Models
```typescript
// Core Domain Entities
User: { id, name, sessionId, role, socketId }
Session: { 
  id, name, description, creatorId, settings,
  isClosed, reactionStats, userAverages 
}
UserStory: { 
  id, title, description, sessionId, 
  tags, estimatedPoints, isRevealed 
}
Vote: { id, userId, userStoryId, points, isRevealed }

// New Analytics Models
ReactionStats: { 
  [userId: string]: { [emoji: string]: number } 
}
UserAverages: { 
  [userId: string]: number  // Average voting score
}
```

## 🧪 Development

### Available Scripts

#### Backend (`api/`)
```bash
npm run dev      # Start development server with hot reload
npm run build    # Build TypeScript to JavaScript
npm start        # Start production server
```

#### Frontend (`frontend/`)
```bash
npm start        # Start development server
npm run build    # Create production build
npm test         # Run test suite
```

### Docker Commands
```bash
docker-compose up -d          # Start all services in background
docker-compose down           # Stop all services
docker-compose logs api       # View API logs
docker-compose logs frontend  # View frontend logs
```

## 🚀 Production Features

This is a **complete, production-ready** Planning Poker application with all core features implemented:

### ✅ Implemented Features
- **🃏 Complete Voting System**: Fibonacci cards with real-time voting
- **📊 Comprehensive Metrics**: Vote totals, averages, and detailed distribution
- **⭐ Automatic Story Averaging**: Real-time calculation and display of story point estimates
- **🏷️ Story Tagging System**: Multi-tag categorization for user stories
- **👥 Role Management**: Admin, Player, Viewer roles with appropriate permissions
- **📝 Story Management**: Full CRUD operations for user stories with tags
- **🔄 Session Control**: Vote revelation, re-estimation, and session management
- **🔒 Session Closure**: Complete lockdown with participation analytics
- **📊 Participation Analytics**: Detailed user statistics, voting averages, and reaction tracking
- **🎉 Reaction System**: Emoji reactions with statistics per user
- **⚡ Real-time Sync**: Live updates across all session participants via WebSocket
- **🌓 Dark Mode**: Persistent theme switching with localStorage
- **🎊 Interactive Elements**: Emoji reactions with visual effects
- **📱 Responsive Design**: Mobile-optimized interface
- **🗃️ Data Persistence**: MongoDB integration with proper indexing
- **🔐 Security**: Role-based access control and validation


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 API Documentation

The API documentation is automatically generated and available at:
- **Local**: http://localhost:3001/api-docs
- **Swagger/OpenAPI**: Full interactive API documentation

### WebSocket Events

#### Client → Server
- `user-join`: Join session with username and role
- `update-name`: Change display name during session
- `request-role-change`: Request role change for user
- `vote-submitted`: Submit vote for current story
- `votes-revealed`: Admin reveals votes for story
- `voting-reset`: Admin resets voting for re-estimation
- `send-reaction`: Send emoji reaction to session

#### Server → Client  
- `welcome`: Successful join with user details
- `users-updated`: Updated user list with roles
- `user-joined`: New user joined notification
- `user-left`: User disconnected notification  
- `user-name-changed`: Name change notification
- `role-changed`: User role change notification
- `vote-submitted`: Vote status update (without revealing vote)
- `votes-revealed`: Votes revealed with metrics and distribution
- `voting-reset`: Voting session reset notification
- `reaction-sent`: Emoji reaction broadcast
- `session-closed`: Session closure notification with analytics trigger
- `error`: Error messages and validation failures

## 📄 License

This project is licensed under the ISC License.

## 🎯 Key Highlights

### 🔒 Session Closure & Analytics
When an admin closes a session, the system:
- ✅ Locks all interactions (voting, reactions, story management)
- ✅ Calculates voting averages for each participant automatically
- ✅ Generates a comprehensive participation summary in real-time
- ✅ Displays reaction statistics per user with emoji breakdown
- ✅ Syncs closure state across all connected clients via WebSocket
- ✅ Preserves all data for historical reference

### 🏷️ Smart Story Management
The tagging system enables:
- ✅ Multiple tags per story for flexible categorization
- ✅ Quick identification of frontend, backend, API, or database stories
- ✅ Better sprint planning with organized backlogs
- ✅ Visual badges for at-a-glance story recognition
- ✅ Persistent tag data across sessions

### ⭐ Intelligent Estimation
Automatic averaging provides:
- ✅ Real-time calculation when votes are revealed
- ✅ Smart filtering (excludes ?, ☕ from numeric calculations)
- ✅ Inline display of estimated points next to story titles
- ✅ Persistent estimation data for future reference
- ✅ Accurate team velocity tracking

### 🎨 Enhanced User Experience
Modern interface features:
- ✅ Dark mode with persistent theme preference
- ✅ Color-coded voting cards for visual distinction
- ✅ Emoji reactions with falling animations
- ✅ Role-based UI with appropriate controls
- ✅ Real-time voting status indicators
- ✅ Mobile-responsive design for all devices

## 👨‍💻 Author

**Antonio Ramos** - Planning Poker with TypeScript, React, and Socket.IO

---

🎯 **Production-Ready Planning Poker!** A complete, feature-rich planning poker application ready for agile teams to conduct efficient estimation sessions with real-time collaboration, comprehensive voting metrics, advanced analytics, and professional-grade architecture.