import { useState, useEffect } from "react";
import { Target, Plus, Minus, Check, Edit2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { startOfWeek, endOfWeek } from "date-fns";

interface WeeklyGoalProps {
  workouts: any[];
}

export const WeeklyGoal = ({ workouts }: WeeklyGoalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [targetWorkouts, setTargetWorkouts] = useState(3);
  const [isEditing, setIsEditing] = useState(false);
  const [tempTarget, setTempTarget] = useState(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Calculate this week's workouts
  const thisWeekWorkouts = workouts.filter((w) => {
    const workoutDate = new Date(w.completed_at);
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
    return workoutDate >= weekStart && workoutDate <= weekEnd;
  }).length;

  const progress = Math.min((thisWeekWorkouts / targetWorkouts) * 100, 100);
  const isGoalMet = thisWeekWorkouts >= targetWorkouts;

  useEffect(() => {
    if (user) {
      fetchGoal();
    }
  }, [user]);

  const fetchGoal = async () => {
    try {
      const { data, error } = await supabase
        .from("weekly_goals")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setTargetWorkouts(data.target_workouts);
        setTempTarget(data.target_workouts);
      }
    } catch (error: any) {
      console.error("Error fetching goal:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveGoal = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { data: existing } = await supabase
        .from("weekly_goals")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("weekly_goals")
          .update({ target_workouts: tempTarget })
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("weekly_goals")
          .insert({ user_id: user.id, target_workouts: tempTarget });
        if (error) throw error;
      }

      setTargetWorkouts(tempTarget);
      setIsEditing(false);
      toast({
        title: "Goal Updated",
        description: `Your weekly goal is now ${tempTarget} workouts`,
      });
    } catch (error: any) {
      toast({
        title: "Error saving goal",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-5 border border-border animate-pulse">
        <div className="h-24 bg-secondary/30 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-card via-card to-accent/5 rounded-2xl p-5 border border-border shadow-lg animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-accent/30 to-accent/10">
            <Target className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Weekly Goal</h3>
            <p className="text-xs text-muted-foreground">This week's progress</p>
          </div>
        </div>
        {!isEditing && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setTempTarget(targetWorkouts);
              setIsEditing(true);
            }}
          >
            <Edit2 className="w-4 h-4 text-muted-foreground" />
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => setTempTarget(Math.max(1, tempTarget - 1))}
              disabled={tempTarget <= 1}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <div className="text-center">
              <span className="text-4xl font-bold text-foreground">{tempTarget}</span>
              <p className="text-xs text-muted-foreground mt-1">workouts/week</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => setTempTarget(Math.min(14, tempTarget + 1))}
              disabled={tempTarget >= 14}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={saveGoal}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Goal"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Progress Display */}
          <div className="flex items-end justify-between mb-2">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">{thisWeekWorkouts}</span>
              <span className="text-lg text-muted-foreground">/ {targetWorkouts}</span>
            </div>
            {isGoalMet && (
              <div className="flex items-center gap-1 bg-green-500/20 text-green-500 rounded-full px-3 py-1">
                <Trophy className="w-4 h-4" />
                <span className="text-xs font-semibold">Goal Met!</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="relative h-4 bg-secondary/50 rounded-full overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out ${
                isGoalMet 
                  ? "bg-gradient-to-r from-green-500 to-green-400" 
                  : "bg-gradient-to-r from-accent to-accent/70"
              }`}
              style={{ width: `${progress}%` }}
            />
            {/* Progress markers */}
            <div className="absolute inset-0 flex justify-between px-1">
              {Array.from({ length: targetWorkouts }).map((_, i) => (
                <div
                  key={i}
                  className={`w-0.5 h-full ${
                    i < thisWeekWorkouts ? "bg-transparent" : "bg-border/50"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Workout dots */}
          <div className="flex justify-center gap-2 pt-2">
            {Array.from({ length: targetWorkouts }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  i < thisWeekWorkouts
                    ? isGoalMet
                      ? "bg-green-500 shadow-lg shadow-green-500/30"
                      : "bg-accent shadow-lg shadow-accent/30"
                    : "bg-secondary/50 border border-border"
                }`}
              >
                {i < thisWeekWorkouts && (
                  <Check className="w-3 h-3 text-white p-0.5" />
                )}
              </div>
            ))}
          </div>

          {/* Encouragement text */}
          <p className="text-center text-xs text-muted-foreground pt-1">
            {isGoalMet
              ? "🎉 Amazing work! You've crushed your goal!"
              : thisWeekWorkouts === 0
              ? "Start your week strong! 💪"
              : `${targetWorkouts - thisWeekWorkouts} more to reach your goal!`}
          </p>
        </div>
      )}
    </div>
  );
};
