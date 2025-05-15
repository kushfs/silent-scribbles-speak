
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@/types";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // First get the current session
    const getCurrentSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          return;
        }
        
        if (data.session) {
          setSession(data.session);
          setUser({
            id: data.session.user.id,
            email: data.session.user.email || '',
            username: '',
            created_at: data.session.user.created_at
          });
          
          // Fetch profile data if session exists
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('username, profile_picture_url')
            .eq('id', data.session.user.id)
            .single();
            
          if (!profileError && profileData) {
            setUser(prev => prev ? {
              ...prev,
              username: profileData.username,
              avatar_url: profileData.profile_picture_url
            } : null);
          }
        }
      } catch (error) {
        console.error("Session retrieval error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    getCurrentSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          setUser({
            id: currentSession.user.id,
            email: currentSession.user.email || '',
            username: '',
            created_at: currentSession.user.created_at
          });
          
          // Fetch profile data on auth state change
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('username, profile_picture_url')
            .eq('id', currentSession.user.id)
            .single();
            
          if (!profileError && profileData) {
            setUser(prev => prev ? {
              ...prev,
              username: profileData.username,
              avatar_url: profileData.profile_picture_url
            } : null);
          }
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
      }
    } catch (error) {
      console.error("Error signing in:", error);
      toast({
        title: "Login Error",
        description: "An unexpected error occurred during login.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      setLoading(true);
      
      // Check if username is already taken
      const { data: existingUsernames, error: usernameCheckError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username);
      
      if (usernameCheckError) {
        console.error("Error checking username:", usernameCheckError);
        toast({
          title: "Registration Error",
          description: "Could not verify username availability.",
          variant: "destructive",
        });
        return;
      }
      
      if (existingUsernames && existingUsernames.length > 0) {
        toast({
          title: "Registration Failed",
          description: "This username is already taken.",
          variant: "destructive",
        });
        return;
      }
      
      // Create the user account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username }
        }
      });
      
      if (error) {
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      if (data.user) {
        // Create a profile record for the user
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              username,
              email
            }
          ]);
        
        if (profileError) {
          toast({
            title: "Profile Creation Failed",
            description: profileError.message,
            variant: "destructive",
          });
          return;
        }
        
        toast({
          title: "Registration Successful",
          description: "Your account has been created.",
        });
      }
    } catch (error) {
      console.error("Error signing up:", error);
      toast({
        title: "Registration Error",
        description: "An unexpected error occurred during registration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Logout Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      setUser(null);
      setSession(null);
      
      toast({
        title: "Logout Successful",
        description: "You have been logged out.",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Logout Error",
        description: "An unexpected error occurred during logout.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
