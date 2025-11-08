import { useState, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, TrendingUp, Dumbbell } from "lucide-react";
import { format } from "date-fns";

const History = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWorkouts();
    }
  }, [user]);

  const fetchWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from("workouts")
        .select(`
          *,
          exercises (name)
        `)
        .eq("user_id", user?.id)
        .order("completed_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setWorkouts(data || []);
    } catch (error: any) {
      // Error handled silently - user sees empty state
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
...
      </div>
      <BottomNav active="history" />
    </div>
  );
};

export default History;
