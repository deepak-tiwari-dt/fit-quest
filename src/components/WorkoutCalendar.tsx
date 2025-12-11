import { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, isToday, isFuture } from "date-fns";
import { Flame, Calendar, Zap, Trophy } from "lucide-react";

interface WorkoutCalendarProps {
  workouts: any[];
}

export const WorkoutCalendar = ({ workouts }: WorkoutCalendarProps) => {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
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

  const getIntensityStyles = (count: number, isCurrentDay: boolean, isFutureDay: boolean) => {
    if (isFutureDay) {
      return "bg-muted/20 text-muted-foreground/40";
    }
    if (count === 0) {
      return "bg-secondary/40 text-muted-foreground hover:bg-secondary/60";
    }
    if (count === 1) {
      return "bg-gradient-to-br from-primary/40 to-primary/20 text-foreground shadow-sm hover:from-primary/50 hover:to-primary/30";
    }
    if (count === 2) {
      return "bg-gradient-to-br from-primary/70 to-primary/50 text-primary-foreground shadow-md hover:from-primary/80 hover:to-primary/60";
    }
    return "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg hover:from-primary/90 hover:to-primary/70";
  };

  // Group days by week
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
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

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

  const totalActiveDays = workoutsByDate.size;
  const totalXp = Array.from(workoutsByDate.values()).reduce((sum, d) => sum + d.xp, 0);

  const selectedDayData = selectedDay ? workoutsByDate.get(selectedDay) : null;

  return (
    <div className="bg-gradient-to-br from-card via-card to-primary/5 rounded-3xl p-6 border border-border shadow-xl mb-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 shadow-inner">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Activity Calendar</h2>
            <p className="text-xs text-muted-foreground">
              {format(startDate, "MMM")} - {format(endDate, "MMM yyyy")}
            </p>
          </div>
        </div>
        {currentStreak > 0 && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-accent/30 to-accent/10 rounded-full px-4 py-2 border border-accent/30 shadow-lg shadow-accent/10">
            <Flame className="w-5 h-5 text-accent animate-pulse" />
            <div className="text-right">
              <span className="text-lg font-bold text-accent">{currentStreak}</span>
              <span className="text-xs text-accent/80 ml-1">day streak</span>
            </div>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-secondary/30 rounded-xl p-3 text-center border border-border/50">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Calendar className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-lg font-bold text-foreground">{totalActiveDays}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active Days</p>
        </div>
        <div className="bg-secondary/30 rounded-xl p-3 text-center border border-border/50">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Trophy className="w-3.5 h-3.5 text-accent" />
          </div>
          <p className="text-lg font-bold text-foreground">{workouts.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Workouts</p>
        </div>
        <div className="bg-secondary/30 rounded-xl p-3 text-center border border-border/50">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-lg font-bold text-foreground">{totalXp.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total XP</p>
        </div>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {weekDays.map((day, i) => (
          <div key={i} className="text-center text-[10px] text-muted-foreground font-semibold uppercase tracking-wider py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-1.5">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1.5">
            {week.map((day, dayIndex) => {
              if (!day) {
                return <div key={dayIndex} className="aspect-square" />;
              }

              const dateKey = format(day, "yyyy-MM-dd");
              const dayData = workoutsByDate.get(dateKey);
              const count = dayData?.count || 0;
              const isCurrentDay = isToday(day);
              const isFutureDay = isFuture(day);
              const isSelected = selectedDay === dateKey;

              return (
                <button
                  key={dayIndex}
                  onClick={() => !isFutureDay && setSelectedDay(isSelected ? null : dateKey)}
                  disabled={isFutureDay}
                  className={`
                    aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-semibold
                    transition-all duration-300 ease-out relative overflow-hidden
                    ${getIntensityStyles(count, isCurrentDay, isFutureDay)}
                    ${isCurrentDay ? "ring-2 ring-accent ring-offset-2 ring-offset-card" : ""}
                    ${isSelected ? "scale-110 z-10 ring-2 ring-primary" : "hover:scale-105"}
                    ${!isFutureDay ? "cursor-pointer active:scale-95" : "cursor-default"}
                  `}
                >
                  {count >= 3 && !isFutureDay && (
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
                  )}
                  <span className="relative z-10">{format(day, "d")}</span>
                  {count > 0 && !isFutureDay && (
                    <div className="flex gap-0.5 mt-0.5 relative z-10">
                      {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                        <div key={i} className="w-1 h-1 rounded-full bg-current opacity-80" />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Selected Day Info */}
      {selectedDay && (
        <div className="mt-4 p-4 bg-gradient-to-r from-primary/10 to-transparent rounded-xl border border-primary/20 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {format(new Date(selectedDay), "EEEE, MMMM d")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedDayData ? `${selectedDayData.count} workout${selectedDayData.count !== 1 ? 's' : ''}` : 'No workouts'}
              </p>
            </div>
            {selectedDayData && (
              <div className="flex items-center gap-1.5 bg-primary/20 rounded-full px-3 py-1.5">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-primary">+{selectedDayData.xp} XP</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mt-5 pt-4 border-t border-border/50">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-2">Intensity:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-md bg-secondary/40 shadow-inner" />
          <span className="text-[10px] text-muted-foreground">0</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-md bg-gradient-to-br from-primary/40 to-primary/20 shadow-sm" />
          <span className="text-[10px] text-muted-foreground">1</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-md bg-gradient-to-br from-primary/70 to-primary/50 shadow-md" />
          <span className="text-[10px] text-muted-foreground">2</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-md bg-gradient-to-br from-primary to-primary/80 shadow-lg" />
          <span className="text-[10px] text-muted-foreground">3+</span>
        </div>
      </div>
    </div>
  );
};
