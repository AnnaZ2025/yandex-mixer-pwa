import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Link, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import DJDeck from "./pages/DJDeck";
import { Music2, Disc3 } from "lucide-react";

function BottomNav() {
  const [location] = useLocation();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex border-t z-40"
      style={{
        background: "rgba(8,8,8,0.95)",
        backdropFilter: "blur(12px)",
        borderColor: "#1a1a1a",
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <Link href="/" className="flex-1 flex flex-col items-center gap-1 py-3 transition-opacity">
        <Music2
          className="w-5 h-5"
          style={{ color: location === "/" ? "#00FF88" : "#444" }}
        />
        <span
          className="text-[9px] uppercase tracking-widest"
          style={{ color: location === "/" ? "#00FF88" : "#444" }}
        >
          Плейлисты
        </span>
      </Link>
      <Link href="/dj" className="flex-1 flex flex-col items-center gap-1 py-3 transition-opacity">
        <Disc3
          className="w-5 h-5"
          style={{ color: location === "/dj" ? "#00FF88" : "#444" }}
        />
        <span
          className="text-[9px] uppercase tracking-widest"
          style={{ color: location === "/dj" ? "#00FF88" : "#444" }}
        >
          DJ Стол
        </span>
      </Link>
    </nav>
  );
}

function Router() {
  return (
    <>
      <div className="pb-16">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/dj" component={DJDeck} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <BottomNav />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster theme="dark" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
