import { useState, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, TrendingUp, Dumbbell } from "lucide-react";
import { format } from "date-fns";

const History = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWorkouts();
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
        .limit(20);

      if (error) throw error;
      setWorkouts(data || []);
    } catch (error: any) {
      // Error handled silently - user sees empty state
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-8">History</h1>
          
          {loading ? (
            <div className="flex items-center justify-center h-[60vh]">
              <div className="animate-pulse text-primary text-lg">Loading...</div>
            </div>
          ) : workouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="bg-primary/10 rounded-full p-6 mb-4">
                <Calendar className="w-16 h-16 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Your Workout Journey</h2>
              <p className="text-muted-foreground max-w-sm">
                Start logging workouts to track your progress and watch your XP grow!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {workouts.map((workout) => (
                <div key={workout.id} className="bg-secondary/30 rounded-2xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/20 rounded-full p-3">
                        <Dumbbell className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{workout.exercises?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(workout.completed_at), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-green-400">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-bold">{workout.total_xp_earned} XP</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {workout.sets.map((set: any, idx: number) => (
                      <span key={idx} className="text-xs bg-primary/10 px-3 py-1 rounded-full">
                        Set {idx + 1}: {set.reps} reps
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <BottomNav active="history" />
      </div>
    </ProtectedRoute>
  );
};

export default History;
