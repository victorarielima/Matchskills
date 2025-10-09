import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import OrganizerDashboard from "@/pages/organizer-dashboard";
import CreateClass from "@/pages/create-class";
import ParticipantForm from "@/pages/participant-form";
import ResponsesView from "@/pages/responses-view";
import GroupDivision from "@/pages/group-division";
import Reports from "@/pages/reports";

function Router() {
  const { user, isLoading } = useAuth();
  const isAuthenticated = !!user;

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/class/:code" component={ParticipantForm} />
        </>
      ) : (
        <>
          <Route path="/" component={OrganizerDashboard} />
          <Route path="/create-class" component={CreateClass} />
          <Route path="/edit-class/:classId" component={CreateClass} />
          <Route path="/class/:classId/responses" component={ResponsesView} />
          <Route path="/class/:classId/groups" component={GroupDivision} />
          <Route path="/reports" component={Reports} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
