import { Dumbbell, User, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BottomNavProps {
  active: "workout" | "profile" | "history";
}

export const BottomNav = ({ active }: BottomNavProps) => {
  const navigate = useNavigate();

  const navItems = [
    { id: "workout", label: "Workout", icon: Dumbbell, path: "/workout" },
    { id: "profile", label: "Profile", icon: User, path: "/" },
    { id: "history", label: "History", icon: Clock, path: "/history" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border">
      <div className="flex justify-around items-center h-20 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center gap-1 flex-1 relative"
            >
              <div className={`${isActive ? 'bg-primary' : 'bg-transparent'} rounded-full p-3 transition-colors`}>
                <Icon className={`w-6 h-6 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
