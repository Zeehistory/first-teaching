import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import Home from "@/pages/Home";
import Volume from "@/pages/Volume";
import Chapter from "@/pages/Chapter";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Glossary from "@/pages/Glossary";
import { isAuthed } from "@/lib/auth";
import { useLocation } from "wouter";
import AskAssistant from "@/components/AskAssistant";
import MobileBlocker from "@/components/MobileBlocker";
import OnboardingTour from "@/components/OnboardingTour";

function ProtectedRoute({ component: Comp }: { component: any }) {
  const [, setLocation] = useLocation();
  if (!isAuthed()) {
    setLocation("/login");
    return null;
  }
  return <Comp />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <ProtectedRoute component={Home} />} />
      <Route path="/glossary" component={() => <ProtectedRoute component={Glossary} />} />
      <Route path="/v/:volumeNumber/:id" component={() => <ProtectedRoute component={Chapter} />} />
      <Route path="/v/:volumeNumber" component={() => <ProtectedRoute component={Volume} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <Toaster />
          <MobileBlocker />
          <OnboardingTour />
          <Router />
          <AskAssistant />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
