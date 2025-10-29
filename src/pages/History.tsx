import { BottomNav } from "@/components/BottomNav";
import { Calendar, TrendingUp } from "lucide-react";

const History = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-8">History</h1>
        
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="bg-primary/10 rounded-full p-6 mb-4">
            <Calendar className="w-16 h-16 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Your Workout Journey</h2>
          <p className="text-muted-foreground max-w-sm">
            Start logging workouts to track your progress and watch your XP grow!
          </p>
        </div>
      </div>
      <BottomNav active="history" />
    </div>
  );
};

export default History;
