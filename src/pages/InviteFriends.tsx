import { useState, useEffect, useMemo } from "react";
import { X, Link2, UserPlus, Send, Users, Flame, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const searchSchema = z.string().max(50).regex(/^[a-zA-Z0-9_\s]*$/);

const InviteFriends = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const howItWorks = [
    {
      title: "1. Send an Invite",
      description: "Share your unique invite link with friends via message or social media.",
      icon: Send,
    },
    {
      title: "2. Friend Joins",
      description: "Your friend signs up using your link and you'll be automatically connected.",
      icon: Users,
    },
    {
      title: "3. Compete & Earn Bonus XP",
      description: "Workout together, cheer each other on, and earn bonus XP for every friend who joins!",
      icon: Flame,
    },
  ];

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length > 0) {
        searchUsers();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const searchUsers = async () => {
    try {
      // Validate search query
      const validation = searchSchema.safeParse(searchQuery);
      if (!validation.success) {
        setSearchResults([]);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", `%${validation.data}%`)
        .neq("id", user?.id)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Search failed",
        description: "Please try again later",
      });
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .insert({
          user_id: user?.id,
          friend_id: friendId,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Friend request sent!",
        description: "They will be notified of your request",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/auth`;
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Link copied!",
      description: "Share it with your friends",
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => navigate('/')}>
              <X className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">Invite Friends</h1>
            <div className="w-6" />
          </div>

          {/* Main Title */}
          <h2 className="text-3xl font-bold mb-8">Invite your friends</h2>

          {/* Action Cards */}
          <div className="space-y-4 mb-8">
            <button 
              onClick={copyInviteLink}
              className="w-full bg-secondary/30 rounded-2xl p-6 flex items-center justify-between hover:bg-secondary/40 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="bg-primary/20 rounded-full p-4">
                  <Link2 className="w-6 h-6 text-primary" />
                </div>
                <span className="font-semibold text-lg">Share invite link</span>
              </div>
              <ChevronDown className="w-5 h-5 rotate-[-90deg]" />
            </button>
          </div>

          {/* How it Works Collapsible */}
          <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-8">
            <CollapsibleTrigger asChild>
              <button className="w-full bg-secondary/30 rounded-2xl p-6 flex items-center justify-between hover:bg-secondary/40 transition-colors">
                <span className="font-semibold text-lg">How it works</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? '' : 'rotate-[-90deg]'}`} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              {howItWorks.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="bg-primary/20 rounded-full p-3 h-fit">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Search Section */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-4">Search for friends</h3>
            <Input
              placeholder="Search for username"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-secondary/30 border-0 h-14 rounded-2xl text-base"
            />
            
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                {searchResults.map((profile) => (
                  <div key={profile.id} className="bg-secondary/30 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{profile.username}</p>
                      <p className="text-sm text-muted-foreground">Level {profile.level}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => sendFriendRequest(profile.id)}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default InviteFriends;
