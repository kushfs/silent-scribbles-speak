
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Post } from "@/types";
import { Heart, MessageCircle, Share } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

interface TextPostProps {
  post: Post;
  onLike: () => void;
}

const TextPost = ({ post, onLike }: TextPostProps) => {
  const { user } = useAuth();
  const formattedDate = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
  });

  return (
    <Card className="post-card animate-in">
      <CardContent className="pt-6">
        {post.title && <h3 className="text-xl font-semibold mb-2">{post.title}</h3>}
        <p className="whitespace-pre-line">{post.content}</p>
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

export default TextPost;
