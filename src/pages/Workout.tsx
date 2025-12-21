import { useState, useEffect } from "react";
import { X, Plus, Minus, TrendingUp, ChevronRight, Timer, Search, Dumbbell, Zap, Bike, Footprints, Waves, Mountain, Music, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WorkoutTimer } from "@/components/WorkoutTimer";

// Helper function to get exercise icon based on name
const getExerciseIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('walk') || lowerName.includes('run') || lowerName.includes('jog') || lowerName.includes('sprint') || lowerName.includes('stair')) {
    return Footprints;
  }
  if (lowerName.includes('cycling') || lowerName.includes('bike') || lowerName.includes('spin')) {
    return Bike;
  }
  if (lowerName.includes('swim') || lowerName.includes('water') || lowerName.includes('kayak') || lowerName.includes('paddle') || lowerName.includes('row')) {
    return Waves;
  }
  if (lowerName.includes('hik') || lowerName.includes('climb') || lowerName.includes('trail') || lowerName.includes('ski') || lowerName.includes('snow')) {
    return Mountain;
  }
  if (lowerName.includes('yoga') || lowerName.includes('pilates') || lowerName.includes('tai chi') || lowerName.includes('stretch') || lowerName.includes('qigong')) {
    return Heart;
  }
  if (lowerName.includes('dance') || lowerName.includes('zumba') || lowerName.includes('aerobic') || lowerName.includes('ballet') || lowerName.includes('hip hop')) {
    return Music;
  }
  return Dumbbell;
};

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
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showWorkoutTimer, setShowWorkoutTimer] = useState(false);
  const [loading, setLoading] = useState(false);

  const categories = [
    { name: "All", icon: Dumbbell },
    { name: "Cardio", icon: Footprints },
    { name: "Strength", icon: Dumbbell },
    { name: "Flexibility", icon: Heart },
    { name: "Sports", icon: Bike },
  ];

  const getExerciseCategory = (name: string): string => {
    const lowerName = name.toLowerCase();
    // Cardio exercises
    if (lowerName.includes('walk') || lowerName.includes('run') || lowerName.includes('jog') || 
        lowerName.includes('sprint') || lowerName.includes('cycling') || lowerName.includes('bike') ||
        lowerName.includes('swim') || lowerName.includes('jump') || lowerName.includes('aerobic') ||
        lowerName.includes('cardio') || lowerName.includes('hiit') || lowerName.includes('dance') ||
        lowerName.includes('zumba') || lowerName.includes('stair') || lowerName.includes('skip') ||
        lowerName.includes('rope')) {
      return "Cardio";
    }
    // Flexibility exercises
    if (lowerName.includes('yoga') || lowerName.includes('pilates') || lowerName.includes('stretch') ||
        lowerName.includes('tai chi') || lowerName.includes('qigong') || lowerName.includes('flexibility') ||
        lowerName.includes('mobility')) {
      return "Flexibility";
    }
    // Sports exercises
    if (lowerName.includes('basketball') || lowerName.includes('soccer') || lowerName.includes('football') ||
        lowerName.includes('tennis') || lowerName.includes('golf') || lowerName.includes('hockey') ||
        lowerName.includes('volleyball') || lowerName.includes('baseball') || lowerName.includes('martial') ||
        lowerName.includes('boxing') || lowerName.includes('kickbox') || lowerName.includes('hik') ||
        lowerName.includes('climb') || lowerName.includes('ski') || lowerName.includes('snowboard') ||
        lowerName.includes('surf') || lowerName.includes('kayak') || lowerName.includes('row')) {
      return "Sports";
    }
    // Default to Strength
    return "Strength";
  };

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
    let filtered = allExercises;
    
    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(ex => getExerciseCategory(ex.name) === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredExercises(filtered);
  }, [searchQuery, selectedCategory, allExercises]);

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
                  setSelectedCategory("All");
                }}
                className="bg-secondary/30 hover:bg-secondary/50 rounded-full p-3 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg rounded-2xl bg-secondary/30 border-border focus:border-primary"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => {
                const CategoryIcon = category.icon;
                const isActive = selectedCategory === category.name;
                return (
                  <button
                    key={category.name}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all duration-300 border ${
                      isActive 
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25" 
                        : "bg-secondary/30 text-muted-foreground border-border hover:bg-secondary/50 hover:text-foreground"
                    }`}
                  >
                    <CategoryIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">{category.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Exercise List */}
            <div className="space-y-3 pb-6">
              {filteredExercises.length === 0 ? (
                <div className="text-center py-12">
                  <Dumbbell className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No exercises found</p>
                </div>
              ) : (
                filteredExercises.map((ex, index) => {
                  const ExerciseIcon = getExerciseIcon(ex.name);
                  return (
                    <button
                      key={ex.id}
                      onClick={() => {
                        selectExercise(ex);
                        setSearchQuery("");
                      }}
                      className="group w-full bg-gradient-to-r from-card/80 to-card/40 rounded-2xl p-4 flex items-center justify-between hover:from-primary/20 hover:to-primary/10 transition-all duration-300 border border-border hover:border-primary/50 shadow-sm hover:shadow-lg animate-fade-in"
                      style={{ animationDelay: `${Math.min(index * 0.02, 0.5)}s` }}
                    >
                      <div className="text-left flex-1 flex items-center gap-4">
                        <div className="bg-primary/20 rounded-xl p-3 group-hover:scale-110 group-hover:bg-primary/30 transition-all">
                          <ExerciseIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-base">{ex.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">{ex.description}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Zap className="w-3 h-3 text-accent" />
                            <p className="text-xs font-semibold text-accent">{ex.xp_per_set} XP/set</p>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Daily Challenge Card - Enhanced */}
        {dailyChallenge && exercise?.id === dailyChallenge.exercise_id && (
          <div className="relative overflow-hidden bg-gradient-to-br from-accent/30 via-accent/20 to-accent/10 border-2 border-accent/40 rounded-3xl p-6 mb-8 animate-fade-in shadow-lg">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/20 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-accent/40 rounded-2xl p-3">
                    <Zap className="w-6 h-6 text-accent" />
                  </div>
                  <h2 className="text-accent text-xl font-bold">Daily Challenge</h2>
                </div>
                <div className="bg-accent/40 px-4 py-2 rounded-full">
                  <span className="text-accent-foreground font-bold text-lg">+{dailyChallenge.xp_reward} XP</span>
                </div>
              </div>
              <p className="text-foreground/90 mb-4 font-medium">
                Complete {dailyChallenge.target_sets} sets of {exercise?.name}
              </p>
              <div className="space-y-2">
                <Progress 
                  value={(dailyChallenge.completed_sets / dailyChallenge.target_sets) * 100} 
                  className="h-3 bg-accent/20"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground/70">Progress</span>
                  <span className="text-sm font-bold text-accent">
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
          {(() => {
            const ExerciseIcon = exercise ? getExerciseIcon(exercise.name) : Dumbbell;
            return (
              <button
                onClick={() => setShowExerciseSelector(true)}
                className="group w-full bg-gradient-to-r from-card/80 to-card/40 rounded-2xl p-5 flex items-center justify-between hover:from-primary/20 hover:to-primary/10 transition-all duration-300 border border-border hover:border-primary/50 shadow-sm hover:shadow-lg"
              >
                <div className="text-left flex-1 flex items-center gap-4">
                  <div className="bg-primary/20 rounded-xl p-3 group-hover:scale-110 group-hover:bg-primary/30 transition-all">
                    <ExerciseIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{exercise?.name || "Select Exercise"}</p>
                    {exercise?.description && (
                      <p className="text-sm text-muted-foreground">{exercise.description}</p>
                    )}
                    {exercise?.xp_per_set && (
                      <div className="flex items-center gap-1 mt-1">
                        <Zap className="w-4 h-4 text-accent" />
                        <p className="text-xs font-semibold text-accent">{exercise.xp_per_set} XP per set</p>
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
              </button>
            );
          })()}
        </div>

        {/* Sets Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Sets</h3>
            <div className="flex gap-2 flex-wrap justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSets([
                  { id: 1, reps: 12 },
                  { id: 2, reps: 10 },
                  { id: 3, reps: 8 },
                ])}
                className="text-xs rounded-full px-3 h-8 hover:bg-primary/20 hover:text-primary hover:border-primary/50"
              >
                Light
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
                className="text-xs rounded-full px-3 h-8 hover:bg-primary/20 hover:text-primary hover:border-primary/50"
              >
                Standard
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
                className="text-xs rounded-full px-3 h-8 hover:bg-primary/20 hover:text-primary hover:border-primary/50"
              >
                Heavy
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            {sets.map((set, index) => (
              <div 
                key={set.id} 
                className="bg-gradient-to-r from-card/80 to-card/40 rounded-2xl p-4 flex items-center justify-between border border-border animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-primary/20 text-primary rounded-xl w-12 h-12 flex items-center justify-center font-bold text-lg">
                    {index + 1}
                  </div>
                  <span className="font-medium text-muted-foreground">Reps</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full w-9 h-9 hover:bg-primary/20 hover:text-primary"
                    onClick={() => updateReps(set.id, -1)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-2xl font-bold w-10 text-center">{set.reps}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full w-9 h-9 hover:bg-primary/20 hover:text-primary"
                    onClick={() => updateReps(set.id, 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full w-9 h-9 hover:bg-destructive/20 hover:text-destructive ml-2"
                    onClick={() => removeSet(set.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            <button
              onClick={addSet}
              className="w-full border-2 border-dashed border-primary/30 rounded-2xl p-5 flex items-center justify-center gap-2 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all"
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
        <div className="bg-gradient-to-r from-secondary/40 to-secondary/20 rounded-2xl p-6 mb-8 border border-border">
          <h3 className="text-xl font-bold mb-4">Estimated XP</h3>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">You'll earn</span>
            <div className="flex items-center gap-2 text-primary">
              <TrendingUp className="w-5 h-5" />
              <span className="text-2xl font-bold">+{estimatedXp} XP</span>
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
