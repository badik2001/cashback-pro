export interface Profile {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  family_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Family {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
  profile?: Profile;
}

export interface Card {
  id: string;
  user_id: string;
  name: string;
  bank_name: string;
  bank_color: string;
  image_url?: string;
  cashback_limit?: number;
  created_at: string;
  updated_at: string;
  cashback_categories?: CashbackCategory[];
}

export interface CashbackCategory {
  id: string;
  card_id: string;
  name: string;
  percent: number;
  created_at: string;
}

export interface Language {
  code: "ru" | "en";
  label: string;
}
