# 🃏 Planning Poker

A real-time collaborative Planning Poker application built with React, Node.js, TypeScript, and Socket.IO. This application enables teams to conduct agile estimation sessions with real-time user interaction and seamless WebSocket communication.

## 🚀 Features

### ✨ Real-time Collaboration
- **Live User Management**: See who's online in real-time
- **Instant Updates**: Real-time user join/leave notifications
- **Activity Feed**: Live activity stream showing all session events
- **Name Changes**: Update your display name on the fly

### 🎯 User Experience
- **Clean Interface**: Modern, responsive design with intuitive navigation
- **Connection Status**: Visual indicators for WebSocket connectivity
- **User Count**: Real-time participant counter
- **Mobile Friendly**: Responsive design for all screen sizes

### 🏗️ Technical Excellence
- **TypeScript**: Full type safety across frontend and backend
- **Component Architecture**: Modular, reusable React components
- **WebSocket Communication**: Real-time bidirectional communication
- **Docker Ready**: Complete containerization with Docker Compose

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Socket.IO Client** for real-time communication
- **Custom Hooks** for state management
- **CSS Grid/Flexbox** for responsive layouts
- **Create React App** for development tooling

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Socket.IO** for WebSocket communication
- **MongoDB** for data persistence
- **Swagger/OpenAPI** for API documentation
- **Docker** for containerization

### Infrastructure
- **Docker Compose** for multi-service orchestration
- **Redis** for session management
- **MongoDB 7** for database
- **Nginx-ready** architecture

## 📁 Project Structure

```
planning-poker/
├── 📁 api/                          # Backend API
│   ├── 📁 src/
│   │   ├── 📄 app.ts                # Main application entry
│   │   ├── 📁 application/
│   │   │   ├── 📁 controllers/      # Route controllers
│   │   │   ├── 📁 routes/           # API routes
│   │   │   └── 📁 services/         # Business logic
│   │   │       └── UserService.ts   # Real-time user management
│   │   ├── 📁 domain/               # Domain entities
│   │   │   ├── 📁 entities/         # Business entities
│   │   │   └── 📁 repositories/     # Data access interfaces
│   │   └── 📁 infrastructure/       # Infrastructure layer
│   │       └── 📁 database/
│   │           └── MongoConnection.ts # Database connection
│   ├── 📄 package.json
│   ├── 📄 tsconfig.json
│   └── 📄 entrypoint.sh
├── 📁 frontend/                     # React frontend
│   ├── 📁 src/
│   │   ├── 📄 App.tsx               # Main app component
│   │   ├── 📁 components/           # Reusable UI components
│   │   │   ├── 📄 Header.tsx        # App header with status
│   │   │   ├── 📄 JoinForm.tsx      # User join form
│   │   │   ├── 📄 UserInfo.tsx      # Current user info
│   │   │   ├── 📄 UsersList.tsx     # Connected users list
│   │   │   ├── 📄 ActivityFeed.tsx  # Real-time activity feed
│   │   │   └── 📄 SessionContainer.tsx # Session layout
│   │   └── 📁 modules/
│   │       └── 📁 shared/
│   │           └── 📁 hooks/
│   │               ├── 📄 useSocket.ts # WebSocket management
│   │               └── 📄 useApi.ts    # API state management
│   ├── 📄 package.json
│   └── 📄 tsconfig.json
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
   - **Frontend**: http://localhost:3000
   - **API**: http://localhost:3001
   - **API Documentation**: http://localhost:3001/api-docs
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

### Starting a Session
1. Open the application in your browser
2. Enter your name in the join form
3. Click "Join Session" when connected
4. Invite others to join using the same URL

### Real-time Features
- **See Live Users**: View all connected participants in real-time
- **Activity Feed**: Monitor join/leave events and name changes
- **Change Name**: Update your display name during the session
- **Connection Status**: Monitor your WebSocket connection status

## 🏗️ Architecture

### Real-time Communication Flow
```
Frontend (React) ←→ Socket.IO ←→ Backend (Node.js) ←→ MongoDB
                                      ↓
                                  UserService
                                      ↓
                              Real-time User Management
```

### Component Architecture
- **Modular Design**: Each UI component has a single responsibility
- **TypeScript Interfaces**: Full type safety across all components
- **Custom Hooks**: Encapsulated state management logic
- **Event-Driven**: WebSocket event handling with proper error management

### Backend Architecture
- **Layered Architecture**: Clear separation of concerns
- **Domain-Driven Design**: Business logic separated from infrastructure
- **Service Layer**: Encapsulated business operations
- **Repository Pattern**: Data access abstraction

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

## 🚀 Future Enhancements

This foundation is ready for Planning Poker features:

### Planned Features
- **🃏 Card Selection**: Fibonacci sequence voting cards
- **📊 Voting Results**: Real-time vote aggregation and reveal
- **⏱️ Timer**: Session timing and round management
- **📈 Statistics**: Historical voting data and analytics
- **👥 Room Management**: Multiple concurrent sessions
- **🎯 Story Points**: Integration with issue tracking systems

### Technical Roadmap
- **Authentication**: User accounts and session persistence  
- **Room System**: Multiple isolated gaming sessions
- **Vote Management**: Secure voting logic and result calculation
- **Mobile App**: React Native companion application
- **Analytics**: Detailed session reporting and insights

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
- `user-join`: Join session with username
- `update-name`: Change display name
- `get-users`: Request current user list

#### Server → Client
- `welcome`: Successful join confirmation
- `users-updated`: Updated user list broadcast
- `user-joined`: New user joined notification
- `user-left`: User disconnected notification
- `user-name-changed`: Name change notification
- `error`: Error messages

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Antonio Ramos** - Planning Poker with TypeScript, React, and Socket.IO

---

🎯 **Ready for Planning Poker!** This foundation provides robust real-time user management, perfect for building collaborative estimation tools.