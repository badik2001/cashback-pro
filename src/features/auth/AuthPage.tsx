import { useState } from "react";
import { supabase } from "../../shared/lib/supabase";
import { useApp } from "../../shared/hooks/useApp";
import { toast } from "sonner";
import { Eye, EyeOff, CreditCard } from "lucide-react";

type AuthMode = "login" | "register" | "forgot" | "verify";

const inputClass =
  "w-full px-4 py-3 rounded-2xl border border-border bg-white/40 dark:bg-white/[0.06] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition backdrop-blur-sm";

export default function AuthPage() {
  const { t } = useApp();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Письмо отправлено! Проверьте email.");
      setMode("verify");
    }
    setLoading(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Код отправлен на email!");
      setMode("verify");
    }
    setLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    if (error) toast.error(error.message);
    else toast.success("Email подтверждён!");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-[1.5rem] mb-4 shadow-xl shadow-primary/30">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">CashBack Pro</h1>
          <p className="text-muted-foreground text-sm mt-1">Управляй кешбеком семьи</p>
        </div>

        <div className="glass glass-sheen rounded-[2rem] p-7">
          {mode === "login" && (
            <>
              <h2 className="text-xl font-semibold mb-6">{t("auth.login")}</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">{t("auth.email")}</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">{t("auth.password")}</label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className={inputClass + " pr-11"} />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="button" onClick={() => setMode("forgot")} className="text-sm text-primary hover:underline">
                  {t("auth.forgotPassword")}
                </button>
                <button type="submit" disabled={loading} className="w-full py-3 bg-primary hover:opacity-90 text-primary-foreground font-medium rounded-2xl transition disabled:opacity-50 shadow-lg shadow-primary/25">
                  {loading ? t("common.loading") : t("auth.login")}
                </button>
              </form>
              <p className="text-center text-sm text-muted-foreground mt-5">
                {t("auth.noAccount")}{" "}
                <button onClick={() => setMode("register")} className="text-primary font-medium hover:underline">{t("auth.register")}</button>
              </p>
            </>
          )}

          {mode === "register" && (
            <>
              <h2 className="text-xl font-semibold mb-6">{t("auth.register")}</h2>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5">Имя пользователя</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Иван" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{t("auth.email")}</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">{t("auth.password")}</label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="минимум 6 символов" className={inputClass + " pr-11"} />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full py-3 bg-primary hover:opacity-90 text-primary-foreground font-medium rounded-2xl transition disabled:opacity-50 shadow-lg shadow-primary/25">
                  {loading ? t("common.loading") : t("auth.register")}
                </button>
              </form>
              <p className="text-center text-sm text-muted-foreground mt-5">
                {t("auth.hasAccount")}{" "}
                <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">{t("auth.login")}</button>
              </p>
            </>
          )}

          {mode === "forgot" && (
            <>
              <h2 className="text-xl font-semibold mb-2">{t("auth.resetPassword")}</h2>
              <p className="text-sm text-muted-foreground mb-6">Введите email — вышлем код для восстановления.</p>
              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5">{t("auth.email")}</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className={inputClass} />
                </div>
                <button type="submit" disabled={loading} className="w-full py-3 bg-primary hover:opacity-90 text-primary-foreground font-medium rounded-2xl transition disabled:opacity-50 shadow-lg shadow-primary/25">
                  {loading ? t("common.loading") : t("auth.sendCode")}
                </button>
              </form>
              <button onClick={() => setMode("login")} className="text-center w-full text-sm text-primary hover:underline mt-5 block">← {t("common.back")}</button>
            </>
          )}

          {mode === "verify" && (
            <>
              <h2 className="text-xl font-semibold mb-2">{t("auth.confirmEmail")}</h2>
              <p className="text-sm text-muted-foreground mb-6">Введите 6-значный код, отправленный на {email}</p>
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5">{t("auth.enterCode")}</label>
                  <input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} required placeholder="123456" maxLength={6} className={inputClass + " text-center text-2xl tracking-widest"} />
                </div>
                <button type="submit" disabled={loading || code.length !== 6} className="w-full py-3 bg-primary hover:opacity-90 text-primary-foreground font-medium rounded-2xl transition disabled:opacity-50 shadow-lg shadow-primary/25">
                  {loading ? t("common.loading") : t("auth.verify")}
                </button>
              </form>
              <button onClick={() => setMode("login")} className="text-center w-full text-sm text-primary hover:underline mt-5 block">← {t("common.back")}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
