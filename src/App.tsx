import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./shared/hooks/useAuth";
import { AppProvider, useApp } from "./shared/hooks/useApp";
import { cardsQueryKey, fetchCards } from "./shared/lib/cardsQuery";
import AuthPage from "./features/auth/AuthPage";
import SetNewPasswordPage from "./features/auth/SetNewPasswordPage";
import Layout from "./features/layout/Layout";
import DashboardPage from "./features/dashboard/DashboardPage";
import CardsPage from "./features/cards/CardsPage";
import FamilyPage from "./features/family/FamilyPage";
import SettingsPage from "./features/settings/SettingsPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
});

function AppRoutes() {
  const { user, loading, passwordRecovery } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    qc.prefetchQuery({ queryKey: cardsQueryKey(user.id), queryFn: () => fetchCards(user.id) });
  }, [user, qc]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-2xl animate-pulse" />
          <p className="text-muted-foreground text-sm">Загрузка...</p>
        </div>
      </div>
    );
  }
  if (passwordRecovery) {
    return <Routes><Route path="*" element={<SetNewPasswordPage />} /></Routes>;
  }
  if (!user) {
    return <Routes><Route path="*" element={<AuthPage />} /></Routes>;
  }
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/cards" element={<CardsPage />} />
        <Route path="/family" element={<FamilyPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function ThemedToaster() {
  const { theme } = useApp();
  return (
    <Toaster
      position="top-center"
      theme={theme}
      toastOptions={{
        style: {
          borderRadius: "16px",
          fontSize: "14px",
          background: "var(--glass-bg-strong)",
          backdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid var(--glass-border)",
          color: "hsl(var(--foreground))",
        },
      }}
    />
  );
}

function App() {
  // Keep the router's basename in sync with vite.config.ts's `base` —
  // import.meta.env.BASE_URL is set by Vite at build time, so this never
  // drifts out of sync even if the deploy path changes later.
  const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <AuthProvider>
          <BrowserRouter basename={basename}>
            <div className="ambient-bg">
              <div className="ambient-blob ambient-blob--primary" />
              <div className="ambient-blob ambient-blob--secondary" />
              <div className="ambient-blob ambient-blob--tertiary" />
            </div>
            <AppRoutes />
            <ThemedToaster />
          </BrowserRouter>
        </AuthProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}
export default App;