import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Monitor, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Install FitQuest</h1>
          <p className="text-muted-foreground">Get the full app experience on your device</p>
        </div>

        {isInstalled ? (
          <Card className="border-primary">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Check className="h-6 w-6 text-primary" />
                <CardTitle>Already Installed!</CardTitle>
              </div>
              <CardDescription>
                FitQuest is already installed on your device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/")} className="w-full">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {deferredPrompt && (
              <Card>
                <CardHeader>
                  <CardTitle>Quick Install</CardTitle>
                  <CardDescription>
                    Click the button below to install FitQuest
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleInstallClick} className="w-full" size="lg">
                    <Download className="mr-2 h-5 w-5" />
                    Install Now
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Smartphone className="h-6 w-6 text-primary" />
                  <CardTitle>iOS (iPhone/iPad)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Open FitQuest in Safari browser</li>
                  <li>Tap the Share button (square with arrow)</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" to confirm</li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Smartphone className="h-6 w-6 text-primary" />
                  <CardTitle>Android</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Open FitQuest in Chrome browser</li>
                  <li>Tap the three-dot menu (⋮)</li>
                  <li>Select "Install app" or "Add to Home screen"</li>
                  <li>Tap "Install" to confirm</li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Monitor className="h-6 w-6 text-primary" />
                  <CardTitle>Desktop</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Look for the install icon in your browser's address bar</li>
                  <li>Click the install button</li>
                  <li>Or use the browser menu: Settings → Install FitQuest</li>
                </ol>
              </CardContent>
            </Card>
          </>
        )}

        <div className="text-center">
          <Button variant="ghost" onClick={() => navigate("/")}>
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Install;
