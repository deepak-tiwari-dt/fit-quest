import { useState } from "react";
import { X, Link2, UserPlus, Send, Users, Flame, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const InviteFriends = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const howItWorks = [
    {
      title: "1. Send an Invite",
      description: "Share your unique invite link with friends via message or social media.",
      icon: Send,
    },
    {
      title: "2. Friend Joins",
      description: "Your friend signs up using your link and you'll be automatically connected.",
      icon: Users,
    },
    {
      title: "3. Compete & Earn Bonus XP",
      description: "Workout together, cheer each other on, and earn bonus XP for every friend who joins!",
      icon: Flame,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate('/profile')}>
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Invite Friends</h1>
          <div className="w-6" />
        </div>

        {/* Main Title */}
        <h2 className="text-3xl font-bold mb-8">Invite your friends</h2>

        {/* Action Cards */}
        <div className="space-y-4 mb-8">
          <button className="w-full bg-secondary/30 rounded-2xl p-6 flex items-center justify-between hover:bg-secondary/40 transition-colors">
            <div className="flex items-center gap-4">
              <div className="bg-primary/20 rounded-full p-4">
                <Link2 className="w-6 h-6 text-primary" />
              </div>
              <span className="font-semibold text-lg">Share invite link</span>
            </div>
            <ChevronDown className="w-5 h-5 rotate-[-90deg]" />
          </button>

          <button className="w-full bg-secondary/30 rounded-2xl p-6 flex items-center justify-between hover:bg-secondary/40 transition-colors">
            <div className="flex items-center gap-4">
              <div className="bg-primary/20 rounded-full p-4">
                <UserPlus className="w-6 h-6 text-primary" />
              </div>
              <span className="font-semibold text-lg">Invite from contacts</span>
            </div>
            <ChevronDown className="w-5 h-5 rotate-[-90deg]" />
          </button>
        </div>

        {/* How it Works Collapsible */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-8">
          <CollapsibleTrigger asChild>
            <button className="w-full bg-secondary/30 rounded-2xl p-6 flex items-center justify-between hover:bg-secondary/40 transition-colors">
              <span className="font-semibold text-lg">How it works</span>
              <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? '' : 'rotate-[-90deg]'}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            {howItWorks.map((item, index) => (
              <div key={index} className="flex gap-4">
                <div className="bg-primary/20 rounded-full p-3 h-fit">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Search Section */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-4">Search for friends</h3>
          <Input
            placeholder="Search for username"
            className="bg-secondary/30 border-0 h-14 rounded-2xl text-base"
          />
        </div>
      </div>
    </div>
  );
};

export default InviteFriends;
