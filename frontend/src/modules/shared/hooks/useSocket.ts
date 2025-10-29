import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

import { UserRole } from '../../../types/User';

export interface ConnectedUser {
  id: string;
  name: string;
  socketId: string;
  connectedAt: Date;
  role?: UserRole;
  isSpectator?: boolean;
}

export interface SocketEvents {
  welcome: (data: { user: ConnectedUser; message: string }) => void;
  'users-updated': (data: { users: ConnectedUser[]; totalUsers: number }) => void;
  'user-joined': (data: { user: ConnectedUser; message: string }) => void;
  'user-left': (data: { user: ConnectedUser; message: string }) => void;
  'user-name-changed': (data: { oldName: string; newName: string; message: string }) => void;
  'user-name-updated': (data: { users: ConnectedUser[]; updatedUser: { userId: string; userName: string } }) => void;
  'role-changed': (data: { users: ConnectedUser[]; changedUser: { userId: string; newRole: UserRole } }) => void;
  error: (data: { message: string }) => void;
}

export interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  users: ConnectedUser[];
  totalUsers: number;
  currentUser: ConnectedUser | null;
  joinWithName: (name: string, role?: UserRole) => void;
  updateName: (newName: string) => void;
  messages: Array<{ id: string; message: string; timestamp: Date; type: 'info' | 'error' | 'success' }>;
}

// For WebSocket connections, we need to use the correct URL based on environment
// This automatically uses the same host as the browser but with port 3001
const getServerUrl = () => {
  if (process.env.REACT_APP_SERVER_URL) {
    return process.env.REACT_APP_SERVER_URL;
  }
  
  // Use the same protocol and hostname as the current page, but port 3001
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:3001`;
};

const SERVER_URL = getServerUrl();

export const useSocket = (sessionId?: string): UseSocketReturn => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<ConnectedUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentUser, setCurrentUser] = useState<ConnectedUser | null>(null);

  // Debug: Log when currentUser changes
  useEffect(() => {
    console.log('🔄 Current user updated:', currentUser);
  }, [currentUser]);
  const [messages, setMessages] = useState<Array<{ id: string; message: string; timestamp: Date; type: 'info' | 'error' | 'success' }>>([]);

  const addMessage = useCallback((message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const newMessage = {
      id: Date.now().toString(),
      message,
      timestamp: new Date(),
      type
    };
    setMessages(prev => [...prev.slice(-9), newMessage]); // Keep last 10 messages
  }, []);

  useEffect(() => {
    // Create socket connection
    console.log('🔌 Attempting to connect to Socket.IO server...');
    console.log('📍 SERVER_URL:', SERVER_URL);
    console.log('🌐 window.location:', window.location.href);
    console.log('🔧 Environment:', process.env.NODE_ENV);
    
    socketRef.current = io(SERVER_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully');
      setIsConnected(true);
      addMessage('Connected to server', 'success');
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setIsConnected(false);
      setCurrentUser(null);
      addMessage('Disconnected from server', 'error');
    });

    socket.on('connect_error', (error) => {
      console.error('🔴 WebSocket connection error:', error);
      addMessage('Failed to connect to server', 'error');
    });

    // User event handlers
    socket.on('welcome', (data) => {
      console.log('🎉 Welcome event received:', data.user);
      setCurrentUser(data.user);
      addMessage(data.message, 'success');
    });

    socket.on('users-updated', (data) => {
      setUsers(data.users);
      setTotalUsers(data.totalUsers);
    });

    socket.on('user-joined', (data) => {
      addMessage(data.message, 'info');
    });

    socket.on('user-left', (data) => {
      addMessage(data.message, 'info');
    });

    socket.on('user-name-changed', (data) => {
      addMessage(data.message, 'info');
    });

    socket.on('user-name-updated', (data) => {
      // Update all users list
      setUsers(data.users);
      
      // Update current user if it's the one that changed
      setCurrentUser(prev => {
        if (prev && data.updatedUser && prev.id === data.updatedUser.userId) {
          return { ...prev, name: data.updatedUser.userName };
        }
        return prev;
      });
    });

    socket.on('error', (data) => {
      addMessage(data.message, 'error');
    });

    socket.on('role-changed', (data) => {
      console.log('Role changed in useSocket:', data);
      
      // Update the users list
      setUsers(data.users);
      
      // Update current user's role if it was changed
      setCurrentUser(prevUser => {
        if (prevUser && data.changedUser && prevUser.id === data.changedUser.userId) {
          return {
            ...prevUser,
            role: data.changedUser.newRole,
            isSpectator: data.changedUser.newRole === UserRole.VIEWER
          };
        }
        return prevUser;
      });
      
      addMessage(`User role changed to ${data.changedUser.newRole}`, 'info');
    });

    // Request current users when connected (only if sessionId is provided)
    socket.on('connect', () => {
      if (sessionId) {
        socket.emit('get-users', sessionId);
      }
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [addMessage, sessionId]);

  const joinWithName = useCallback((name: string, role: UserRole = UserRole.PLAYER) => {
    console.log('Attempting to join with name:', name.trim(), 'role:', role);
    console.log('Socket connected:', !!socketRef.current?.connected);
    if (socketRef.current && name.trim() && sessionId) {
      const joinData = {
        userName: name.trim(),
        sessionId: sessionId,
        role: role
      };
      socketRef.current.emit('user-join', joinData);
      console.log('Emitted user-join event with session:', joinData);
    } else {
      console.log('Cannot join - socket not connected, name empty, or no sessionId');
    }
  }, [sessionId]);

  const updateName = useCallback((newName: string) => {
    if (socketRef.current && newName.trim()) {
      socketRef.current.emit('update-name', newName.trim());
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    users,
    totalUsers,
    currentUser,
    joinWithName,
    updateName,
    messages
  };
};