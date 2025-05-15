
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Post, PollOption } from "@/types";
import { Heart, MessageCircle, Share } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

interface PollPostProps {
  post: Post;
  options: PollOption[];
  onLike: () => void;
  onVote: (optionId: string) => void;
}

const PollPost = ({ post, options, onLike, onVote }: PollPostProps) => {
  const { user } = useAuth();
  const formattedDate = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
  });

  // Calculate total votes
  const totalVotes = options.reduce((sum, option) => sum + option.votes_count, 0);
  
  // Check if user has already voted
  const hasVoted = options.some(option => option.has_voted);

  return (
    <Card className="post-card animate-in">
      <CardHeader className="pb-3">
        {post.title && <h3 className="text-xl font-semibold mb-1">{post.title}</h3>}
        <p>{post.content}</p>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {options.map((option) => {
          const percentage = totalVotes > 0 
            ? Math.round((option.votes_count / totalVotes) * 100) 
            : 0;
          
          return (
            <div key={option.id} className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  {hasVoted ? (
                    <div className="relative pt-2 pb-3">
                      <div className="flex justify-between mb-1">
                        <span>{option.option_text}</span>
                        <span className="text-sm font-medium">{percentage}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start h-auto py-3"
                      onClick={() => user && onVote(option.id)}
                    >
                      {option.option_text}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        <div className="text-sm text-muted-foreground pt-2">
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} {hasVoted && '• You voted'}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <div className="text-sm text-muted-foreground">
          Posted {formattedDate}
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onLike}
              className={`flex items-center gap-1 ${post.has_liked ? "text-destructive" : ""}`}
            >
              <Heart className={`h-4 w-4 ${post.has_liked ? "fill-current" : ""}`} />
              <span>{post.likes_count > 0 ? post.likes_count : ""}</span>
            </Button>
          ) : (
            <Link to="/login">
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span>{post.likes_count > 0 ? post.likes_count : ""}</span>
              </Button>
            </Link>
          )}
          <Button variant="ghost" size="sm" className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            <span>{post.comments_count > 0 ? post.comments_count : ""}</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-1">
            <Share className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default PollPost;
