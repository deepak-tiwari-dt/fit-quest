import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, TrendingUp, Calendar, Trophy, Zap, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BottomNav } from "@/components/BottomNav";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { InstallBanner } from "@/components/InstallBanner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [dailyChallenge, setDailyChallenge] = useState<any>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchDailyChallenge();
      fetchRecentWorkouts();
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

  const fetchRecentWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from("workouts")
        .select(`
          *,
          exercises (name)
        `)
        .eq("user_id", user?.id)
        .order("completed_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      setRecentWorkouts(data || []);
    } catch (error: any) {
      console.error("Error fetching recent workouts:", error);
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
      <InstallBanner />
      <div className="min-h-screen bg-background pb-20">
        <div className="p-6">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {profile.username}!</h1>
            <p className="text-muted-foreground">Let's crush your fitness goals today</p>
          </div>

          {/* Level Card */}
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl p-6 mb-6 border border-primary/20 animate-scale-in hover-scale">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-16 h-16 flex items-center justify-center font-bold text-2xl shadow-lg">
                  {profile.level}
                </div>
                <div>
                  <h2 className="text-xl font-bold">Level {profile.level}</h2>
                  <p className="text-sm text-muted-foreground">{profile.total_xp.toLocaleString()} Total XP</p>
                </div>
              </div>
              <Trophy className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <Progress value={(currentLevelXp / xpForNextLevel) * 100} className="h-3 mb-2" />
            <p className="text-sm text-muted-foreground text-right">
              {currentLevelXp}/{xpForNextLevel} XP to Level {profile.level + 1}
            </p>
          </div>

          {/* Daily Challenge */}
          {dailyChallenge && (
            <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 border-2 border-yellow-600/50 rounded-3xl p-6 mb-6 animate-fade-in hover-scale">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-600/30 rounded-full p-3">
                    <Target className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-yellow-400">Daily Challenge</h3>
                    <p className="text-sm text-foreground/80">{dailyChallenge.exercises?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-yellow-600/30 px-3 py-1 rounded-full">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 font-bold">{dailyChallenge.xp_reward}</span>
                </div>
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

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-secondary/30 rounded-2xl p-5 animate-fade-in hover-scale border border-transparent hover:border-primary/20 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-primary/20 rounded-full p-2">
                  <Dumbbell className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground font-medium">Total Workouts</span>
              </div>
              <p className="text-3xl font-bold">{profile.total_workouts}</p>
            </div>
            <div className="bg-secondary/30 rounded-2xl p-5 animate-fade-in hover-scale border border-transparent hover:border-primary/20 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-primary/20 rounded-full p-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground font-medium">Weekly Streak</span>
              </div>
              <p className="text-3xl font-bold">{profile.weekly_streak} 🔥</p>
            </div>
          </div>

          {/* Recent Activity */}
          {recentWorkouts.length > 0 && (
            <div className="mb-6 animate-fade-in">
              <h3 className="text-lg font-bold mb-3">Recent Activity</h3>
              <div className="space-y-2">
                {recentWorkouts.map((workout, idx) => (
                  <div
                    key={workout.id}
                    className="bg-secondary/20 rounded-xl p-3 flex items-center justify-between border border-secondary hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/20 rounded-full p-2">
                        <Dumbbell className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{workout.exercises?.name}</p>
                        <p className="text-xs text-muted-foreground">{workout.sets.length} sets</p>
                      </div>
                    </div>
                    <div className="text-green-400 font-bold text-sm">+{workout.total_xp_earned} XP</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Start Workout Button */}
          <Button 
            className="w-full h-16 text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-shadow animate-fade-in"
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
