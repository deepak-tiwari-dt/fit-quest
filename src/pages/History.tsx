import { useState, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, TrendingUp, Dumbbell, Trophy } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";

const History = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        .limit(20);

      if (error) throw error;
      setWorkouts(data || []);
    } catch (error: any) {
      console.error("Error fetching workouts:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <h1 className="text-3xl font-bold mb-6">Workout History</h1>
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-primary text-lg">Loading your workouts...</div>
          </div>
        </div>
        <BottomNav active="history" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Workout History</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-5 h-5" />
            <span className="text-sm">{workouts.length} workouts</span>
          </div>
        </div>

        {workouts.length === 0 ? (
          <Card className="bg-secondary/20 border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Dumbbell className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Workouts Yet</h3>
              <p className="text-muted-foreground text-center">
                Start your first workout to see your history here!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {workouts.map((workout) => (
              <Card key={workout.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Dumbbell className="w-5 h-5 text-primary" />
                        <h3 className="text-xl font-bold">
                          {workout.exercises?.name || "Unknown Exercise"}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(workout.completed_at), "MMM dd, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span className="font-bold text-primary">{workout.total_xp_earned} XP</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-semibold text-muted-foreground">
                        Sets Completed
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {Array.isArray(workout.sets) && workout.sets.map((set: any, index: number) => (
                        <div
                          key={set.id || index}
                          className="bg-secondary rounded-lg p-2 text-center"
                        >
                          <div className="text-xs text-muted-foreground">Set {index + 1}</div>
                          <div className="text-lg font-bold">{set.reps}</div>
                          <div className="text-xs text-muted-foreground">reps</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <BottomNav active="history" />
    </div>
  );
};

export default History;
