import { useAuth } from "../../shared/hooks/useAuth";
import { useApp } from "../../shared/hooks/useApp";
import { Moon, Sun, Globe, MessageCircle, LogOut, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { signOut, user } = useAuth();
  const { t, theme, toggleTheme, lang, setLang } = useApp();

  const handleLogout = async () => {
    await signOut();
    toast.success("Вы вышли из аккаунта");
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">{t("settings.title")}</h1>

      {/* Profile */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-4 flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
          {(user?.user_metadata?.username || user?.email || "?")[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate">{user?.user_metadata?.username || "Пользователь"}</p>
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
        </div>
      </div>

      {/* Theme */}
      <div className="bg-card border border-border rounded-2xl mb-4 overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("settings.theme")}</p>
        </div>
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-accent transition"
        >
          <div className="flex items-center gap-3">
            {theme === "dark" ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-yellow-500" />}
            <span className="text-sm text-foreground font-medium">
              {theme === "dark" ? t("settings.dark") : t("settings.light")}
            </span>
          </div>
          <div className={`w-11 h-6 rounded-full transition-colors ${theme === "dark" ? "bg-blue-600" : "bg-muted"} relative`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${theme === "dark" ? "translate-x-5.5" : "translate-x-0.5"}`} />
          </div>
        </button>
      </div>

      {/* Language */}
      <div className="bg-card border border-border rounded-2xl mb-4 overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("settings.language")}</p>
        </div>
        <button
          onClick={() => setLang("ru")}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-accent transition"
        >
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Русский</span>
          </div>
          {lang === "ru" && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
        </button>
        <div className="h-px bg-border mx-4" />
        <button
          onClick={() => setLang("en")}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-accent transition"
        >
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">English</span>
          </div>
          {lang === "en" && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
        </button>
      </div>

      {/* Support */}
      <div className="bg-card border border-border rounded-2xl mb-4 overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("settings.support")}</p>
        </div>
        <a
          href="https://t.me/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-accent transition"
        >
          <div className="flex items-center gap-3">
            <MessageCircle className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-foreground">{t("settings.telegram")}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </a>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-card border border-border rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-sm font-medium">{t("settings.logout")}</span>
      </button>

      <p className="text-center text-xs text-muted-foreground mt-6">CashBack Pro v1.0.0</p>
    </div>
  );
}
