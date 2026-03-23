import { supabase } from "../supabaseClient";

const STORAGE_KEY = "bol_user";

export function getStoredUser() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function loginWithUsernamePassword(username, password) {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, password")
    .eq("username", username)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Usuario o contraseña inválidos");
  if (data.password !== password) throw new Error("Usuario o contraseña inválidos");

  const user = { id: data.id, username: data.username };
  setStoredUser(user);
  return user;
}

export async function logout() {
  clearStoredUser();
}
