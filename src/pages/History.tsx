import { useState, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { WorkoutCalendar } from "@/components/WorkoutCalendar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, TrendingUp, Dumbbell, Trophy, Award, Flame, BarChart3 } from "lucide-react";
import { format, isToday, isYesterday, startOfWeek, endOfWeek } from "date-fns";
import { useNavigate } from "react-router-dom";

const History = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    thisWeek: 0,
    totalSets: 0,
    totalXp: 0,
  });

  useEffect(() => {
    if (user) {
      fetchWorkouts();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from("workouts")
        .select(`
          *,
          exercises (name)
        `)
        .eq("user_id", user?.id)
        .order("completed_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const workoutData = data || [];
      setWorkouts(workoutData);

      // Calculate stats
      const weekStart = startOfWeek(new Date());
      const weekEnd = endOfWeek(new Date());
      const thisWeekWorkouts = workoutData.filter(w => {
        const workoutDate = new Date(w.completed_at);
        return workoutDate >= weekStart && workoutDate <= weekEnd;
      });

      const totalSets = workoutData.reduce((acc, w) => acc + (Array.isArray(w.sets) ? w.sets.length : 0), 0);
      const totalXp = workoutData.reduce((acc, w) => acc + (w.total_xp_earned || 0), 0);

      setStats({
        thisWeek: thisWeekWorkouts.length,
        totalSets,
        totalXp,
      });
    } catch (error: any) {
      console.error("Error fetching workouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEEE, MMM dd");
  };

  const groupWorkoutsByDate = () => {
    const grouped: { [key: string]: any[] } = {};
    workouts.forEach(workout => {
      const dateKey = format(new Date(workout.completed_at), "yyyy-MM-dd");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(workout);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-6">
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground">Loading history...</p>
            </div>
          </div>
        </div>
        <BottomNav active="history" />
      </div>
    );
  }

  const groupedWorkouts = groupWorkoutsByDate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Workout History</h1>
              <p className="text-muted-foreground">Track your fitness journey</p>
            </div>
            <button
              onClick={() => navigate('/analytics')}
              className="bg-primary/10 hover:bg-primary/20 text-primary rounded-full p-3 transition-colors"
            >
              <BarChart3 className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        {workouts.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl p-4 border border-primary/20">
              <div className="flex items-center justify-center mb-2">
                <Flame className="w-5 h-5 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.thisWeek}</p>
                <p className="text-xs text-muted-foreground mt-1">This Week</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-secondary/30 to-secondary/20 rounded-2xl p-4 border border-border">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-foreground" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.totalSets}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Sets</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-700/10 rounded-2xl p-4 border border-yellow-600/20">
              <div className="flex items-center justify-center mb-2">
                <Award className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.totalXp}</p>
                <p className="text-xs text-muted-foreground mt-1">Total XP</p>
              </div>
            </div>
          </div>
        )}

        {/* Workout Calendar */}
        {workouts.length > 0 && <WorkoutCalendar workouts={workouts} />}

        {/* Workout History */}
        {workouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="bg-secondary/30 rounded-full p-8 mb-6">
              <Dumbbell className="w-16 h-16 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No Workouts Yet</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Start your fitness journey today! Your workout history will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedWorkouts).map(([dateKey, dayWorkouts]) => {
              const date = new Date(dateKey);
              return (
                <div key={dateKey}>
                  {/* Date Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 bg-secondary/30 rounded-full px-4 py-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">{getDateLabel(date)}</span>
                    </div>
                    <div className="h-px bg-border flex-1" />
                  </div>

                  {/* Workouts for this date */}
                  <div className="space-y-3">
                    {dayWorkouts.map((workout) => (
                      <div
                        key={workout.id}
                        className="bg-secondary/20 rounded-2xl p-5 border border-border hover:border-primary/30 transition-all hover:bg-secondary/30"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="bg-primary/20 text-primary rounded-full p-2">
                                <Dumbbell className="w-4 h-4" />
                              </div>
                              <h3 className="text-lg font-bold">
                                {workout.exercises?.name || "Unknown Exercise"}
                              </h3>
                            </div>
                            <p className="text-sm text-muted-foreground ml-10">
                              {format(new Date(workout.completed_at), "h:mm a")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 bg-primary/10 rounded-full px-3 py-1.5">
                            <Trophy className="w-4 h-4 text-primary" />
                            <span className="font-bold text-primary text-sm">+{workout.total_xp_earned}</span>
                          </div>
                        </div>

                        {/* Sets Display */}
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(workout.sets) && workout.sets.map((set: any, index: number) => (
                            <div
                              key={set.id || index}
                              className="bg-background/50 rounded-lg px-3 py-2 border border-border"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground">Set {index + 1}:</span>
                                <span className="text-sm font-bold">{set.reps}</span>
                                <span className="text-xs text-muted-foreground">reps</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav active="history" />
    </div>
  );
};

export default History;
