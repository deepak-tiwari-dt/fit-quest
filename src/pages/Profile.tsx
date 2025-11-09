import { useState, useEffect } from "react";
import { Menu, UserPlus, LogOut, Home, Dumbbell, Clock, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import { StatCard } from "@/components/StatCard";
import { LeaderboardItem } from "@/components/LeaderboardItem";
import { BottomNav } from "@/components/BottomNav";
import { ImageCropDialog } from "@/components/ImageCropDialog";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");

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
      // Error handled silently - loading state persists
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
      // Error handled silently - empty leaderboard shown
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Read the file and open crop dialog
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCroppedImage = async (croppedBlob: Blob) => {
    if (!user) return;

    try {
      // Upload to storage
      const fileName = `${user.id}/${Date.now()}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      
      toast({
        title: "Success",
        description: "Profile photo updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error uploading photo",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const menuItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Dumbbell, label: "Workout", path: "/workout" },
    { icon: Clock, label: "History", path: "/history" },
    { icon: UserPlus, label: "Invite Friends", path: "/invite" },
  ];

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
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button className="p-3 rounded-full bg-secondary/50 hover:bg-secondary transition-colors">
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px]">
              <SheetHeader>
                <SheetTitle className="text-2xl font-bold">Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-8 space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-secondary/50 transition-colors text-left"
                    >
                      <div className="bg-primary/20 p-2 rounded-lg">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-semibold">{item.label}</span>
                    </button>
                  );
                })}
                <button
                  onClick={() => {
                    handleSignOut();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-destructive/10 transition-colors text-left text-destructive"
                >
                  <div className="bg-destructive/20 p-2 rounded-lg">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <span className="font-semibold">Sign Out</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="text-2xl font-bold">Profile</h1>
          <div className="w-12 h-12" />
        </div>

        {/* Profile Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <Avatar className="w-40 h-40 border-4 border-primary/20">
              <AvatarImage src={profile.avatar_url} alt={profile.username} />
              <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-4xl font-bold">
                {profile.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full w-14 h-14 flex items-center justify-center font-bold text-xl border-4 border-background shadow-lg">
              {profile.level}
            </div>
            <label htmlFor="avatar-upload" className="absolute top-0 right-0 bg-background rounded-full p-2 shadow-lg border-2 border-border hover:bg-secondary transition-colors cursor-pointer">
              <Camera className="w-5 h-5" />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
            </label>
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
      
      <ImageCropDialog
        image={selectedImage}
        open={cropDialogOpen}
        onClose={() => setCropDialogOpen(false)}
        onCropComplete={handleCroppedImage}
      />
    </div>
  );
};

export default Profile;
