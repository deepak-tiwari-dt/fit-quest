import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const InstallBanner = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if app is installed (standalone mode)
    const isInstalled = window.matchMedia("(display-mode: standalone)").matches;
    
    // Check if user has dismissed the banner
    const isDismissed = localStorage.getItem("installBannerDismissed") === "true";

    // Show banner only if not installed and not dismissed
    if (!isInstalled && !isDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("installBannerDismissed", "true");
    setIsVisible(false);
  };

  const handleInstall = () => {
    navigate("/install");
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-primary/20 to-primary/10 border-b border-primary/30 animate-fade-in">
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="bg-primary/20 rounded-full p-2 flex-shrink-0">
            <Download className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Install FitQuest</p>
            <p className="text-xs text-muted-foreground truncate">Get the full app experience</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleInstall}
            className="h-8 text-xs font-semibold"
          >
            Install
          </Button>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label="Dismiss install banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
