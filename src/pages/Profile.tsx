import { useState } from "react";
import { Menu, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { StatCard } from "@/components/StatCard";
import { LeaderboardItem } from "@/components/LeaderboardItem";
import { BottomNav } from "@/components/BottomNav";

const Profile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"global" | "friends">("global");
  const [searchQuery, setSearchQuery] = useState("");

  const globalLeaders = [
    { id: 1, name: "Sophia", xp: 15200, rank: 1, isTop: true },
    { id: 2, name: "Liam", xp: 14800, rank: 2, isTop: true },
    { id: 3, name: "Ava", xp: 20100, rank: 3, isTop: true },
  ];

  const userStats = {
    name: "Ethan",
    level: 12,
    totalXp: 12500,
    xpToNext: 750,
    xpForNext: 1000,
    totalWorkouts: 150,
    weeklyStreak: 3,
    longestStreak: 10,
    rank: 12,
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button className="p-3 rounded-full bg-secondary/50">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Profile</h1>
          <div className="w-12" />
        </div>

        {/* Profile Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="w-40 h-40 rounded-full bg-gradient-to-br from-amber-200 to-amber-100 flex items-center justify-center overflow-hidden">
              <div className="w-full h-full bg-cover bg-center" style={{ backgroundColor: '#f5deb3' }} />
            </div>
            <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full w-14 h-14 flex items-center justify-center font-bold text-xl border-4 border-background">
              {userStats.level}
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-2">{userStats.name}</h2>
          <p className="text-muted-foreground">Total XP: {userStats.totalXp.toLocaleString()}</p>
        </div>

        {/* XP Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span>XP to next level</span>
            <span className="font-bold">{userStats.xpToNext}/{userStats.xpForNext}</span>
          </div>
          <Progress value={(userStats.xpToNext / userStats.xpForNext) * 100} className="h-3" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <StatCard label="Total Workouts" value={userStats.totalWorkouts} />
          <StatCard label="Weekly Streak" value={userStats.weeklyStreak} />
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
            {globalLeaders.map((leader) => (
              <LeaderboardItem
                key={leader.id}
                rank={leader.rank}
                name={leader.name}
                xp={leader.xp}
                isTop={leader.isTop}
              />
            ))}
            <LeaderboardItem
              rank={userStats.rank}
              name={`${userStats.name} (You)`}
              xp={userStats.totalXp}
              isUser
            />
          </div>
        </div>
      </div>

      <BottomNav active="profile" />
    </div>
  );
};

export default Profile;
