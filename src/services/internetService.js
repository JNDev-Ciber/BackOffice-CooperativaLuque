import { supabase } from "../supabaseClient";

export async function fetchPlans() {
  const { data, error } = await supabase
    .from("internet_plans")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function rpcCreatePlan(payload) {
  const { data, error } = await supabase.rpc("create_internet_plan", payload);
  if (error) throw error;
  return data;
}

export async function rpcUpdatePlan(id, payload) {
  const { error } = await supabase.rpc("update_internet_plan", { p_id: id, ...payload });
  if (error) throw error;
}

export async function rpcDeletePlan(id) {
  const { error } = await supabase.rpc("delete_internet_plan", { p_id: id });
  if (error) throw error;
}