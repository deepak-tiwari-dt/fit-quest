import { useState, useEffect } from "react";
import { X, Plus, Minus, TrendingUp, ChevronRight, Timer, Search, Dumbbell, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WorkoutTimer } from "@/components/WorkoutTimer";

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
  const [allExercises, setAllExercises] = useState<any[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showWorkoutTimer, setShowWorkoutTimer] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAllExercises();
      fetchDailyChallenge();
    }
  }, [user]);

  const fetchAllExercises = async () => {
    try {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .order("name");

      if (error) throw error;
      const exercises = data || [];
      setAllExercises(exercises);
      setFilteredExercises(exercises);
    } catch (error: any) {
      // Error handled silently - empty exercise list shown
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredExercises(allExercises);
    } else {
      const filtered = allExercises.filter(ex =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredExercises(filtered);
    }
  }, [searchQuery, allExercises]);

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
        // Get all exercises and select one based on the day
        const { data: exercises } = await supabase
          .from("exercises")
          .select("*");

        if (exercises && exercises.length > 0) {
          // Use day of year to deterministically select an exercise
          const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
          const selectedExercise = exercises[dayOfYear % exercises.length];

          const { data: newChallenge, error: createError } = await supabase
            .from("daily_challenges")
            .insert({
              user_id: user?.id,
              exercise_id: selectedExercise.id,
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
      if (challenge?.exercises && !exercise) {
        setExercise(challenge.exercises);
      }
    } catch (error: any) {
      // Error handled silently - no daily challenge shown
    }
  };

  const selectExercise = (selectedExercise: any) => {
    setExercise(selectedExercise);
    setShowExerciseSelector(false);
  };

  const updateReps = (id: number, delta: number) => {
    setSets(sets => {
      const updatedSets = sets.map(set => 
        set.id === id ? { ...set, reps: set.reps + delta } : set
      ).filter(set => set.reps > 0);
      return updatedSets;
    });
  };

  const removeSet = (id: number) => {
    setSets(sets.filter(set => set.id !== id));
  };

  const addSet = () => {
    const maxId = sets.length > 0 ? Math.max(...sets.map(s => s.id)) : 0;
    setSets([...sets, { id: maxId + 1, reps: 8 }]);
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-20">
      <div className="p-6">
        {/* Header - Enhanced */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Workout
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Build your strength</p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="bg-secondary/30 hover:bg-secondary/50 rounded-full p-3 transition-all duration-300 hover:scale-110"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Exercise Selector Modal - Enhanced */}
        {showExerciseSelector && (
          <div className="fixed inset-0 bg-background/98 backdrop-blur-sm z-50 p-6 overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold">Select Exercise</h2>
                <p className="text-sm text-muted-foreground mt-1">{filteredExercises.length} exercises available</p>
              </div>
              <button 
                onClick={() => {
                  setShowExerciseSelector(false);
                  setSearchQuery("");
                }}
                className="bg-secondary/30 hover:bg-secondary/50 rounded-full p-3 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg rounded-2xl bg-secondary/30 border-border focus:border-primary"
              />
            </div>

            {/* Exercise List */}
            <div className="space-y-3 pb-6">
              {filteredExercises.length === 0 ? (
                <div className="text-center py-12">
                  <Dumbbell className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No exercises found</p>
                </div>
              ) : (
                filteredExercises.map((ex, index) => (
                  <button
                    key={ex.id}
                    onClick={() => {
                      selectExercise(ex);
                      setSearchQuery("");
                    }}
                    className="group w-full bg-gradient-to-r from-secondary/40 to-secondary/20 rounded-2xl p-5 flex items-center justify-between hover:from-secondary/60 hover:to-secondary/40 transition-all duration-300 border border-border hover:border-primary/50 shadow-sm hover:shadow-md animate-fade-in"
                    style={{ animationDelay: `${index * 0.02}s` }}
                  >
                    <div className="text-left flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="bg-primary/20 rounded-lg p-2 group-hover:scale-110 transition-transform">
                          <Dumbbell className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="font-bold text-lg">{ex.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground ml-10">{ex.description}</p>
                      <div className="flex items-center gap-1 ml-10 mt-2">
                        <Zap className="w-4 h-4 text-primary" />
                        <p className="text-xs font-semibold text-primary">{ex.xp_per_set} XP per set</p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Daily Challenge Card - Enhanced */}
        {dailyChallenge && exercise?.id === dailyChallenge.exercise_id && (
          <div className="relative overflow-hidden bg-gradient-to-br from-yellow-600/30 via-yellow-600/20 to-yellow-700/10 border-2 border-yellow-600/40 rounded-3xl p-6 mb-8 animate-fade-in shadow-lg">
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/20 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-600/40 rounded-2xl p-3">
                    <Zap className="w-6 h-6 text-yellow-300" />
                  </div>
                  <h2 className="text-yellow-300 text-xl font-bold">Daily Challenge</h2>
                </div>
                <div className="bg-yellow-600/40 px-4 py-2 rounded-full">
                  <span className="text-yellow-300 font-bold text-lg">+{dailyChallenge.xp_reward} XP</span>
                </div>
              </div>
              <p className="text-foreground/90 mb-4 font-medium">
                Complete {dailyChallenge.target_sets} sets of {exercise?.name}
              </p>
              <div className="space-y-2">
                <Progress 
                  value={(dailyChallenge.completed_sets / dailyChallenge.target_sets) * 100} 
                  className="h-3 bg-yellow-900/30"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground/70">Progress</span>
                  <span className="text-sm font-bold text-yellow-300">
                    {dailyChallenge.completed_sets}/{dailyChallenge.target_sets} Sets
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exercise Section - Enhanced */}
        <div className="mb-8 animate-fade-in">
          <h3 className="text-xl font-bold mb-4">Exercise</h3>
          <button
            onClick={() => setShowExerciseSelector(true)}
            className="group w-full bg-gradient-to-r from-secondary/40 to-secondary/20 rounded-2xl p-5 flex items-center justify-between hover:from-secondary/60 hover:to-secondary/40 transition-all duration-300 border border-border hover:border-primary/50 shadow-sm hover:shadow-md"
          >
            <div className="text-left flex-1">
              <div className="flex items-center gap-3 mb-1">
                <div className="bg-primary/20 rounded-lg p-2 group-hover:scale-110 transition-transform">
                  <Dumbbell className="w-5 h-5 text-primary" />
                </div>
                <p className="text-lg font-bold">{exercise?.name || "Select Exercise"}</p>
              </div>
              {exercise?.description && (
                <p className="text-sm text-muted-foreground ml-11">{exercise.description}</p>
              )}
              {exercise?.xp_per_set && (
                <div className="flex items-center gap-1 ml-11 mt-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <p className="text-xs font-semibold text-primary">{exercise.xp_per_set} XP per set</p>
                </div>
              )}
            </div>
            <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Sets Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Sets</h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSets([
                  { id: 1, reps: 12 },
                  { id: 2, reps: 10 },
                  { id: 3, reps: 8 },
                ])}
                className="text-xs"
              >
                Light (12-10-8)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSets([
                  { id: 1, reps: 10 },
                  { id: 2, reps: 8 },
                  { id: 3, reps: 6 },
                  { id: 4, reps: 6 },
                ])}
                className="text-xs"
              >
                Standard (10-8-6-6)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSets([
                  { id: 1, reps: 5 },
                  { id: 2, reps: 5 },
                  { id: 3, reps: 5 },
                  { id: 4, reps: 5 },
                  { id: 5, reps: 5 },
                ])}
                className="text-xs"
              >
                Heavy (5x5)
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            {sets.map((set, index) => (
              <div key={set.id} className="bg-secondary/30 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/20 text-primary rounded-full w-12 h-12 flex items-center justify-center font-bold">
                    {index + 1}
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
                  <Button
                    size="icon"
                    variant="destructive"
                    className="rounded-full w-10 h-10"
                    onClick={() => removeSet(set.id)}
                  >
                    <X className="w-5 h-5" />
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

        {/* Timer Section */}
        <div className="mb-8 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => {
                setShowWorkoutTimer(!showWorkoutTimer);
                if (!showWorkoutTimer) setShowRestTimer(false);
              }}
              variant={showWorkoutTimer ? "default" : "secondary"}
              className="h-12 text-sm font-bold rounded-full"
            >
              <Timer className="w-5 h-5 mr-2" />
              Workout Timer
            </Button>
            <Button
              onClick={() => {
                setShowRestTimer(!showRestTimer);
                if (!showRestTimer) setShowWorkoutTimer(false);
              }}
              variant={showRestTimer ? "default" : "secondary"}
              className="h-12 text-sm font-bold rounded-full"
            >
              <Timer className="w-5 h-5 mr-2" />
              Rest Timer
            </Button>
          </div>
          {showWorkoutTimer && (
            <div className="space-y-2">
              <WorkoutTimer 
                duration={1800}
                label="Workout Timer"
                onComplete={() => {
                  toast({
                    title: "Workout time complete!",
                    description: "Great job! Time to wrap up.",
                  });
                  setShowWorkoutTimer(false);
                }}
              />
            </div>
          )}
          {showRestTimer && (
            <div className="space-y-2">
              <WorkoutTimer 
                duration={60}
                label="Rest Timer"
                onComplete={() => {
                  toast({
                    title: "Rest complete!",
                    description: "Time for your next set!",
                  });
                  setShowRestTimer(false);
                }}
              />
            </div>
          )}
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

        {/* Log Workout Button - Enhanced */}
        <Button 
          className="w-full h-16 text-lg font-bold rounded-full shadow-2xl hover:shadow-primary/50 transition-all duration-300 relative overflow-hidden group"
          size="lg"
          onClick={handleLogWorkout}
          disabled={loading || !exercise}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <TrendingUp className="w-6 h-6 mr-2 group-hover:scale-110 transition-transform" />
          {loading ? "Logging..." : "Log Workout"}
        </Button>
      </div>

      <BottomNav active="workout" />
    </div>
  );
};

export default Workout;
