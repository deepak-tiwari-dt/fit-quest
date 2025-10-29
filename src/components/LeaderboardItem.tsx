import { Trophy, Medal, User } from "lucide-react";

interface LeaderboardItemProps {
  rank: number;
  name: string;
  xp: number;
  isTop?: boolean;
  isUser?: boolean;
}

export const LeaderboardItem = ({ rank, name, xp, isTop, isUser }: LeaderboardItemProps) => {
  const getRankColor = () => {
    if (rank === 1) return "bg-yellow-500";
    if (rank === 2) return "bg-slate-400";
    if (rank === 3) return "bg-orange-500";
    return "bg-primary/20";
  };

  const getBorderStyle = () => {
    if (isUser) return "border-2 border-primary";
    if (rank === 1) return "border-2 border-yellow-500/50";
    return "";
  };

  const getRankIcon = () => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2 || rank === 3) return <Medal className="w-5 h-5 text-slate-400" />;
    return null;
  };

  return (
    <div className={`bg-secondary/30 rounded-2xl p-4 flex items-center gap-4 ${getBorderStyle()}`}>
      <div className={`${getRankColor()} rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg ${isUser ? 'text-primary-foreground' : ''}`}>
        {rank}
      </div>
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-300 to-slate-200 flex items-center justify-center">
        <User className="w-6 h-6 text-slate-600" />
      </div>
      <div className="flex-1">
        <p className="font-semibold">{name}</p>
        <p className="text-sm text-muted-foreground">{xp.toLocaleString()} XP</p>
      </div>
      {isTop && getRankIcon()}
      {isUser && <User className="w-5 h-5 text-primary" />}
    </div>
  );
};
