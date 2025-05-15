
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AnonyShare
            </span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <Link to="/">
                <Button variant="ghost" className="text-foreground/70 hover:text-foreground">
                  Feed
                </Button>
              </Link>
              <Link to="/messages">
                <Button variant="ghost" className="text-foreground/70 hover:text-foreground">
                  Messages
                </Button>
              </Link>
            </>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/create-post">
                <Button variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Create Post</span>
                </Button>
              </Link>
              
              <Link to="/messages">
                <Button variant="outline" size="icon" className="md:hidden">
                  <Message className="h-4 w-4" />
                  <span className="sr-only">Messages</span>
                </Button>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-9 w-9 rounded-full"
                  >
                    <Avatar className="h-8 w-8 border">
                      <AvatarImage 
                        src={user.avatar_url} 
                        alt={user.username}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link to="/profile">
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onClick={() => signOut()}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex gap-2">
              <Link to="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link to="/register">
                <Button>Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile navbar */}
      {user && (
        <div className="md:hidden border-t border-border">
          <nav className="flex justify-around">
            <Link to="/" className={cn(
              "flex flex-1 items-center justify-center py-3",
              "text-muted-foreground hover:text-foreground"
            )}>
              Feed
            </Link>
            <Link to="/messages" className={cn(
              "flex flex-1 items-center justify-center py-3",
              "text-muted-foreground hover:text-foreground"
            )}>
              Messages
            </Link>
            <Link to="/profile" className={cn(
              "flex flex-1 items-center justify-center py-3",
              "text-muted-foreground hover:text-foreground"
            )}>
              Profile
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
