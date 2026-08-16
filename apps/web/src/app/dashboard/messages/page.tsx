'use client';

import React, { useEffect, useState } from 'react';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';

export default function MessagesPage() {
  const { user, token } = useAuthStore();
  const { 
    connectSocket, 
    disconnectSocket, 
    setConversations, 
    conversations,
    activeConversation,
    setMessages
  } = useChatStore();
  const [loading, setLoading] = useState(true);

  // Initialize socket and fetch conversations
  useEffect(() => {
    if (token && user) {
      connectSocket(token);

      const fetchConversations = async () => {
        try {
          const res = await api.get('/chat/conversations');
          setConversations(res.data);
        } catch (error) {
          console.error('Failed to fetch conversations', error);
        } finally {
          setLoading(false);
        }
      };

      fetchConversations();
    }

    return () => {
      disconnectSocket();
    };
  }, [token, user, connectSocket, disconnectSocket, setConversations]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (activeConversation && token) {
      const fetchMessages = async () => {
        try {
          const res = await api.get(`/chat/conversations/${activeConversation}/messages`);
          setMessages(res.data);
        } catch (error) {
          console.error('Failed to fetch messages', error);
        }
      };

      fetchMessages();
    }
  }, [activeConversation, token, setMessages]);

  if (!user) return null;

  return (
    <div className="h-[calc(100vh-6rem)] -m-4 md:-m-8 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center overflow-hidden">
      <div className="flex h-full w-full bg-black/60 backdrop-blur-sm">
        {loading ? (
          <div className="w-full flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <ConversationList conversations={conversations} userId={user._id} />
            <ChatWindow userId={user._id} />
          </>
        )}
      </div>
    </div>
  );
}
