import { useState } from "react";
import { X, Plus, Minus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";

const Workout = () => {
  const navigate = useNavigate();
  const [sets, setSets] = useState([
    { id: 1, reps: 10 },
    { id: 2, reps: 8 },
    { id: 3, reps: 6 },
  ]);

  const dailyChallenge = {
    title: "Daily Challenge",
    description: "Complete 5 sets of Barbell Bench Press to earn extra XP!",
    reward: 200,
    completed: 3,
    total: 5,
  };

  const updateReps = (id: number, delta: number) => {
    setSets(sets.map(set => 
      set.id === id ? { ...set, reps: Math.max(0, set.reps + delta) } : set
    ));
  };

  const addSet = () => {
    setSets([...sets, { id: sets.length + 1, reps: 8 }]);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Workout</h1>
          <button onClick={() => navigate('/profile')}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Daily Challenge Card */}
        <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 border-2 border-yellow-600/50 rounded-3xl p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-yellow-400 text-xl font-bold">{dailyChallenge.title}</h2>
            <span className="text-yellow-400 font-bold text-lg">{dailyChallenge.reward} XP</span>
          </div>
          <p className="text-foreground/80 mb-4">{dailyChallenge.description}</p>
          <Progress 
            value={(dailyChallenge.completed / dailyChallenge.total) * 100} 
            className="h-3 mb-2"
          />
          <p className="text-sm text-muted-foreground text-right">
            {dailyChallenge.completed}/{dailyChallenge.total} Sets Completed
          </p>
        </div>

        {/* Exercise Section */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Exercise</h3>
          <div className="bg-secondary/30 rounded-2xl p-4">
            <Input
              value="Barbell Bench Press"
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
              <span className="text-2xl font-bold">15 XP</span>
            </div>
          </div>
        </div>

        {/* Log Workout Button */}
        <Button 
          className="w-full h-14 text-lg font-bold rounded-full"
          size="lg"
        >
          Log Workout
        </Button>
      </div>

      <BottomNav active="workout" />
    </div>
  );
};

export default Workout;
