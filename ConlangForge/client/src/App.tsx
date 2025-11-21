import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Languages, GitBranch, LayoutDashboard, ArrowLeftRight } from "lucide-react";

import Dashboard from "@/pages/Dashboard";
import CreateLanguage from "@/pages/CreateLanguage";
import LanguageDetail from "@/pages/LanguageDetail";
import TreeView from "@/pages/TreeView";
import Chat from "@/pages/Chat";
import CompareLanguages from "@/pages/CompareLanguages";
import NotFound from "@/pages/not-found";

function Navigation() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer hover-elevate active-elevate-2 px-3 py-2 rounded-md -ml-3">
              <div className="p-2 bg-primary rounded-md">
                <Languages className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Conlang Generator</h1>
                <p className="text-xs text-muted-foreground">Linguistic Creativity Platform</p>
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            <Link href="/">
              <Button
                variant={isActive("/") && location === "/" ? "secondary" : "ghost"}
                size="sm"
                data-testid="nav-dashboard"
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/tree">
              <Button
                variant={isActive("/tree") ? "secondary" : "ghost"}
                size="sm"
                data-testid="nav-tree"
              >
                <GitBranch className="h-4 w-4 mr-2" />
                Tree View
              </Button>
            </Link>
            <Link href="/compare">
              <Button
                variant={isActive("/compare") ? "secondary" : "ghost"}
                size="sm"
                data-testid="nav-compare"
              >
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                Compare
              </Button>
            </Link>
          </nav>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/create" component={CreateLanguage} />
      <Route path="/language/:id" component={LanguageDetail} />
      <Route path="/language/:id/chat" component={Chat} />
      <Route path="/tree" component={TreeView} />
      <Route path="/compare" component={CompareLanguages} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Navigation />
          <main>
            <Router />
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
