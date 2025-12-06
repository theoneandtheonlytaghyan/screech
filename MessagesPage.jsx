/**
 * Messages Page
 * Direct messaging interface
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import ConversationList from '../components/messages/ConversationList';
import ChatWindow from '../components/messages/ChatWindow';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../utils/api';

function MessagesPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/messages/conversations');
      const { conversations: data } = response.data.data;
      
      setConversations(data);

      // If conversationId in URL, select that conversation
      if (conversationId) {
        const conv = data.find(c => c._id === conversationId);
        if (conv) {
          setSelectedConversation(conv);
        } else {
          // Fetch specific conversation if not in list
          const convResponse = await api.get(`/messages/conversations/${conversationId}`);
          setSelectedConversation(convResponse.data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err.response?.data?.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [conversationId]);

  // Handle conversation select
  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    navigate(`/messages/${conversation._id}`);
  };

  // Handle new message
  const handleNewMessage = (message) => {
    // Update conversation list
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv._id === message.conversation) {
          return {
            ...conv,
            lastMessage: message,
            lastMessageAt: message.createdAt
          };
        }
        return conv;
      });
      // Sort by lastMessageAt
      return updated.sort((a, b) => 
        new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
      );
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Conversations List - Left Sidebar */}
      <div className={`
        ${selectedConversation ? 'hidden md:block' : 'block'}
        w-full md:w-80 lg:w-96 border-r border-screech-border bg-screech-dark
      `}>
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation?._id}
          onSelect={handleConversationSelect}
        />
      </div>

      {/* Chat Window - Main Area */}
      <div className={`
        ${selectedConversation ? 'block' : 'hidden md:block'}
        flex-1 bg-screech-darker
      `}>
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            onNewMessage={handleNewMessage}
            onBack={() => {
              setSelectedConversation(null);
              navigate('/messages');
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="mx-auto mb-4 text-screech-textMuted" size={64} />
              <p className="text-screech-textMuted text-lg mb-2">
                Select a conversation
              </p>
              <p className="text-screech-textDark text-sm">
                Choose a conversation from the left to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MessagesPage;