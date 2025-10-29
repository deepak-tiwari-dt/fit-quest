import { useState, useEffect } from "react";
import { Menu, UserPlus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { StatCard } from "@/components/StatCard";
import { LeaderboardItem } from "@/components/LeaderboardItem";
import { BottomNav } from "@/components/BottomNav";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"global" | "friends">("global");
  const [searchQuery, setSearchQuery] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchLeaderboard();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("total_xp", { ascending: false })
        .limit(10);

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (error: any) {
      console.error("Error fetching leaderboard:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary text-lg">Loading...</div>
      </div>
    );
  }

  const xpForNextLevel = profile.level * 1000;
  const xpToNextLevel = xpForNextLevel - (profile.total_xp % xpForNextLevel);
  const currentLevelXp = profile.total_xp % xpForNextLevel;
  const userRank = leaderboard.findIndex(p => p.id === user?.id) + 1;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button className="p-3 rounded-full bg-secondary/50">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">Profile</h1>
            <button onClick={handleSignOut} className="p-3 rounded-full bg-secondary/50">
              <LogOut className="w-6 h-6" />
            </button>
          </div>

          {/* Profile Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-amber-200 to-amber-100 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-cover bg-center" style={{ backgroundColor: '#f5deb3' }} />
              </div>
              <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full w-14 h-14 flex items-center justify-center font-bold text-xl border-4 border-background">
                {profile.level}
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-2">{profile.username}</h2>
            <p className="text-muted-foreground">Total XP: {profile.total_xp.toLocaleString()}</p>
          </div>

          {/* XP Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span>XP to next level</span>
              <span className="font-bold">{xpToNextLevel}/{xpForNextLevel}</span>
            </div>
            <Progress value={(currentLevelXp / xpForNextLevel) * 100} className="h-3" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <StatCard label="Total Workouts" value={profile.total_workouts} />
            <StatCard label="Weekly Streak" value={profile.weekly_streak} />
          </div>

          {/* Leaderboard Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">Leaderboard</h3>
              <Button 
                onClick={() => navigate('/invite')}
                className="bg-primary hover:bg-primary/90"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Friends
              </Button>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={activeTab === "global" ? "default" : "secondary"}
                className="flex-1 rounded-full"
                onClick={() => setActiveTab("global")}
              >
                Global
              </Button>
              <Button
                variant={activeTab === "friends" ? "default" : "secondary"}
                className="flex-1 rounded-full"
                onClick={() => setActiveTab("friends")}
              >
                Friends
              </Button>
            </div>

            {activeTab === "friends" && (
              <div className="mb-6">
                <Input
                  placeholder="Search friends"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-secondary/50 border-0"
                />
              </div>
            )}

            {/* Leaderboard List */}
            <div className="space-y-3">
              {leaderboard.slice(0, 3).map((leader, index) => (
                <LeaderboardItem
                  key={leader.id}
                  rank={index + 1}
                  name={leader.username}
                  xp={leader.total_xp}
                  isTop={true}
                  isUser={leader.id === user?.id}
                />
              ))}
              {userRank > 3 && (
                <LeaderboardItem
                  rank={userRank}
                  name={`${profile.username} (You)`}
                  xp={profile.total_xp}
                  isUser
                />
              )}
            </div>
          </div>
        </div>

        <BottomNav active="profile" />
      </div>
    </ProtectedRoute>
  );
};

export default Profile;
