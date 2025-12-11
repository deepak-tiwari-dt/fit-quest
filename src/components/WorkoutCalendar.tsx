import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, isToday } from "date-fns";
import { Flame } from "lucide-react";

interface WorkoutCalendarProps {
  workouts: any[];
}

export const WorkoutCalendar = ({ workouts }: WorkoutCalendarProps) => {
  const today = new Date();
  const startDate = startOfMonth(subMonths(today, 1));
  const endDate = endOfMonth(today);

  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, []);

  const workoutsByDate = useMemo(() => {
    const map = new Map<string, { count: number; xp: number }>();
    workouts.forEach((workout) => {
      const dateKey = format(new Date(workout.completed_at), "yyyy-MM-dd");
      const existing = map.get(dateKey) || { count: 0, xp: 0 };
      map.set(dateKey, {
        count: existing.count + 1,
        xp: existing.xp + (workout.total_xp_earned || 0),
      });
    });
    return map;
  }, [workouts]);

  const getIntensityClass = (count: number) => {
    if (count === 0) return "bg-secondary/30";
    if (count === 1) return "bg-primary/30";
    if (count === 2) return "bg-primary/50";
    if (count >= 3) return "bg-primary";
    return "bg-secondary/30";
  };

  const getIntensityRing = (count: number) => {
    if (count === 0) return "";
    if (count === 1) return "ring-1 ring-primary/30";
    if (count === 2) return "ring-2 ring-primary/50";
    if (count >= 3) return "ring-2 ring-primary";
    return "";
  };

  // Group days by week
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  // Add padding for first week
  const firstDayOfWeek = calendarDays[0].getDay();
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(null as any);
  }

  calendarDays.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null as any);
    }
    weeks.push(currentWeek);
  }

  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

  const totalWorkouts = workouts.length;
  const currentStreak = useMemo(() => {
    let streak = 0;
    let checkDate = new Date();
    
    while (true) {
      const dateKey = format(checkDate, "yyyy-MM-dd");
      if (workoutsByDate.has(dateKey)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (isToday(checkDate)) {
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [workoutsByDate]);

  return (
    <div className="bg-card rounded-2xl p-5 border border-border mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/20">
            <Flame className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Activity Calendar</h2>
        </div>
        {currentStreak > 0 && (
          <div className="flex items-center gap-1 bg-accent/20 rounded-full px-3 py-1">
            <Flame className="w-4 h-4 text-accent" />
            <span className="text-sm font-bold text-accent">{currentStreak} day streak</span>
          </div>
        )}
      </div>

      {/* Month Labels */}
      <div className="flex justify-between mb-3 px-1">
        <span className="text-xs text-muted-foreground">
          {format(startDate, "MMM yyyy")}
        </span>
        <span className="text-xs text-muted-foreground">
          {format(endDate, "MMM yyyy")}
        </span>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, i) => (
          <div key={i} className="text-center text-xs text-muted-foreground font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((day, dayIndex) => {
              if (!day) {
                return <div key={dayIndex} className="aspect-square" />;
              }

              const dateKey = format(day, "yyyy-MM-dd");
              const dayData = workoutsByDate.get(dateKey);
              const count = dayData?.count || 0;
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={dayIndex}
                  className={`
                    aspect-square rounded-md flex items-center justify-center text-xs font-medium
                    transition-all duration-200 cursor-default
                    ${getIntensityClass(count)}
                    ${getIntensityRing(count)}
                    ${isCurrentDay ? "ring-2 ring-accent ring-offset-1 ring-offset-background" : ""}
                    ${count > 0 ? "text-primary-foreground" : "text-muted-foreground"}
                  `}
                  title={`${format(day, "MMM d")}: ${count} workout${count !== 1 ? "s" : ""}${dayData ? ` (${dayData.xp} XP)` : ""}`}
                >
                  {format(day, "d")}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-secondary/30" />
          <span className="text-xs text-muted-foreground">None</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary/30" />
          <span className="text-xs text-muted-foreground">1</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary/50" />
          <span className="text-xs text-muted-foreground">2</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary" />
          <span className="text-xs text-muted-foreground">3+</span>
        </div>
      </div>
    </div>
  );
};
