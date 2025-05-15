
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { Conversation, User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import Chat from "@/components/chat/Chat";

const Messages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchUsername, setSearchUsername] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);

  // Load conversations
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      try {
        // First get all conversations the user is part of
        const { data: participantData, error: participantError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id);
        
        if (participantError) throw participantError;
        
        if (!participantData || participantData.length === 0) {
          setLoading(false);
          return;
        }
        
        const conversationIds = participantData.map(p => p.conversation_id);
        
        // Get conversations with their latest message
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('conversations')
          .select('*')
          .in('id', conversationIds)
          .order('updated_at', { ascending: false });
        
        if (conversationsError) throw conversationsError;
        
        // For each conversation, get the other participants
        const enhancedConversations: Conversation[] = [];
        
        for (const conv of conversationsData) {
          // Get all participants in this conversation
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conv.id);
          
          // Get usernames of participants (excluding current user)
          const otherParticipantIds = participants?.filter(p => p.user_id !== user.id).map(p => p.user_id) || [];
          
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('username')
            .in('id', otherParticipantIds);
          
          // Get latest message
          const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);
          
          // Count unread messages
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('read', false)
            .neq('sender_id', user.id);
          
          enhancedConversations.push({
            id: conv.id,
            participant_ids: otherParticipantIds,
            participant_usernames: profilesData?.map(p => p.username) || [],
            last_message: messages?.[0],
            unread_count: unreadCount || 0,
            created_at: conv.created_at,
            updated_at: conv.updated_at
          });
        }
        
        setConversations(enhancedConversations);
      } catch (error) {
        console.error("Error fetching conversations:", error);
        toast({
          title: "Error loading conversations",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
    
    // Subscribe to new messages in conversations
    const channel = supabase
      .channel('message-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          // Handle new message
          const newMessage = payload.new;
          
          // Check if the message is for one of the user's conversations
          const isUserConversation = conversations.some(
            conv => conv.id === newMessage.conversation_id
          );
          
          if (isUserConversation) {
            // Update the conversations list with the new message
            setConversations(prevConversations => {
              return prevConversations.map(conv => {
                if (conv.id === newMessage.conversation_id) {
                  // Update this conversation with new message
                  return {
                    ...conv,
                    last_message: newMessage,
                    unread_count: newMessage.sender_id !== user.id 
                      ? conv.unread_count + 1 
                      : conv.unread_count,
                    updated_at: new Date().toISOString()
                  };
                }
                return conv;
              }).sort((a, b) => 
                new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
              );
            });
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  // Handle search
  const handleSearch = async () => {
    if (searchUsername.trim().length < 3) {
      toast({
        title: "Search query too short",
        description: "Please enter at least 3 characters to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, created_at')
        .ilike('username', `%${searchUsername}%`)
        .neq('id', user?.id)
        .limit(5);
      
      if (error) throw error;
      
      setSearchResults(data as User[]);
    } catch (error) {
      console.error("Error searching users:", error);
      toast({
        title: "Search failed",
        description: "Failed to search for users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Start a new conversation
  const startConversation = async (otherUser: User) => {
    try {
      // Check if a conversation already exists with this user
      const existingConversation = conversations.find(conv => 
        conv.participant_ids.includes(otherUser.id)
      );
      
      if (existingConversation) {
        setSelectedConversation(existingConversation);
        setNewChatDialogOpen(false);
        return;
      }
      
      // Create a new conversation
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .insert([{ }])
        .select();
      
      if (conversationError || !conversationData) throw conversationError;
      
      // Add participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversationData[0].id, user_id: user!.id },
          { conversation_id: conversationData[0].id, user_id: otherUser.id }
        ]);
      
      if (participantsError) throw participantsError;
      
      // Create new conversation object
      const newConversation: Conversation = {
        id: conversationData[0].id,
        participant_ids: [otherUser.id],
        participant_usernames: [otherUser.username],
        unread_count: 0,
        created_at: conversationData[0].created_at,
        updated_at: conversationData[0].updated_at
      };
      
      // Add to conversations list
      setConversations([newConversation, ...conversations]);
      
      // Select the new conversation
      setSelectedConversation(newConversation);
      setNewChatDialogOpen(false);
      
      toast({
        title: "Conversation created",
        description: `Chat with ${otherUser.username} started`
      });
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Failed to start conversation",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Messages</h1>
          <Dialog open={newChatDialogOpen} onOpenChange={setNewChatDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                New Message
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start a new conversation</DialogTitle>
                <DialogDescription>
                  Search for a user by username to start chatting
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Search username..."
                  value={searchUsername}
                  onChange={(e) => setSearchUsername(e.target.value)}
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
              <div className="py-4">
                {searchResults.length > 0 ? (
                  <ul className="space-y-2">
                    {searchResults.map((result) => (
                      <li key={result.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                        <span>{result.username}</span>
                        <Button size="sm" onClick={() => startConversation(result)}>
                          Chat
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  searchUsername && !isSearching && (
                    <p className="text-center text-muted-foreground">
                      No users found
                    </p>
                  )
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewChatDialogOpen(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-12rem)]">
          {/* Conversations List */}
          <div className="border rounded-lg overflow-hidden">
            <ScrollArea className="h-full">
              {conversations.length > 0 ? (
                <div className="py-2">
                  {conversations.map((conversation) => (
                    <Button
                      key={conversation.id}
                      variant="ghost"
                      className={`w-full justify-start px-4 py-6 h-auto ${
                        selectedConversation?.id === conversation.id ? "bg-muted" : ""
                      }`}
                      onClick={() => handleConversationSelect(conversation)}
                    >
                      <div className="flex flex-col items-start w-full">
                        <div className="flex justify-between w-full mb-1">
                          <span className="font-medium">
                            {conversation.participant_usernames.join(", ")}
                          </span>
                          {conversation.unread_count > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {conversation.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground text-left truncate w-full">
                          {conversation.last_message?.content ? (
                            conversation.last_message.sender_id === user.id ? (
                              <>You: {conversation.last_message.content}</>
                            ) : (
                              conversation.last_message.content
                            )
                          ) : (
                            "Start a conversation"
                          )}
                        </p>
                      </div>
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-4">
                  <p className="text-muted-foreground mb-4 text-center">
                    You don't have any conversations yet
                  </p>
                  <Button onClick={() => setNewChatDialogOpen(true)}>
                    Start a new chat
                  </Button>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="border rounded-lg overflow-hidden">
            {selectedConversation ? (
              <Chat 
                conversation={selectedConversation} 
                currentUser={user} 
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-muted-foreground mb-4">
                  Select a conversation or start a new one
                </p>
                <Button onClick={() => setNewChatDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  New Message
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
