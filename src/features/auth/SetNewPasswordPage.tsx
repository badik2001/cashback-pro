import { useState } from "react";
import { supabase } from "../../shared/lib/supabase";
import { useAuth } from "../../shared/hooks/useAuth";
import { useApp } from "../../shared/hooks/useApp";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound } from "lucide-react";

const inputClass =
  "w-full px-4 py-3 rounded-2xl border border-border bg-white/40 dark:bg-white/[0.06] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition backdrop-blur-sm";

/**
 * Shown instead of the dashboard right after a password-recovery code is
 * verified. Supabase signs the user into a temporary session at that point
 * (the "PASSWORD_RECOVERY" auth event) — without this gate they'd land
 * straight in the app having never actually picked a new password.
 */
export default function SetNewPasswordPage() {
  const { t } = useApp();
  const { clearPasswordRecovery, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error(t("auth.passwordsMismatch"));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Пароль обновлён!");
    clearPasswordRecovery();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-[1.5rem] mb-4 shadow-xl shadow-primary/30">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">{t("auth.newPassword")}</h1>
          <p className="text-muted-foreground text-sm mt-1">Придумайте новый пароль для входа</p>
        </div>

        <div className="glass glass-sheen rounded-[2rem] p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">{t("auth.newPassword")}</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="минимум 6 символов"
                  className={inputClass + " pr-11"}
                  autoFocus
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{t("auth.newPassword")} (повтор)</label>
              <input
                type={showPass ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                placeholder="минимум 6 символов"
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:opacity-90 text-primary-foreground font-medium rounded-2xl transition disabled:opacity-50 shadow-lg shadow-primary/25"
            >
              {loading ? t("common.loading") : t("auth.savePassword")}
            </button>
          </form>
          <button onClick={() => signOut()} className="text-center w-full text-sm text-muted-foreground hover:text-foreground mt-5 block">
            {t("auth.logout")}
          </button>
        </div>
      </div>
    </div>
  );
}
