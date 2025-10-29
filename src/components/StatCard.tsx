interface StatCardProps {
  label: string;
  value: number;
}

export const StatCard = ({ label, value }: StatCardProps) => {
  return (
    <div className="bg-secondary/30 rounded-2xl p-6">
      <p className="text-muted-foreground text-sm mb-2">{label}</p>
      <p className="text-4xl font-bold">{value}</p>
    </div>
  );
};
