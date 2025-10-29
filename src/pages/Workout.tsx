import { useState, useEffect } from "react";
import { X, Plus, Minus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Workout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sets, setSets] = useState([
    { id: 1, reps: 10 },
    { id: 2, reps: 8 },
    { id: 3, reps: 6 },
  ]);
  const [dailyChallenge, setDailyChallenge] = useState<any>(null);
  const [exercise, setExercise] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDailyChallenge();
    }
  }, [user]);

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
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!challenge) {
        // Create a new daily challenge
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
      setExercise(challenge?.exercises);
    } catch (error: any) {
      console.error("Error fetching daily challenge:", error);
    }
  };

  const updateReps = (id: number, delta: number) => {
    setSets(sets.map(set => 
      set.id === id ? { ...set, reps: Math.max(0, set.reps + delta) } : set
    ));
  };

  const addSet = () => {
    setSets([...sets, { id: sets.length + 1, reps: 8 }]);
  };

  const handleLogWorkout = async () => {
    if (!exercise || !user) return;

    setLoading(true);
    try {
      const totalXp = sets.length * (exercise.xp_per_set || 5);

      // Insert workout
      const { error: workoutError } = await supabase
        .from("workouts")
        .insert({
          user_id: user.id,
          exercise_id: exercise.id,
          sets: sets,
          total_xp_earned: totalXp,
        });

      if (workoutError) throw workoutError;

      // Update profile stats
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        const newTotalXp = profile.total_xp + totalXp;
        const newLevel = Math.floor(newTotalXp / 1000) + 1;

        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            total_xp: newTotalXp,
            level: newLevel,
            total_workouts: profile.total_workouts + 1,
          })
          .eq("id", user.id);

        if (updateError) throw updateError;
      }

      // Update daily challenge
      if (dailyChallenge) {
        const completedSets = Math.min(dailyChallenge.completed_sets + sets.length, dailyChallenge.target_sets);
        const { error: challengeError } = await supabase
          .from("daily_challenges")
          .update({
            completed_sets: completedSets,
            completed: completedSets >= dailyChallenge.target_sets,
          })
          .eq("id", dailyChallenge.id);

        if (challengeError) throw challengeError;
      }

      toast({
        title: "Workout logged!",
        description: `You earned ${totalXp} XP!`,
      });

      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const estimatedXp = sets.length * (exercise?.xp_per_set || 5);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">Workout</h1>
            <button onClick={() => navigate('/')}>
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Daily Challenge Card */}
          {dailyChallenge && (
            <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 border-2 border-yellow-600/50 rounded-3xl p-6 mb-8">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-yellow-400 text-xl font-bold">Daily Challenge</h2>
                <span className="text-yellow-400 font-bold text-lg">{dailyChallenge.xp_reward} XP</span>
              </div>
              <p className="text-foreground/80 mb-4">
                Complete {dailyChallenge.target_sets} sets of {exercise?.name} to earn extra XP!
              </p>
              <Progress 
                value={(dailyChallenge.completed_sets / dailyChallenge.target_sets) * 100} 
                className="h-3 mb-2"
              />
              <p className="text-sm text-muted-foreground text-right">
                {dailyChallenge.completed_sets}/{dailyChallenge.target_sets} Sets Completed
              </p>
            </div>
          )}

          {/* Exercise Section */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Exercise</h3>
            <div className="bg-secondary/30 rounded-2xl p-4">
              <Input
                value={exercise?.name || "Loading..."}
                readOnly
                className="bg-transparent border-0 text-lg font-semibold focus-visible:ring-0"
              />
            </div>
          </div>

          {/* Sets Section */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Sets</h3>
            <div className="space-y-3">
              {sets.map((set) => (
                <div key={set.id} className="bg-secondary/30 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/20 text-primary rounded-full w-12 h-12 flex items-center justify-center font-bold">
                      {set.id}
                    </div>
                    <span className="font-semibold">Reps</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="rounded-full w-10 h-10"
                      onClick={() => updateReps(set.id, -1)}
                    >
                      <Minus className="w-5 h-5" />
                    </Button>
                    <span className="text-2xl font-bold w-12 text-center">{set.reps}</span>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="rounded-full w-10 h-10"
                      onClick={() => updateReps(set.id, 1)}
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <button
                onClick={addSet}
                className="w-full border-2 border-dashed border-primary/30 rounded-2xl p-6 flex items-center justify-center gap-2 text-primary hover:bg-primary/5 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span className="font-semibold">Add Set</span>
              </button>
            </div>
          </div>

          {/* XP Gain */}
          <div className="bg-secondary/30 rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-bold mb-4">XP Gain</h3>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Estimated XP</span>
              <div className="flex items-center gap-2 text-green-400">
                <TrendingUp className="w-5 h-5" />
                <span className="text-2xl font-bold">{estimatedXp} XP</span>
              </div>
            </div>
          </div>

          {/* Log Workout Button */}
          <Button 
            className="w-full h-14 text-lg font-bold rounded-full"
            size="lg"
            onClick={handleLogWorkout}
            disabled={loading}
          >
            {loading ? "Logging..." : "Log Workout"}
          </Button>
        </div>

        <BottomNav active="workout" />
      </div>
    </ProtectedRoute>
  );
};

export default Workout;
