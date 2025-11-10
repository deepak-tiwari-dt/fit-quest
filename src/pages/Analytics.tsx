import { useState, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Award, Target, Flame, Calendar } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [exerciseData, setExerciseData] = useState<any[]>([]);
  const [personalRecords, setPersonalRecords] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      // Fetch all workouts
      const { data: workoutsData, error } = await supabase
        .from("workouts")
        .select(`
          *,
          exercises (name, id)
        `)
        .eq("user_id", user?.id)
        .order("completed_at", { ascending: true });

      if (error) throw error;

      const workoutsList = workoutsData || [];
      setWorkouts(workoutsList);

      // Process progress over time (last 30 days)
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(new Date(), 29 - i);
        return startOfDay(date);
      });

      const dailyProgress = last30Days.map(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        const dayWorkouts = workoutsList.filter(w => 
          format(new Date(w.completed_at), "yyyy-MM-dd") === dateStr
        );
        
        return {
          date: format(date, "MMM dd"),
          workouts: dayWorkouts.length,
          xp: dayWorkouts.reduce((sum, w) => sum + (w.total_xp_earned || 0), 0),
          sets: dayWorkouts.reduce((sum, w) => sum + (Array.isArray(w.sets) ? w.sets.length : 0), 0),
        };
      });

      setProgressData(dailyProgress);

      // Process favorite exercises
      const exerciseMap = new Map();
      workoutsList.forEach(workout => {
        const exerciseName = workout.exercises?.name || "Unknown";
        const exerciseId = workout.exercises?.id;
        if (!exerciseMap.has(exerciseId)) {
          exerciseMap.set(exerciseId, {
            name: exerciseName,
            count: 0,
            totalXp: 0,
            totalSets: 0,
          });
        }
        const exercise = exerciseMap.get(exerciseId);
        exercise.count += 1;
        exercise.totalXp += workout.total_xp_earned || 0;
        exercise.totalSets += Array.isArray(workout.sets) ? workout.sets.length : 0;
      });

      const exerciseStats = Array.from(exerciseMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      setExerciseData(exerciseStats);

      // Calculate personal records
      const records: any[] = [];
      exerciseMap.forEach((stats, exerciseId) => {
        const exerciseWorkouts = workoutsList.filter(w => w.exercises?.id === exerciseId);
        
        // Find max reps in a single set
        let maxReps = 0;
        let maxRepsDate = null;
        exerciseWorkouts.forEach(workout => {
          if (Array.isArray(workout.sets)) {
            workout.sets.forEach((set: any) => {
              if (set.reps > maxReps) {
                maxReps = set.reps;
                maxRepsDate = workout.completed_at;
              }
            });
          }
        });

        // Find max sets in a workout
        let maxSets = 0;
        let maxSetsDate = null;
        exerciseWorkouts.forEach(workout => {
          const setsCount = Array.isArray(workout.sets) ? workout.sets.length : 0;
          if (setsCount > maxSets) {
            maxSets = setsCount;
            maxSetsDate = workout.completed_at;
          }
        });

        if (maxReps > 0) {
          records.push({
            exercise: stats.name,
            type: "Max Reps",
            value: maxReps,
            date: maxRepsDate,
          });
        }
        if (maxSets > 0) {
          records.push({
            exercise: stats.name,
            type: "Most Sets",
            value: maxSets,
            date: maxSetsDate,
          });
        }
      });

      setPersonalRecords(records.slice(0, 8));
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--chart-1))",
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-6">
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          </div>
        </div>
        <BottomNav active="history" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-muted-foreground">Track your progress and achievements</p>
        </div>

        {workouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="bg-secondary/30 rounded-full p-8 mb-6">
              <TrendingUp className="w-16 h-16 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No Data Yet</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Complete some workouts to see your analytics and progress!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Progress Over Time */}
            <div className="bg-secondary/20 rounded-2xl p-6 border border-border">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Progress Over Time</h2>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="workouts" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Workouts"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="xp" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    name="XP Earned"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Favorite Exercises */}
            <div className="bg-secondary/20 rounded-2xl p-6 border border-border">
              <div className="flex items-center gap-2 mb-6">
                <Flame className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Favorite Exercises</h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={exerciseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '11px' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" name="Workouts" radius={[8, 8, 0, 0]}>
                    {exerciseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Exercise Distribution */}
            {exerciseData.length > 0 && (
              <div className="bg-secondary/20 rounded-2xl p-6 border border-border">
                <div className="flex items-center gap-2 mb-6">
                  <Target className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Exercise Distribution</h2>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={exerciseData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {exerciseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Personal Records */}
            {personalRecords.length > 0 && (
              <div className="bg-secondary/20 rounded-2xl p-6 border border-border">
                <div className="flex items-center gap-2 mb-6">
                  <Award className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">Personal Records</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {personalRecords.map((record, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">{record.type}</p>
                          <h3 className="font-bold text-lg">{record.exercise}</h3>
                        </div>
                        <div className="bg-primary/20 rounded-full px-3 py-1">
                          <span className="text-2xl font-bold text-primary">{record.value}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{format(new Date(record.date), "MMM dd, yyyy")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <BottomNav active="history" />
    </div>
  );
};

export default Analytics;
