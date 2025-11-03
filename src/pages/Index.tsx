import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, TrendingUp, Calendar, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BottomNav } from "@/components/BottomNav";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [dailyChallenge, setDailyChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchDailyChallenge();
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

  const fetchDailyChallenge = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      let { data: challenge, error } = await supabase
        .from("daily_challenges")
        .select(`
          *,
          exercises (*)
        `)
        .eq("user_id", user?.id)
        .eq("date", today)
        .maybeSingle();

      if (error) throw error;

      if (!challenge) {
        const { data: exercises } = await supabase
          .from("exercises")
          .select("*")
          .limit(1)
          .single();

        if (exercises) {
          const { data: newChallenge, error: createError } = await supabase
            .from("daily_challenges")
            .insert({
              user_id: user?.id,
              exercise_id: exercises.id,
              date: today,
            })
            .select(`
              *,
              exercises (*)
            `)
            .single();

          if (createError) throw createError;
          challenge = newChallenge;
        }
      }

      setDailyChallenge(challenge);
    } catch (error: any) {
      console.error("Error fetching daily challenge:", error);
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary text-lg">Loading...</div>
      </div>
    );
  }

  const xpForNextLevel = profile.level * 1000;
  const currentLevelXp = profile.total_xp % xpForNextLevel;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20">
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {profile.username}!</h1>
            <p className="text-muted-foreground">Let's crush your fitness goals today</p>
          </div>

          {/* Level Card */}
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl p-6 mb-6 border border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-16 h-16 flex items-center justify-center font-bold text-2xl">
                  {profile.level}
                </div>
                <div>
                  <h2 className="text-xl font-bold">Level {profile.level}</h2>
                  <p className="text-sm text-muted-foreground">{profile.total_xp.toLocaleString()} Total XP</p>
                </div>
              </div>
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <Progress value={(currentLevelXp / xpForNextLevel) * 100} className="h-3 mb-2" />
            <p className="text-sm text-muted-foreground text-right">
              {currentLevelXp}/{xpForNextLevel} XP to Level {profile.level + 1}
            </p>
          </div>

          {/* Daily Challenge */}
          {dailyChallenge && (
            <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 border-2 border-yellow-600/50 rounded-3xl p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-yellow-400" />
                  <div>
                    <h3 className="text-xl font-bold text-yellow-400">Daily Challenge</h3>
                    <p className="text-sm text-foreground/80">{dailyChallenge.exercises?.name}</p>
                  </div>
                </div>
                <span className="text-yellow-400 font-bold text-lg">{dailyChallenge.xp_reward} XP</span>
              </div>
              <Progress 
                value={(dailyChallenge.completed_sets / dailyChallenge.target_sets) * 100} 
                className="h-3 mb-2"
              />
              <p className="text-sm text-muted-foreground">
                {dailyChallenge.completed_sets}/{dailyChallenge.target_sets} Sets Completed
              </p>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-secondary/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Workouts</span>
              </div>
              <p className="text-3xl font-bold">{profile.total_workouts}</p>
            </div>
            <div className="bg-secondary/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Streak</span>
              </div>
              <p className="text-3xl font-bold">{profile.weekly_streak}</p>
            </div>
          </div>

          {/* Start Workout Button */}
          <Button 
            className="w-full h-16 text-lg font-bold rounded-full"
            size="lg"
            onClick={() => navigate('/workout')}
          >
            <Dumbbell className="w-6 h-6 mr-2" />
            Start Workout
          </Button>
        </div>

        <BottomNav active="home" />
      </div>
    </ProtectedRoute>
  );
};

export default Index;
