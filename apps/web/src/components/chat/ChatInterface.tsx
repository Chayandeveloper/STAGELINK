'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Phone, Video, MoreVertical, Image as ImageIcon, ChevronLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocationStore } from '@/store/useLocationStore';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import { BookTableModal } from '@/components/reservations/BookTableModal';

export function ChatInterface({ roleTitle }: { roleTitle: string }) {
  const { user } = useAuthStore();
  const selectedCity = useLocationStore((state) => state.selectedCity);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [activeContact, setActiveContact] = useState<any>(null);
  const [showMeetupModal, setShowMeetupModal] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize socket connection
  useEffect(() => {
    // Only connect if we have a user
    if (!user) return;
    
    // Create socket connection
    const defaultUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000` : '';
    const socketUrl = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : defaultUrl;
    const token = useAuthStore.getState().token;
    socketRef.current = io(socketUrl, {
      auth: { token }
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to chat server');
    });

    socketRef.current.on('receive_message', (message) => {
      // Check if message belongs to current active chat
      setActiveContact((prevActiveContact: any) => {
        if (prevActiveContact && (message.sender === prevActiveContact._id || message.receiver === prevActiveContact._id)) {
          setMessages((prev) => {
            // Avoid duplicate messages
            if (prev.some(m => m._id === message._id)) return prev;
            return [...prev, message];
          });
        }
        return prevActiveContact;
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  // Fetch contacts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await api.get(`/chat/contacts?city=${selectedCity || ''}`);
        setContacts(res.data);
        if (res.data.length > 0 && !activeContact) {
          setActiveContact(res.data[0]);
        }
      } catch (err) {
        console.error('Failed to fetch contacts', err);
      }
    };
    fetchContacts();
  }, [selectedCity]);

  // Fetch chat history and join room when active contact changes
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!activeContact || !user) return;
      
      try {
        const res = await api.get(`/chat/${activeContact._id}`);
        setMessages(res.data);
        
        // Join room
        if (socketRef.current) {
          const myId = user._id;
          const otherId = activeContact._id;
          const roomId = myId < otherId ? `${myId}_${otherId}` : `${otherId}_${myId}`;
          socketRef.current.emit('join_room', roomId);
        }
      } catch (err) {
        console.error('Failed to fetch chat history', err);
      }
    };

    fetchChatHistory();
  }, [activeContact, user]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeContact || !user) return;
    
    const messageContent = input.trim();
    setInput('');
    
    try {
      // Send to API
      const res = await api.post('/chat/send', {
        receiverId: activeContact._id,
        content: messageContent,
        messageType: 'text'
      });
      
      const savedMessage = res.data;
      
      // Update local state immediately
      setMessages((prev) => [...prev, savedMessage]);
      
      // Emit via socket
      if (socketRef.current) {
        const myId = user._id;
        const otherId = activeContact._id;
        const roomId = myId < otherId ? `${myId}_${otherId}` : `${otherId}_${myId}`;
        socketRef.current.emit('send_message', { roomId, message: savedMessage });
      }
      
    } catch (err) {
      console.error('Failed to send message', err);
      // Optional: show error toast or restore input
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/50 relative">
      {/* Contacts List */}
      <div className={`w-full md:w-1/3 border-r border-zinc-800 bg-zinc-950/50 flex-col ${activeContact ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white tracking-tight">Conversations in {selectedCity || 'All Cities'}</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.map((contact) => (
            <div 
              key={contact._id}
              className={`p-4 border-b border-zinc-800/50 cursor-pointer transition-colors ${activeContact?._id === contact._id ? 'bg-zinc-800/50' : 'hover:bg-zinc-800/30'}`}
              onClick={() => setActiveContact(contact)}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-1 overflow-hidden">
                  <h4 className={`font-medium truncate ${activeContact?._id === contact._id ? 'text-white' : 'text-zinc-300'}`}>
                    {contact.name}
                  </h4>
                  {contact.role && (
                    <p className="text-xs text-zinc-500 capitalize">{contact.role}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {contacts.length === 0 && (
            <div className="p-6 text-center text-zinc-500 text-sm">
              No users found in this city.
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex-col bg-zinc-900/20 w-full ${!activeContact ? 'hidden md:flex' : 'flex'}`}>
        {/* Chat Header */}
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/80">
          <div className="flex items-center space-x-2 sm:space-x-3">
            {activeContact && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden text-zinc-400 hover:text-white mr-1" 
                onClick={() => setActiveContact(null)}
              >
                <ChevronLeft size={20} />
              </Button>
            )}
            <div>
              <h3 className="text-white font-bold">{activeContact ? activeContact.name : 'Select a contact'}</h3>
              {activeContact && <p className="text-xs text-green-400 font-medium">Online</p>}
            </div>
          </div>
          <div className="flex space-x-2 text-zinc-400">
            {activeContact && (
              <Button 
                variant="secondary" 
                size="sm" 
                className="hidden sm:flex text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 mr-2"
                onClick={() => setShowMeetupModal(true)}
              >
                <MapPin size={16} className="mr-1" /> Meetup
              </Button>
            )}
            <Button variant="ghost" size="icon" className="hover:text-white"><Phone size={18} /></Button>
            <Button variant="ghost" size="icon" className="hover:text-white"><Video size={18} /></Button>
            <Button variant="ghost" size="icon" className="hover:text-white"><MoreVertical size={18} /></Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!activeContact ? (
            <div className="h-full flex items-center justify-center text-zinc-500">
              Select a conversation to start chatting
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2">
              <p>No messages yet</p>
              <p className="text-sm">Send a message to start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender === user?._id;
              return (
                <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl p-4 ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-zinc-800 text-zinc-100 rounded-tl-sm'}`}>
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-zinc-400'}`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-zinc-900/80 border-t border-zinc-800">
          <form onSubmit={handleSend} className="flex items-center space-x-2">
            <Button type="button" variant="ghost" size="icon" className="text-zinc-400 hover:text-white" disabled={!activeContact}>
              <ImageIcon size={20} />
            </Button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-zinc-800 border-none rounded-full px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Type a message..."
              disabled={!activeContact}
            />
            <Button type="submit" size="icon" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full" disabled={!activeContact || !input.trim()}>
              <Send size={18} />
            </Button>
          </form>
        </div>
      </div>
      
      {showMeetupModal && activeContact && (
        <BookTableModal 
          onClose={() => setShowMeetupModal(false)}
          onSuccess={() => setShowMeetupModal(false)}
          meetupRecipient={activeContact}
          onMessageSent={(msg) => {
            setMessages((prev) => [...prev, msg]);
            if (socketRef.current) {
              const myId = user?._id;
              const otherId = activeContact._id;
              if (myId && otherId) {
                const roomId = myId < otherId ? `${myId}_${otherId}` : `${otherId}_${myId}`;
                socketRef.current.emit('send_message', { roomId, message: msg });
              }
            }
          }}
        />
      )}
    </div>
  );
}
