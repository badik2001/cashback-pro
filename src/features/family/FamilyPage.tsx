import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../shared/lib/supabase";
import { useAuth } from "../../shared/hooks/useAuth";
import { useApp } from "../../shared/hooks/useApp";
import { Users, Crown, Copy, Trash2, TrendingUp, Plus, LogIn } from "lucide-react";
import { toast } from "sonner";
import type { Card, FamilyMember } from "../../shared/types";

interface FamilyCategoryItem {
  name: string;
  percent: number;
  memberName: string;
  bankName: string;
  cardName: string;
}

const inputClass =
  "w-full px-3.5 py-2.5 rounded-2xl border border-border bg-white/40 dark:bg-white/[0.06] backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition";

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
      const { data: profile } = await supabase.from("profiles").select("family_id").eq("id", user!.id).single();
      if (!profile?.family_id) return null;

      const { data: family } = await supabase.from("families").select("*").eq("id", profile.family_id).single();
      const { data: members } = await supabase
        .from("family_members")
        .select("*, profile:profiles(id, username, email)")
        .eq("family_id", profile.family_id);

      return { family, members: (members || []) as unknown as FamilyMember[] };
    },
    enabled: !!user,
  });

  const { data: familyCategories = [] } = useQuery<FamilyCategoryItem[]>({
    queryKey: ["family-categories", myFamily?.family?.id],
    queryFn: async () => {
      if (!myFamily?.members) return [];
      const memberIds = myFamily.members.map((m: FamilyMember) => m.user_id);
      const { data: cards } = await supabase.from("cards").select("*, cashback_categories(*)").in("user_id", memberIds);

      const result: FamilyCategoryItem[] = [];
      for (const card of (cards || []) as Card[]) {
        const member = myFamily.members.find((m: FamilyMember) => m.user_id === card.user_id);
        const memberName = member?.profile?.username || member?.profile?.email || "Участник";
        for (const cat of card.cashback_categories || []) {
          result.push({ name: cat.name, percent: cat.percent, memberName, bankName: card.bank_name, cardName: card.name });
        }
      }
      return result.sort((a, b) => b.percent - a.percent);
    },
    enabled: !!myFamily?.members,
  });

  const createFamily = useMutation({
    mutationFn: async (name: string) => {
      // create_family is a SECURITY DEFINER RPC (see supabase/fix_families_rls.sql)
      // that inserts the family + membership + updates the profile in one
      // atomic server-side call. Doing this as 3 separate client-side
      // inserts used to fail: the SELECT policy on `families` only allows
      // rows where the caller's profile.family_id already matches — which
      // it can't, the very first time, until the 3rd step runs. That
      // produced the "new row violates row-level security policy" error.
      // One RPC call instead of 3 round trips is also a lot faster.
      const { data, error } = await supabase.rpc("create_family", { p_name: name });
      if (error) throw error;
      return data?.[0];
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
      const { data, error } = await supabase.rpc("join_family", { p_invite_code: code });
      if (error) throw error;
      return data?.[0];
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
      const { error } = await supabase.from("family_members").delete().eq("family_id", myFamily!.family!.id).eq("user_id", userId);
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
        <div className="h-8 w-32 bg-white/20 dark:bg-white/[0.06] animate-pulse rounded-2xl" />
        <div className="h-40 bg-white/20 dark:bg-white/[0.06] animate-pulse rounded-3xl" />
      </div>
    );
  }

  if (!myFamily?.family) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-2">{t("family.title")}</h1>
        <p className="text-muted-foreground text-sm mb-8">{t("family.noFamily")}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <button onClick={() => setShowCreate(true)} className="glass flex flex-col items-center gap-3 p-6 rounded-3xl transition text-center hover:scale-[1.02]">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-md">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-medium text-foreground">{t("family.createFamily")}</p>
              <p className="text-xs text-muted-foreground mt-1">Создайте и пригласите близких</p>
            </div>
          </button>
          <button onClick={() => setShowJoin(true)} className="glass flex flex-col items-center gap-3 p-6 rounded-3xl transition text-center hover:scale-[1.02]">
            <div className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary-dark rounded-2xl flex items-center justify-center shadow-md">
              <LogIn className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-medium text-foreground">{t("family.joinFamily")}</p>
              <p className="text-xs text-muted-foreground mt-1">Введите код приглашения</p>
            </div>
          </button>
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-strong glass-sheen rounded-[2rem] w-full max-w-md p-6">
              <h3 className="font-semibold text-lg mb-4">{t("family.createFamily")}</h3>
              <input type="text" value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder={t("family.familyName")} className={inputClass + " mb-4"} />
              <div className="flex gap-3">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-border rounded-2xl text-sm font-medium text-foreground hover:bg-white/30 dark:hover:bg-white/10 transition">
                  {t("common.cancel")}
                </button>
                <button
                  onClick={() => familyName && createFamily.mutate(familyName)}
                  disabled={!familyName || createFamily.isPending}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-2xl text-sm font-medium transition disabled:opacity-50 shadow-lg shadow-primary/25"
                >
                  {createFamily.isPending ? "..." : t("common.confirm")}
                </button>
              </div>
            </div>
          </div>
        )}

        {showJoin && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-strong glass-sheen rounded-[2rem] w-full max-w-md p-6">
              <h3 className="font-semibold text-lg mb-4">{t("family.joinFamily")}</h3>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder={t("family.inviteCode")}
                maxLength={6}
                className={inputClass + " text-center text-xl font-mono tracking-widest mb-4"}
              />
              <div className="flex gap-3">
                <button onClick={() => setShowJoin(false)} className="flex-1 py-2.5 border border-border rounded-2xl text-sm font-medium text-foreground hover:bg-white/30 dark:hover:bg-white/10 transition">
                  {t("common.cancel")}
                </button>
                <button
                  onClick={() => inviteCode.length === 6 && joinFamily.mutate(inviteCode)}
                  disabled={inviteCode.length !== 6 || joinFamily.isPending}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-2xl text-sm font-medium transition disabled:opacity-50 shadow-lg shadow-primary/25"
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
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">{myFamily.family.name}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{myFamily.members.length} участников</p>
      </div>

      {/* Best Family Cashback */}
      <div className="glass-strong glass-sheen rounded-3xl p-5 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">{t("family.bestCashback")}</h2>
        </div>
        {familyCategories.length === 0 ? (
          <p className="text-muted-foreground text-sm">Участники ещё не добавили карты</p>
        ) : (
          <div className="space-y-2.5">
            {familyCategories.slice(0, 8).map((cat, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white/30 dark:bg-white/[0.06] rounded-2xl px-3 py-2.5 backdrop-blur-sm">
                <div className="w-8 h-8 bg-primary/15 rounded-xl flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                  {cat.percent}%
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate text-foreground">{cat.name}</p>
                  <p className="text-muted-foreground text-xs truncate">{cat.memberName} · {cat.bankName}</p>
                </div>
                <span className="text-primary font-semibold text-lg shrink-0">{cat.percent}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite */}
      <div className="glass rounded-3xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground text-sm">{t("family.inviteLink")}</p>
            <p className="text-xs text-muted-foreground">Код: <span className="font-mono font-semibold">{myFamily.family.invite_code}</span></p>
          </div>
          <button onClick={copyInviteLink} className="flex items-center gap-2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-xl transition shadow-md shadow-primary/25">
            <Copy className="w-3.5 h-3.5" />
            {t("family.copyLink")}
          </button>
        </div>
      </div>

      {/* Members */}
      <div className="glass rounded-3xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <Users className="w-4 h-4" />
            {t("family.members")}
          </h3>
        </div>
        <div className="divide-y divide-border">
          {myFamily.members.map((member: FamilyMember) => (
            <div key={member.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-md">
                {(member.profile?.username || member.profile?.email || "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{member.profile?.username || member.profile?.email}</p>
                {member.role === "owner" ? (
                  <span className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                    <Crown className="w-3 h-3" />
                    {t("family.owner")}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">{t("family.member")}</span>
                )}
              </div>
              {isOwner && member.user_id !== user?.id && (
                <button onClick={() => removeMember.mutate(member.user_id)} className="text-muted-foreground hover:text-destructive transition p-1">
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