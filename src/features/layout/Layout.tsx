import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../shared/hooks/useAuth";
import { useApp } from "../../shared/hooks/useApp";
import { LayoutDashboard, CreditCard, Users, Settings, LogOut, CreditCard as Logo } from "lucide-react";

export default function Layout() {
  const { signOut, user } = useAuth();
  const { t } = useApp();

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: t("nav.dashboard") },
    { to: "/cards", icon: CreditCard, label: t("nav.cards") },
    { to: "/family", icon: Users, label: t("nav.family") },
    { to: "/settings", icon: Settings, label: t("nav.settings") },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar (desktop) — floating glass panel */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 p-4">
        <div className="glass glass-sheen rounded-[1.75rem] flex flex-col h-full overflow-hidden">
          <div className="p-5 flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
              <Logo className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-semibold text-foreground tracking-tight">CashBack Pro</span>
          </div>

          <nav className="flex-1 px-3 space-y-1.5">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "text-muted-foreground hover:bg-white/40 dark:hover:bg-white/10 hover:text-foreground"
                  }`
                }
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="p-3 mt-auto">
            <div className="px-3.5 py-2.5 mb-1 rounded-2xl bg-white/30 dark:bg-white/[0.06]">
              <p className="text-xs font-medium text-foreground truncate">{user?.user_metadata?.username || user?.email}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {t("auth.logout")}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-28 md:pb-0">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav (mobile) — floating glass pill */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2">
        <div className="glass-pill flex items-center justify-around h-16 px-2 max-w-md mx-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all min-w-[56px] ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`flex items-center justify-center w-9 h-9 rounded-full transition-all ${isActive ? "bg-primary/15" : ""}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
