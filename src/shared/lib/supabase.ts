import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://ahxmxybzfizomsqosqmz.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoeG14eWJ6Zml6b21zcW9zcW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3OTI4NDIsImV4cCI6MjA5NzM2ODg0Mn0.2yRp0RJ8Irzj7r--5XPefjlfT8W7eThj62l-MfuOEOs";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
