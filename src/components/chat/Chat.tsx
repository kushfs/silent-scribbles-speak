
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Conversation, ChatMessage, User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ChatProps {
  conversation: Conversation;
  currentUser: User;
}

const Chat = ({ conversation, currentUser }: ChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        // Get messages for this conversation
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        // We need to cast the data to ChatMessage[] since we know it matches our expected type
        setMessages((data || []) as unknown as ChatMessage[]);
        
        // Mark messages as read
        if (data) {
          const unreadMessages = data
            .filter(m => !m.read && m.sender_id !== currentUser.id)
            .map(m => m.id);
          
          if (unreadMessages && unreadMessages.length > 0) {
            await supabase
              .from('messages')
              .update({ read: true })
              .in('id', unreadMessages);
          }
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`chat-${conversation.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        async (payload) => {
          const newMsg = payload.new as unknown as ChatMessage;
          
          // Add the message to the state
          setMessages(prevMessages => [...prevMessages, newMsg]);
          
          // Mark as read if not sent by the current user
          if (newMsg.sender_id !== currentUser.id) {
            await supabase
              .from('messages')
              .update({ read: true })
              .eq('id', newMsg.id);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.id, currentUser.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!newMessage.trim()) return;
    
    setSending(true);
    try {
      // Send message
      const { error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversation.id,
          sender_id: currentUser.id,
          content: newMessage.trim(),
          read: false
        }] as any); // Using 'any' temporarily to bypass type checking
      
      if (error) throw error;
      
      // Update conversation's updated_at timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversation.id);
      
      // Clear input
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-3">
        <h3 className="text-lg font-semibold">
          {conversation.participant_usernames.join(", ")}
        </h3>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center py-4">
            <p className="text-muted-foreground">No messages yet. Say hello!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOutgoing = message.sender_id === currentUser.id;
              const formattedTime = formatDistanceToNow(new Date(message.created_at), {
                addSuffix: true,
              });
              
              return (
                <div 
                  key={message.id} 
                  className={`flex ${isOutgoing ? "justify-end" : "justify-start"}`}
                >
                  <div 
                    className={`chat-bubble ${
                      isOutgoing ? "chat-bubble-outgoing" : "chat-bubble-incoming"
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      isOutgoing ? "text-primary-foreground/70" : "text-secondary-foreground/70"
                    }`}>
                      {formattedTime}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      
      <form 
        onSubmit={sendMessage}
        className="border-t p-3 flex items-center space-x-2"
      >
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
        />
        <Button 
          type="submit" 
          size="icon"
          disabled={sending || !newMessage.trim()}
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
};

export default Chat;
