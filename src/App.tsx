import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./shared/hooks/useAuth";
import { AppProvider } from "./shared/hooks/useApp";
import AuthPage from "./features/auth/AuthPage";
import Layout from "./features/layout/Layout";
import DashboardPage from "./features/dashboard/DashboardPage";
import CardsPage from "./features/cards/CardsPage";
import FamilyPage from "./features/family/FamilyPage";
import SettingsPage from "./features/settings/SettingsPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
});

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl animate-pulse" />
          <p className="text-muted-foreground text-sm">Загрузка...</p>
        </div>
      </div>
    );
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster position="top-center" toastOptions={{ style: { borderRadius: "12px", fontSize: "14px" } }} />
          </BrowserRouter>
        </AuthProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}
export default App;
