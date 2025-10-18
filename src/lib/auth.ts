import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type UserRole = "manager" | "karyawan" | "pkl";
export type Division = "konten_kreator" | "host_live" | "model" | "manager";

export interface UserMetadata {
  id: string;
  full_name: string;
  username: string;
  role: UserRole;
  division?: Division;
  profile?: any;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signUp(email: string, password: string, metadata: {
  full_name: string;
  username: string;
  role?: UserRole;
  division?: Division;
}) {
  const redirectUrl = `${window.location.origin}/`;
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: metadata,
    },
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUserMetadata(userId: string): Promise<UserMetadata | null> {
  const { data, error } = await supabase
    .from("users_meta")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user metadata:", error);
    return null;
  }

  return data;
}

export async function isManager(userId?: string): Promise<boolean> {
  if (!userId) return false;
  
  const metadata = await getUserMetadata(userId);
  return metadata?.role === "manager";
}
