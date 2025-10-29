import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ac2212ba7b554f879c8b2f7519ea5086',
  appName: 'FitQuest',
  webDir: 'dist',
  server: {
    url: 'https://ac2212ba-7b55-4f87-9c8b-2f7519ea5086.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
