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
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border bg-card shrink-0">
        <div className="p-5 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Logo className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-foreground">CashBack Pro</span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium text-foreground truncate">{user?.user_metadata?.username || user?.email}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t("auth.logout")}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors min-w-[56px] ${
                  isActive ? "text-blue-600" : "text-muted-foreground"
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
