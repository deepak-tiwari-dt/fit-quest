import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, TrendingUp, Calendar, Trophy, Zap, Target, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BottomNav } from "@/components/BottomNav";
import { InstallBanner } from "@/components/InstallBanner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WeeklyGoal } from "@/components/WeeklyGoal";
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
    <>
      <InstallBanner />
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-20">
        <div className="p-6">
          {/* Header with Gradient */}
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
                  Welcome back!
                </h1>
                <p className="text-lg text-muted-foreground">{profile.username}</p>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <div className="bg-primary/10 rounded-full p-4 animate-pulse">
                  <Trophy className="w-8 h-8 text-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Level Card - Enhanced */}
          <div className="relative overflow-hidden bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 rounded-3xl p-6 mb-6 border-2 border-primary/30 animate-scale-in shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping" />
                    <div className="relative bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full w-20 h-20 flex items-center justify-center font-bold text-3xl shadow-lg">
                      {profile.level}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Level {profile.level}</h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Zap className="w-4 h-4 text-primary" />
                      {profile.total_xp.toLocaleString()} Total XP
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress to Level {profile.level + 1}</span>
                  <span className="font-bold text-primary">{Math.round((currentLevelXp / xpForNextLevel) * 100)}%</span>
                </div>
                <div className="relative">
                  <Progress value={(currentLevelXp / xpForNextLevel) * 100} className="h-4 bg-primary/10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  {currentLevelXp.toLocaleString()}/{xpForNextLevel.toLocaleString()} XP
                </p>
              </div>
            </div>
          </div>

          {/* Daily Challenge - Enhanced */}
          {dailyChallenge && (
            <div className="relative overflow-hidden bg-gradient-to-br from-accent/20 via-accent/15 to-accent/10 border-2 border-accent/30 rounded-3xl p-6 mb-6 animate-fade-in shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 left-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-accent/30 rounded-2xl p-3 shadow-lg">
                      <Target className="w-7 h-7 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-accent mb-1">Daily Challenge</h3>
                      <p className="text-sm text-foreground/90 font-medium">{dailyChallenge.exercises?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-accent/30 px-4 py-2 rounded-full shadow-md">
                    <Zap className="w-5 h-5 text-accent" />
                    <span className="text-accent font-bold text-lg">{dailyChallenge.xp_reward}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Progress 
                    value={(dailyChallenge.completed_sets / dailyChallenge.target_sets) * 100} 
                    className="h-3 bg-accent/10"
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Complete {dailyChallenge.target_sets} sets</span>
                    <span className="font-bold text-accent">
                      {dailyChallenge.completed_sets}/{dailyChallenge.target_sets} Sets
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Weekly Goal */}
          <div className="mb-6">
            <WeeklyGoal workouts={recentWorkouts} />
          </div>

          {/* Quick Stats Grid - Enhanced */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="group relative overflow-hidden bg-gradient-to-br from-card/80 to-card/40 rounded-2xl p-5 animate-fade-in border border-border hover:border-primary/50 transition-all duration-300 shadow-md hover:shadow-lg">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-primary/20 rounded-full p-2.5 group-hover:scale-110 transition-transform">
                    <Dumbbell className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">Workouts</span>
                </div>
                <p className="text-4xl font-bold group-hover:scale-105 transition-transform">{profile.total_workouts}</p>
                <p className="text-xs text-muted-foreground mt-1">Total completed</p>
              </div>
            </div>
            
            <div className="group relative overflow-hidden bg-gradient-to-br from-card/80 to-card/40 rounded-2xl p-5 animate-fade-in border border-border hover:border-accent/50 transition-all duration-300 shadow-md hover:shadow-lg">
              <div className="absolute top-0 right-0 w-20 h-20 bg-accent/10 rounded-full blur-2xl group-hover:bg-accent/20 transition-colors" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-accent/20 rounded-full p-2.5 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">Streak</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold group-hover:scale-105 transition-transform">{profile.weekly_streak}</p>
                  <span className="text-2xl">🔥</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Week streak</p>
              </div>
            </div>
          </div>

          {/* Recent Activity - Enhanced */}
          {recentWorkouts.length > 0 && (
            <div className="mb-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Recent Activity</h3>
                <button 
                  onClick={() => navigate('/history')}
                  className="text-sm text-primary font-semibold hover:text-primary/80 flex items-center gap-1 transition-colors"
                >
                  View All
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {recentWorkouts.map((workout, idx) => (
                  <div
                    key={workout.id}
                    className="group bg-gradient-to-r from-card/60 to-card/30 rounded-2xl p-4 flex items-center justify-between border border-border hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/20 rounded-full p-3 group-hover:scale-110 group-hover:bg-primary/30 transition-all">
                        <Dumbbell className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{workout.exercises?.name}</p>
                        <p className="text-xs text-muted-foreground">{workout.sets.length} sets completed</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-primary/20 px-3 py-1.5 rounded-full group-hover:bg-primary/30 transition-colors">
                      <Zap className="w-4 h-4 text-primary" />
                      <span className="text-primary font-bold text-sm">+{workout.total_xp_earned}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Start Workout Button - Enhanced */}
          <Button 
            className="w-full h-16 text-lg font-bold rounded-full shadow-2xl hover:shadow-primary/50 transition-all duration-300 animate-fade-in relative overflow-hidden group"
            size="lg"
            onClick={() => navigate('/workout')}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <Dumbbell className="w-6 h-6 mr-2 group-hover:rotate-12 transition-transform" />
            Start Workout
          </Button>
        </div>

        <BottomNav active="home" />
      </div>
    </>
  );
};

export default Index;
