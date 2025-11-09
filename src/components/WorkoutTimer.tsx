import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkoutTimerProps {
  duration?: number; // in seconds
  onComplete?: () => void;
  label?: string;
}

export const WorkoutTimer = ({ duration = 60, onComplete, label = "Timer" }: WorkoutTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setTimeLeft(duration);
    setIsRunning(false);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="bg-secondary/30 rounded-2xl p-6 border border-border">
      <h3 className="text-lg font-bold mb-4 text-center">{label}</h3>
      
      {/* Circular Progress */}
      <div className="relative w-40 h-40 mx-auto mb-6">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-secondary"
          />
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 70}`}
            strokeDashoffset={`${2 * Math.PI * 70 * (1 - progress / 100)}`}
            className="text-primary transition-all duration-1000"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-bold">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        <Button
          onClick={toggleTimer}
          className="rounded-full w-14 h-14"
          size="icon"
        >
          {isRunning ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6" />
          )}
        </Button>
        <Button
          onClick={resetTimer}
          variant="secondary"
          className="rounded-full w-14 h-14"
          size="icon"
        >
          <RotateCcw className="w-6 h-6" />
        </Button>
      </div>

      {/* Quick Set Buttons */}
      <div className="flex gap-2 mt-4 justify-center">
        {[30, 60, 90, 120].map((time) => (
          <button
            key={time}
            onClick={() => {
              setTimeLeft(time);
              setIsRunning(false);
            }}
            className="px-3 py-1.5 rounded-full bg-primary/20 text-sm font-medium hover:bg-primary/30 transition-colors"
          >
            {time}s
          </button>
        ))}
      </div>
    </div>
  );
};
