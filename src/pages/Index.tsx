
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/Navbar";
import TextPost from "@/components/posts/TextPost";
import PollPost from "@/components/posts/PollPost";
import MediaPost from "@/components/posts/MediaPost";
import { supabase } from "@/lib/supabase";
import { Post, PollOption } from "@/types";
import { Loader2, Plus } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [pollOptions, setPollOptions] = useState<Record<string, PollOption[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("latest");

  useEffect(() => {
    const fetchPosts = async () => {
      let query = supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (activeTab === "popular") {
        query = query.order("likes_count", { ascending: false });
      }

      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching posts:", error);
        return;
      }
      
      setPosts(data as Post[]);
      
      // Fetch poll options for poll posts
      const pollPosts = data?.filter(post => post.type === 'poll') || [];
      
      if (pollPosts.length > 0) {
        const { data: optionsData } = await supabase
          .from("poll_options")
          .select("*")
          .in("post_id", pollPosts.map(post => post.id));
          
        if (optionsData) {
          const groupedOptions: Record<string, PollOption[]> = {};
          
          optionsData.forEach((option: PollOption) => {
            if (!groupedOptions[option.post_id]) {
              groupedOptions[option.post_id] = [];
            }
            groupedOptions[option.post_id].push(option);
          });
          
          setPollOptions(groupedOptions);
        }
      }

      setLoading(false);
    };

    fetchPosts();
  }, [activeTab]);

  // Handle anonymous post like
  const handleLike = async (postId: string) => {
    if (!user) return;
    
    // Check if user has already liked this post
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();
    
    if (existingLike) {
      // Unlike the post
      await supabase
        .from('post_likes')
        .delete()
        .match({ post_id: postId, user_id: user.id });
        
      // Update post likes count
      await supabase
        .from('posts')
        .update({ likes_count: supabase.rpc('decrement', { x: 1 }) })
        .eq('id', postId);
      
      // Update local state
      setPosts(posts.map(post => 
        post.id === postId ? 
          { ...post, likes_count: post.likes_count - 1, has_liked: false } 
          : post
      ));
    } else {
      // Like the post
      await supabase
        .from('post_likes')
        .insert([{ post_id: postId, user_id: user.id }]);
      
      // Update post likes count
      await supabase
        .from('posts')
        .update({ likes_count: supabase.rpc('increment', { x: 1 }) })
        .eq('id', postId);
      
      // Update local state
      setPosts(posts.map(post => 
        post.id === postId ? 
          { ...post, likes_count: post.likes_count + 1, has_liked: true } 
          : post
      ));
    }
  };

  // Handle poll voting
  const handleVote = async (postId: string, optionId: string) => {
    if (!user) return;
    
    // Check if user has already voted in this poll
    const { data: existingVote } = await supabase
      .from('poll_votes')
      .select('*')
      .eq('poll_option_id', optionId)
      .eq('user_id', user.id)
      .single();
    
    if (!existingVote) {
      // Record the vote
      await supabase
        .from('poll_votes')
        .insert([{ poll_option_id: optionId, user_id: user.id }]);
      
      // Update vote count for the option
      await supabase
        .from('poll_options')
        .update({ votes_count: supabase.rpc('increment', { x: 1 }) })
        .eq('id', optionId);
      
      // Update local state
      setPollOptions({
        ...pollOptions,
        [postId]: pollOptions[postId].map(option => 
          option.id === optionId ? 
            { ...option, votes_count: option.votes_count + 1, has_voted: true } 
            : option
        )
      });
    }
  };

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

  const renderWelcomeContent = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Share anonymously
        </span>
      </h1>
      <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-md">
        Express yourself freely and connect with others in a safe, anonymous environment.
      </p>
      <div className="mt-10 flex items-center gap-6">
        {user ? (
          <Link to="/create-post">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create your first post
            </Button>
          </Link>
        ) : (
          <>
            <Link to="/login">
              <Button variant="outline">Log in</Button>
            </Link>
            <Link to="/register">
              <Button>Sign up</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        {posts.length === 0 ? (
          renderWelcomeContent()
        ) : (
          <>
            <div className="mb-8 flex items-center justify-between">
              <h1 className="text-2xl font-bold">
                {user ? "Your Anonymous Feed" : "Discover Anonymous Content"}
              </h1>
              {user && (
                <Link to="/create-post">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Post
                  </Button>
                </Link>
              )}
            </div>

            <Tabs 
              defaultValue="latest" 
              className="mb-6"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList>
                <TabsTrigger value="latest">Latest</TabsTrigger>
                <TabsTrigger value="popular">Popular</TabsTrigger>
              </TabsList>
              <TabsContent value="latest">
                <div className="grid gap-6">
                  {posts.map((post) => {
                    switch (post.type) {
                      case "text":
                        return (
                          <TextPost 
                            key={post.id} 
                            post={post} 
                            onLike={() => handleLike(post.id)} 
                          />
                        );
                      case "poll":
                        return (
                          <PollPost 
                            key={post.id} 
                            post={post} 
                            options={pollOptions[post.id] || []}
                            onLike={() => handleLike(post.id)}
                            onVote={(optionId) => handleVote(post.id, optionId)}
                          />
                        );
                      case "media":
                        return (
                          <MediaPost 
                            key={post.id} 
                            post={post} 
                            onLike={() => handleLike(post.id)} 
                          />
                        );
                      default:
                        return null;
                    }
                  })}
                </div>
              </TabsContent>
              <TabsContent value="popular">
                <div className="grid gap-6">
                  {posts.map((post) => {
                    switch (post.type) {
                      case "text":
                        return (
                          <TextPost 
                            key={post.id} 
                            post={post} 
                            onLike={() => handleLike(post.id)} 
                          />
                        );
                      case "poll":
                        return (
                          <PollPost 
                            key={post.id} 
                            post={post} 
                            options={pollOptions[post.id] || []}
                            onLike={() => handleLike(post.id)}
                            onVote={(optionId) => handleVote(post.id, optionId)}
                          />
                        );
                      case "media":
                        return (
                          <MediaPost 
                            key={post.id} 
                            post={post} 
                            onLike={() => handleLike(post.id)} 
                          />
                        );
                      default:
                        return null;
                    }
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
