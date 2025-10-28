import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface ConnectedUser {
  id: string;
  name: string;
  socketId: string;
  connectedAt: Date;
}

export interface SocketEvents {
  welcome: (data: { user: ConnectedUser; message: string }) => void;
  'users-updated': (data: { users: ConnectedUser[]; totalUsers: number }) => void;
  'user-joined': (data: { user: ConnectedUser; message: string }) => void;
  'user-left': (data: { user: ConnectedUser; message: string }) => void;
  'user-name-changed': (data: { oldName: string; newName: string; message: string }) => void;
  'name-updated': (data: { user: ConnectedUser; message: string }) => void;
  error: (data: { message: string }) => void;
}

export interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  users: ConnectedUser[];
  totalUsers: number;
  currentUser: ConnectedUser | null;
  joinWithName: (name: string, isSpectator?: boolean) => void;
  updateName: (newName: string) => void;
  messages: Array<{ id: string; message: string; timestamp: Date; type: 'info' | 'error' | 'success' }>;
}

// For WebSocket connections, we need to use the correct URL based on environment
const SERVER_URL = process.env.REACT_APP_SERVER_URL || 
  `${window.location.protocol}//${window.location.hostname}:3001`;

export const useSocket = (sessionId?: string): UseSocketReturn => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<ConnectedUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentUser, setCurrentUser] = useState<ConnectedUser | null>(null);
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
    console.log('Connecting to server at:', SERVER_URL);
    socketRef.current = io(SERVER_URL);

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

    socket.on('name-updated', (data) => {
      setCurrentUser(data.user);
      addMessage(data.message, 'success');
    });

    socket.on('error', (data) => {
      addMessage(data.message, 'error');
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

  const joinWithName = useCallback((name: string, isSpectator: boolean = false) => {
    console.log('Attempting to join with name:', name.trim());
    console.log('Socket connected:', !!socketRef.current?.connected);
    if (socketRef.current && name.trim() && sessionId) {
      const joinData = {
        userName: name.trim(),
        sessionId: sessionId,
        isSpectator: isSpectator
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