import { useAuth } from "../../shared/hooks/useAuth";
import { useApp } from "../../shared/hooks/useApp";
import { Moon, Sun, MessageCircle, LogOut, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import SegmentedControl from "../../shared/components/SegmentedControl";

export default function SettingsPage() {
  const { signOut, user } = useAuth();
  const { t, theme, setTheme, lang, setLang } = useApp();

  const handleLogout = async () => {
    await signOut();
    toast.success("Вы вышли из аккаунта");
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-6">{t("settings.title")}</h1>

      {/* Profile */}
      <div className="glass rounded-3xl p-4 mb-4 flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white font-semibold text-lg shrink-0 shadow-md">
          {(user?.user_metadata?.username || user?.email || "?")[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate">{user?.user_metadata?.username || "Пользователь"}</p>
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
        </div>
      </div>

      {/* Theme */}
      <div className="glass rounded-3xl p-4 mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t("settings.theme")}</p>
        <SegmentedControl
          value={theme}
          onChange={(v) => setTheme(v as "light" | "dark")}
          options={[
            { value: "light", label: t("settings.light"), icon: <Sun className="w-3.5 h-3.5" /> },
            { value: "dark", label: t("settings.dark"), icon: <Moon className="w-3.5 h-3.5" /> },
          ]}
        />
      </div>

      {/* Language */}
      <div className="glass rounded-3xl p-4 mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t("settings.language")}</p>
        <SegmentedControl
          value={lang}
          onChange={(v) => setLang(v as "ru" | "en")}
          options={[
            { value: "ru", label: "Русский" },
            { value: "en", label: "English" },
          ]}
        />
      </div>

      {/* Support */}
      <div className="glass rounded-3xl mb-4 overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("settings.support")}</p>
        </div>
        <a href="https://t.me/" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/30 dark:hover:bg-white/10 transition">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground">{t("settings.telegram")}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </a>
      </div>

      {/* Logout */}
      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3.5 glass rounded-3xl text-destructive hover:bg-destructive/10 transition">
        <LogOut className="w-4 h-4" />
        <span className="text-sm font-medium">{t("settings.logout")}</span>
      </button>

      <p className="text-center text-xs text-muted-foreground mt-6">CashBack Pro v1.0.0</p>
    </div>
  );
}
