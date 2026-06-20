import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

type Theme = "light" | "dark";
type Lang = "ru" | "en";

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const translations: Record<Lang, Record<string, string>> = {
  ru: {
    "nav.dashboard": "Главная",
    "nav.cards": "Мои карты",
    "nav.family": "Семья",
    "nav.settings": "Настройки",
    "auth.login": "Войти",
    "auth.register": "Регистрация",
    "auth.email": "Email",
    "auth.password": "Пароль",
    "auth.forgotPassword": "Забыли пароль?",
    "auth.noAccount": "Нет аккаунта?",
    "auth.hasAccount": "Уже есть аккаунт?",
    "auth.logout": "Выйти",
    "auth.confirmEmail": "Подтверждение email",
    "auth.resetPassword": "Восстановление пароля",
    "auth.enterCode": "Введите 6-значный код",
    "auth.sendCode": "Отправить код",
    "auth.verify": "Подтвердить",
    "dashboard.title": "Лучший кешбек",
    "dashboard.subtitle": "Категории этого месяца",
    "dashboard.search": "Поиск категорий...",
    "dashboard.sortBy": "Сортировка",
    "dashboard.filter": "Фильтр",
    "dashboard.bank": "Банк",
    "dashboard.category": "Категория",
    "dashboard.cashback": "Кешбек",
    "dashboard.noCategories": "Нет категорий. Добавьте карту!",
    "cards.title": "Мои карты",
    "cards.add": "Добавить карту",
    "cards.empty": "У вас нет карт. Добавьте первую!",
    "cards.delete": "Удалить",
    "cards.edit": "Редактировать",
    "cards.name": "Название карты",
    "cards.bank": "Банк",
    "cards.limit": "Лимит кешбека (₽)",
    "cards.uploadScreenshot": "Загрузить скриншот категорий",
    "cards.categories": "Категории кешбека",
    "cards.addCategory": "Добавить категорию",
    "cards.categoryName": "Название",
    "cards.categoryPercent": "Процент",
    "cards.save": "Сохранить",
    "cards.cancel": "Отмена",
    "family.title": "Моя семья",
    "family.members": "Участники",
    "family.invite": "Пригласить",
    "family.inviteLink": "Ссылка-приглашение",
    "family.copyLink": "Копировать ссылку",
    "family.owner": "Владелец",
    "family.member": "Участник",
    "family.remove": "Удалить",
    "family.bestCashback": "Лучший кешбек семьи",
    "family.createFamily": "Создать семью",
    "family.joinFamily": "Войти в семью",
    "family.familyName": "Название семьи",
    "family.inviteCode": "Код приглашения",
    "family.noFamily": "Вы не состоите в семье",
    "settings.title": "Настройки",
    "settings.language": "Язык",
    "settings.support": "Поддержка",
    "settings.telegram": "Telegram",
    "settings.logout": "Выйти из аккаунта",
    "settings.theme": "Тема",
    "settings.light": "Светлая",
    "settings.dark": "Тёмная",
    "common.loading": "Загрузка...",
    "common.error": "Ошибка",
    "common.success": "Успешно",
    "common.save": "Сохранить",
    "common.cancel": "Отмена",
    "common.delete": "Удалить",
    "common.confirm": "Подтвердить",
    "common.back": "Назад",
    "common.copied": "Скопировано!",
  },
  en: {
    "nav.dashboard": "Dashboard",
    "nav.cards": "My Cards",
    "nav.family": "Family",
    "nav.settings": "Settings",
    "auth.login": "Sign In",
    "auth.register": "Sign Up",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.forgotPassword": "Forgot password?",
    "auth.noAccount": "No account?",
    "auth.hasAccount": "Already have an account?",
    "auth.logout": "Sign Out",
    "auth.confirmEmail": "Confirm Email",
    "auth.resetPassword": "Reset Password",
    "auth.enterCode": "Enter 6-digit code",
    "auth.sendCode": "Send Code",
    "auth.verify": "Verify",
    "dashboard.title": "Best Cashback",
    "dashboard.subtitle": "This month's categories",
    "dashboard.search": "Search categories...",
    "dashboard.sortBy": "Sort by",
    "dashboard.filter": "Filter",
    "dashboard.bank": "Bank",
    "dashboard.category": "Category",
    "dashboard.cashback": "Cashback",
    "dashboard.noCategories": "No categories. Add a card!",
    "cards.title": "My Cards",
    "cards.add": "Add Card",
    "cards.empty": "You have no cards. Add the first one!",
    "cards.delete": "Delete",
    "cards.edit": "Edit",
    "cards.name": "Card Name",
    "cards.bank": "Bank",
    "cards.limit": "Cashback Limit",
    "cards.uploadScreenshot": "Upload Screenshot",
    "cards.categories": "Cashback Categories",
    "cards.addCategory": "Add Category",
    "cards.categoryName": "Name",
    "cards.categoryPercent": "Percent",
    "cards.save": "Save",
    "cards.cancel": "Cancel",
    "family.title": "My Family",
    "family.members": "Members",
    "family.invite": "Invite",
    "family.inviteLink": "Invite Link",
    "family.copyLink": "Copy Link",
    "family.owner": "Owner",
    "family.member": "Member",
    "family.remove": "Remove",
    "family.bestCashback": "Family Best Cashback",
    "family.createFamily": "Create Family",
    "family.joinFamily": "Join Family",
    "family.familyName": "Family Name",
    "family.inviteCode": "Invite Code",
    "family.noFamily": "You are not in a family",
    "settings.title": "Settings",
    "settings.language": "Language",
    "settings.support": "Support",
    "settings.telegram": "Telegram",
    "settings.logout": "Sign Out",
    "settings.theme": "Theme",
    "settings.light": "Light",
    "settings.dark": "Dark",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.confirm": "Confirm",
    "common.back": "Back",
    "common.copied": "Copied!",
  },
};

const AppContext = createContext<AppContextType>({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
  lang: "ru",
  setLang: () => {},
  t: (k) => k,
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem("theme") as Theme) || "light";
  });
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem("lang") as Lang) || "ru";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setThemeState((t) => (t === "light" ? "dark" : "light"));
  const setTheme = (t: Theme) => setThemeState(t);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  };

  const t = (key: string) => translations[lang][key] || key;

  return (
    <AppContext.Provider value={{ theme, toggleTheme, setTheme, lang, setLang, t }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
