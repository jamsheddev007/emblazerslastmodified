import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (!dismissed || Date.now() - parseInt(dismissed) > 7 * 24 * 60 * 60 * 1000) {
        setShowBanner(true);
      }
    };

    const installedHandler = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (isInstalled || !showBanner) return null;

  return (
    <div
      data-testid="pwa-install-banner"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-gradient-to-r from-[#1A2B4A] to-[#0D4F52] text-white rounded-xl shadow-2xl p-4 flex items-center gap-3 animate-in slide-in-from-bottom-5"
    >
      <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
        <Download className="w-5 h-5 text-teal-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Install Emblazers SMS</p>
        <p className="text-xs text-white/70 truncate">Quick access from your home screen</p>
      </div>
      <button
        data-testid="button-install-pwa"
        onClick={handleInstall}
        className="flex-shrink-0 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
      >
        Install
      </button>
      <button
        data-testid="button-dismiss-pwa"
        onClick={handleDismiss}
        className="flex-shrink-0 text-white/50 hover:text-white/90 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
