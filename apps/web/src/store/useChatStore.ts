import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './useAuthStore';
import { soundManager } from '@/lib/sound';

export interface Message {
  _id: string;
  tempId?: string;
  conversationId: string;
  sender: { _id: string; name: string };
  content: string;
  messageType: 'text' | 'image' | 'voice' | 'file' | 'audio';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  createdAt: string;
}

export interface Conversation {
  _id: string;
  participants: { _id: string; name: string }[];
  conversationType: 'direct' | 'group' | 'gig' | 'event';
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: Record<string, number>;
}

interface ChatState {
  socket: Socket | null;
  conversations: Conversation[];
  messages: Message[];
  activeConversation: string | null;
  loadingMessages: boolean;
  onlineUsers: Set<string>;
  typingUsers: Record<string, boolean>; // conversationId -> boolean
  soundEnabled: boolean;
  
  // Actions
  connectSocket: (token: string) => void;
  disconnectSocket: () => void;
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversation: (id: string | null) => void;
  setLoadingMessages: (loading: boolean) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  sendMessage: (conversationId: string, content: string) => void;
  resendMessage: (tempId: string) => void;
  markAsRead: (conversationId: string) => void;
  toggleSound: () => boolean;
}

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  conversations: [],
  messages: [],
  activeConversation: null,
  loadingMessages: false,
  onlineUsers: new Set(),
  typingUsers: {},
  soundEnabled: soundManager.isEnabled(),

  connectSocket: (token: string) => {
    if (get().socket) return; // already connected

    const defaultUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000` : '';
    const socketUrl = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : defaultUrl;
    const socket = io(socketUrl, {
      auth: { token },
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Connected to chat server');
    });

    socket.on('receive_message', (message: Message & { tempId?: string }) => {
      const state = get();
      const currentUserId = useAuthStore.getState().user?._id;
      const isMe = currentUserId && (message.sender?._id === currentUserId || (message as any).sender === currentUserId);

      // Play chime if message came from another user
      if (!isMe) {
        soundManager.playNotificationSound();
      }

      if (isMe) {
        // Reconcile optimistic message for sender
        set((state) => {
          const index = state.messages.findIndex(
            (m) =>
              (message.tempId && (m._id === message.tempId || m.tempId === message.tempId)) ||
              m._id === message._id
          );

          if (index !== -1) {
            const updated = [...state.messages];
            updated[index] = { ...message, status: 'sent' };
            return { messages: updated };
          } else if (state.activeConversation === message.conversationId) {
            return { messages: [...state.messages, { ...message, status: 'sent' }] };
          }
          return {};
        });
      } else {
        // Message from the other person
        if (state.activeConversation === message.conversationId) {
          set((state) => {
            // Avoid duplicate
            if (state.messages.some((m) => m._id === message._id)) return {};
            return { messages: [...state.messages, message] };
          });
          // Immediately mark as read since user is actively viewing this conversation
          state.markAsRead(message.conversationId);
        } else {
          // User is elsewhere or in another conversation: update unread counter
          if (currentUserId) {
            set((state) => ({
              conversations: state.conversations.map((c) => {
                if (c._id === message.conversationId) {
                  const currentUnread = (c.unreadCount && c.unreadCount[currentUserId]) || 0;
                  return {
                    ...c,
                    unreadCount: {
                      ...(c.unreadCount || {}),
                      [currentUserId]: currentUnread + 1,
                    },
                  };
                }
                return c;
              }),
            }));
          }
        }
      }

      // Update conversation last message & timestamp, move conversation to top
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c._id === message.conversationId
            ? { ...c, lastMessage: message.content, lastMessageAt: message.createdAt }
            : c
        ).sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()),
      }));
    });

    socket.on('message_error', ({ tempId }: { error: string; tempId?: string }) => {
      if (tempId) {
        set((state) => ({
          messages: state.messages.map((m) =>
            m._id === tempId || m.tempId === tempId ? { ...m, status: 'error' } : m
          ),
        }));
      }
    });

    socket.on('user_online', (userId: string) => {
      set((state) => {
        const newSet = new Set(state.onlineUsers);
        newSet.add(userId);
        return { onlineUsers: newSet };
      });
    });

    socket.on('user_offline', (userId: string) => {
      set((state) => {
        const newSet = new Set(state.onlineUsers);
        newSet.delete(userId);
        return { onlineUsers: newSet };
      });
    });

    socket.on('display_typing', ({ conversationId, isTyping }: { conversationId: string; isTyping: boolean }) => {
      set((state) => ({
        typingUsers: { ...state.typingUsers, [conversationId]: isTyping },
      }));
    });

    socket.on('messages_read', ({ conversationId }: { conversationId: string }) => {
      // If we're looking at this conversation, update message statuses to read
      if (get().activeConversation === conversationId) {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.status !== 'read' ? { ...m, status: 'read' } : m
          ),
        }));
      }
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, onlineUsers: new Set(), typingUsers: {} });
    }
  },

  setConversations: (conversations) => set({ conversations }),
  
  setActiveConversation: (id) => {
    const { socket, activeConversation } = get();
    if (activeConversation === id) return;
    
    // Leave previous room
    if (activeConversation && socket) {
      socket.emit('leave_conversation', activeConversation);
    }
    
    // Join new room
    if (id && socket) {
      socket.emit('join_conversation', id);
    }

    set({ 
      activeConversation: id, 
      messages: [], 
      loadingMessages: id !== null 
    });
  },
  
  setLoadingMessages: (loading) => set({ loadingMessages: loading }),

  setMessages: (messages) => set({ 
    messages: [...messages].reverse(), 
    loadingMessages: false 
  }),
  
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  
  sendMessage: (conversationId: string, content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const currentUser = useAuthStore.getState().user;
    const currentUserId = currentUser?._id || '';
    const currentUserName = currentUser?.name || 'Me';
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const nowIso = new Date().toISOString();

    const optimisticMessage: Message = {
      _id: tempId,
      tempId,
      conversationId,
      sender: { _id: currentUserId, name: currentUserName },
      content: trimmed,
      messageType: 'text',
      status: 'sending',
      createdAt: nowIso,
    };

    // 1. Immediately append to chat UI for zero-latency feel
    set((state) => ({
      messages: [...state.messages, optimisticMessage],
      conversations: state.conversations.map((c) =>
        c._id === conversationId
          ? { ...c, lastMessage: trimmed, lastMessageAt: nowIso }
          : c
      ).sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()),
    }));

    // 2. Play tactile sent sound
    soundManager.playSentSound();

    // 3. Emit via socket
    const socket = get().socket;
    if (socket && socket.connected) {
      socket.emit('send_message', { conversationId, content: trimmed, tempId });
    } else {
      setTimeout(() => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m._id === tempId ? { ...m, status: 'error' } : m
          ),
        }));
      }, 1000);
    }
  },

  resendMessage: (tempId: string) => {
    const state = get();
    const msg = state.messages.find((m) => m._id === tempId || m.tempId === tempId);
    if (!msg) return;

    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === tempId || m.tempId === tempId ? { ...m, status: 'sending' } : m
      ),
    }));

    const socket = state.socket;
    if (socket && socket.connected) {
      socket.emit('send_message', {
        conversationId: msg.conversationId,
        content: msg.content,
        tempId: msg.tempId || msg._id,
      });
    }
  },

  markAsRead: (conversationId: string) => {
    const socket = get().socket;
    if (socket && socket.connected) {
      socket.emit('mark_read', { conversationId });
    }
  },

  toggleSound: () => {
    const nextState = soundManager.toggle();
    set({ soundEnabled: nextState });
    return nextState;
  },
}));
