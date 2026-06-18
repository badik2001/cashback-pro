import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../shared/lib/supabase";
import { useAuth } from "../../shared/hooks/useAuth";
import { useApp } from "../../shared/hooks/useApp";
import { Users, Crown, Copy, Trash2, TrendingUp, Plus, LogIn } from "lucide-react";
import { toast } from "sonner";
import type { Card } from "../../shared/types";

interface FamilyCategoryItem {
  name: string;
  percent: number;
  memberName: string;
  bankName: string;
  cardName: string;
}

export default function FamilyPage() {
  const { user } = useAuth();
  const { t } = useApp();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const { data: myFamily, isLoading } = useQuery({
    queryKey: ["family", user?.id],
    queryFn: async () => {
      // Get profile to find family_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("family_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.family_id) return null;

      const { data: family } = await supabase
        .from("families")
        .select("*")
        .eq("id", profile.family_id)
        .single();

      const { data: members } = await supabase
        .from("family_members")
        .select("*, profiles(id, username, email)")
        .eq("family_id", profile.family_id);

      return { family, members: members || [] };
    },
    enabled: !!user,
  });

  const { data: familyCategories = [] } = useQuery<FamilyCategoryItem[]>({
    queryKey: ["family-categories", myFamily?.family?.id],
    queryFn: async () => {
      if (!myFamily?.members) return [];
      const memberIds = myFamily.members.map((m: any) => m.user_id);
      const { data: cards } = await supabase
        .from("cards")
        .select("*, cashback_categories(*)")
        .in("user_id", memberIds);

      const result: FamilyCategoryItem[] = [];
      for (const card of (cards || []) as Card[]) {
        const member = myFamily.members.find((m: any) => m.user_id === card.user_id);
        const memberName = member?.profiles?.username || member?.profiles?.email || "Участник";
        for (const cat of (card.cashback_categories || [])) {
          result.push({
            name: cat.name,
            percent: cat.percent,
            memberName,
            bankName: card.bank_name,
            cardName: card.name,
          });
        }
      }
      return result.sort((a, b) => b.percent - a.percent);
    },
    enabled: !!myFamily?.members,
  });

  const createFamily = useMutation({
    mutationFn: async (name: string) => {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: family, error } = await supabase
        .from("families")
        .insert({ name, owner_id: user!.id, invite_code: code })
        .select()
        .single();
      if (error) throw error;

      await supabase.from("family_members").insert({
        family_id: family.id,
        user_id: user!.id,
        role: "owner",
      });
      await supabase.from("profiles").update({ family_id: family.id }).eq("id", user!.id);
      return family;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["family"] });
      setShowCreate(false);
      setFamilyName("");
      toast.success("Семья создана!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const joinFamily = useMutation({
    mutationFn: async (code: string) => {
      const { data: family, error } = await supabase
        .from("families")
        .select("*")
        .eq("invite_code", code.toUpperCase())
        .single();
      if (error || !family) throw new Error("Семья не найдена");

      await supabase.from("family_members").insert({
        family_id: family.id,
        user_id: user!.id,
        role: "member",
      });
      await supabase.from("profiles").update({ family_id: family.id }).eq("id", user!.id);
      return family;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["family"] });
      setShowJoin(false);
      setInviteCode("");
      toast.success("Вы вступили в семью!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMember = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("family_members")
        .delete()
        .eq("family_id", myFamily!.family!.id)
        .eq("user_id", userId);
      if (error) throw error;
      await supabase.from("profiles").update({ family_id: null }).eq("id", userId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["family"] });
      toast.success("Участник удалён");
    },
  });

  const copyInviteLink = () => {
    if (!myFamily?.family) return;
    const link = `${window.location.origin}/invite/${myFamily.family.invite_code}`;
    navigator.clipboard.writeText(link);
    toast.success(t("common.copied"));
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
        <div className="h-8 w-32 bg-muted animate-pulse rounded-xl" />
        <div className="h-40 bg-muted animate-pulse rounded-2xl" />
      </div>
    );
  }

  // No family
  if (!myFamily?.family) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-2">{t("family.title")}</h1>
        <p className="text-muted-foreground text-sm mb-8">{t("family.noFamily")}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => setShowCreate(true)}
            className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-border hover:border-blue-400 rounded-2xl transition text-center group"
          >
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">{t("family.createFamily")}</p>
              <p className="text-xs text-muted-foreground mt-1">Создайте и пригласите близких</p>
            </div>
          </button>
          <button
            onClick={() => setShowJoin(true)}
            className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-border hover:border-green-400 rounded-2xl transition text-center group"
          >
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition">
              <LogIn className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">{t("family.joinFamily")}</p>
              <p className="text-xs text-muted-foreground mt-1">Введите код приглашения</p>
            </div>
          </button>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
              <h3 className="font-semibold text-lg mb-4">{t("family.createFamily")}</h3>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder={t("family.familyName")}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground mb-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-accent transition">
                  {t("common.cancel")}
                </button>
                <button
                  onClick={() => familyName && createFamily.mutate(familyName)}
                  disabled={!familyName || createFamily.isPending}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-50"
                >
                  {createFamily.isPending ? "..." : t("common.confirm")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Join modal */}
        {showJoin && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
              <h3 className="font-semibold text-lg mb-4">{t("family.joinFamily")}</h3>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder={t("family.inviteCode")}
                maxLength={6}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-center text-xl font-mono tracking-widest mb-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowJoin(false)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-accent transition">
                  {t("common.cancel")}
                </button>
                <button
                  onClick={() => inviteCode.length === 6 && joinFamily.mutate(inviteCode)}
                  disabled={inviteCode.length !== 6 || joinFamily.isPending}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-50"
                >
                  {joinFamily.isPending ? "..." : t("family.joinFamily")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const isOwner = myFamily.family.owner_id === user?.id;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{myFamily.family.name}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{myFamily.members.length} участников</p>
      </div>

      {/* Best Family Cashback — main block */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5" />
          <h2 className="font-semibold">{t("family.bestCashback")}</h2>
        </div>
        {familyCategories.length === 0 ? (
          <p className="text-blue-200 text-sm">Участники ещё не добавили карты</p>
        ) : (
          <div className="space-y-2.5">
            {familyCategories.slice(0, 8).map((cat, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white/10 rounded-xl px-3 py-2.5">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {cat.percent}%
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{cat.name}</p>
                  <p className="text-blue-200 text-xs truncate">{cat.memberName} · {cat.bankName}</p>
                </div>
                <span className="text-white font-bold text-lg shrink-0">{cat.percent}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-medium text-foreground text-sm">{t("family.inviteLink")}</p>
            <p className="text-xs text-muted-foreground">Код: <span className="font-mono font-bold">{myFamily.family.invite_code}</span></p>
          </div>
          <button
            onClick={copyInviteLink}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
          >
            <Copy className="w-3.5 h-3.5" />
            {t("family.copyLink")}
          </button>
        </div>
      </div>

      {/* Members */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <Users className="w-4 h-4" />
            {t("family.members")}
          </h3>
        </div>
        <div className="divide-y divide-border">
          {myFamily.members.map((member: any) => (
            <div key={member.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                {(member.profiles?.username || member.profiles?.email || "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">
                  {member.profiles?.username || member.profiles?.email}
                </p>
                <div className="flex items-center gap-1.5">
                  {member.role === "owner" ? (
                    <span className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                      <Crown className="w-3 h-3" />
                      {t("family.owner")}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t("family.member")}</span>
                  )}
                </div>
              </div>
              {isOwner && member.user_id !== user?.id && (
                <button
                  onClick={() => removeMember.mutate(member.user_id)}
                  className="text-muted-foreground hover:text-destructive transition p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
