import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import BoardPage from "./pages/BoardPage";
import AgentsPage from "./pages/AgentsPage";
import ProvidersPage from "./pages/ProvidersPage";
import TriagePage from "./pages/TriagePage";
import ExecutionHistoryPage from "./pages/ExecutionHistoryPage";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"}>
        {() => (
          <DashboardLayout>
            <Home />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/boards/:boardId"}>
        {() => (
          <DashboardLayout>
            <BoardPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/triage"}>
        {() => (
          <DashboardLayout>
            <TriagePage />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/agents"}>
        {() => (
          <DashboardLayout>
            <AgentsPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/providers"}>
        {() => (
          <DashboardLayout>
            <ProvidersPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/executions"}>
        {() => (
          <DashboardLayout>
            <ExecutionHistoryPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
