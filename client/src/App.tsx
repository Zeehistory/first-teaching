import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import Home from "@/pages/Home";
import Volume from "@/pages/Volume";
import Chapter from "@/pages/Chapter";
import WebExtension from "@/pages/WebExtension";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Glossary from "@/pages/Glossary";
import AskAssistant from "@/components/AskAssistant";
import MobileBlocker from "@/components/MobileBlocker";
import OnboardingTour from "@/components/OnboardingTour";
import PageTransition from "@/components/PageTransition";

// Static (GitHub Pages) builds set these. On Vercel they are undefined, so the
// app behaves exactly as before: served from "/" with the backend assistant on.
const ROUTER_BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
const IS_STATIC_BUILD = import.meta.env.VITE_STATIC_BUILD === "true";

function ProtectedRoute({ component: Comp }: { component: any }) {
  return <Comp />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <ProtectedRoute component={Home} />} />
      <Route path="/glossary" component={() => <ProtectedRoute component={Glossary} />} />
      <Route
        path="/v/:volumeNumber/:id/web-extension"
        component={() => <ProtectedRoute component={WebExtension} />}
      />
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
          <WouterRouter base={ROUTER_BASE}>
            <Router />
            <PageTransition />
          </WouterRouter>
          {/* The AI study assistant needs the Express backend; omit it on
              static (GitHub Pages) builds where no backend exists. */}
          {!IS_STATIC_BUILD && <AskAssistant />}
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
