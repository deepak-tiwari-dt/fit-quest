import { useState, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Award, Target, Flame, Calendar, Zap, Activity, Trophy } from "lucide-react";
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
  Area,
  AreaChart,
} from "recharts";

const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [exerciseData, setExerciseData] = useState<any[]>([]);
  const [personalRecords, setPersonalRecords] = useState<any[]>([]);
  const [totalStats, setTotalStats] = useState({ workouts: 0, xp: 0, sets: 0 });

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
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

      // Calculate total stats
      const totalXp = workoutsList.reduce((sum, w) => sum + (w.total_xp_earned || 0), 0);
      const totalSets = workoutsList.reduce((sum, w) => sum + (Array.isArray(w.sets) ? w.sets.length : 0), 0);
      setTotalStats({ workouts: workoutsList.length, xp: totalXp, sets: totalSets });

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
    "hsl(var(--accent))",
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
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/20">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Analytics
            </h1>
          </div>
          <p className="text-muted-foreground">Track your progress and achievements</p>
        </div>

        {workouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
            <div className="bg-card rounded-full p-8 mb-6 border border-border">
              <TrendingUp className="w-16 h-16 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No Data Yet</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Complete some workouts to see your analytics and progress!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3 animate-fade-in">
              <div className="bg-card rounded-2xl p-4 border border-border text-center">
                <div className="flex justify-center mb-2">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{totalStats.workouts}</p>
                <p className="text-xs text-muted-foreground">Workouts</p>
              </div>
              <div className="bg-card rounded-2xl p-4 border border-border text-center">
                <div className="flex justify-center mb-2">
                  <div className="p-2 rounded-lg bg-accent/20">
                    <Zap className="w-4 h-4 text-accent" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{totalStats.xp.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total XP</p>
              </div>
              <div className="bg-card rounded-2xl p-4 border border-border text-center">
                <div className="flex justify-center mb-2">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Flame className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{totalStats.sets}</p>
                <p className="text-xs text-muted-foreground">Total Sets</p>
              </div>
            </div>

            {/* Progress Over Time */}
            <div className="bg-card rounded-2xl p-5 border border-border animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 rounded-lg bg-primary/20">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Progress Over Time</h2>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={progressData}>
                  <defs>
                    <linearGradient id="colorWorkouts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '10px' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '10px' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      color: 'hsl(var(--foreground))',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area 
                    type="monotone" 
                    dataKey="workouts" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorWorkouts)"
                    name="Workouts"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="xp" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorXp)"
                    name="XP Earned"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Favorite Exercises */}
            <div className="bg-card rounded-2xl p-5 border border-border animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 rounded-lg bg-accent/20">
                  <Flame className="w-4 h-4 text-accent" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Favorite Exercises</h2>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={exerciseData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} horizontal={false} />
                  <XAxis 
                    type="number"
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '10px' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '10px' }}
                    width={80}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      color: 'hsl(var(--foreground))',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                  />
                  <Bar dataKey="count" name="Workouts" radius={[0, 8, 8, 0]}>
                    {exerciseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Exercise Distribution */}
            {exerciseData.length > 0 && (
              <div className="bg-card rounded-2xl p-5 border border-border animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center gap-2 mb-5">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">Exercise Distribution</h2>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={exerciseData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      innerRadius={50}
                      fill="#8884d8"
                      dataKey="count"
                      strokeWidth={2}
                      stroke="hsl(var(--card))"
                    >
                      {exerciseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        color: 'hsl(var(--foreground))',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '11px' }}
                      formatter={(value) => <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Personal Records */}
            {personalRecords.length > 0 && (
              <div className="bg-card rounded-2xl p-5 border border-border animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center gap-2 mb-5">
                  <div className="p-2 rounded-lg bg-accent/20">
                    <Trophy className="w-4 h-4 text-accent" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">Personal Records</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {personalRecords.map((record, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-primary/10 via-card to-accent/5 rounded-xl p-4 border border-border hover:border-primary/30 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground font-medium">{record.type}</p>
                          <h3 className="font-bold text-foreground truncate">{record.exercise}</h3>
                        </div>
                        <div className="bg-primary/20 rounded-xl px-3 py-1.5 ml-2">
                          <span className="text-xl font-bold text-primary">{record.value}</span>
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
