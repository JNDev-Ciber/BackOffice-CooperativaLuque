import { supabase } from "../supabaseClient";

export async function fetchTVPlans() {
  const { data, error } = await supabase
    .from("tv_plans")
    .select("*")
    .order("id", { ascending: false });

  if (error) throw error;
  return data;
}

export async function rpcCreateTVPlan(payload) {
  const { data, error } = await supabase.rpc("create_tv_plan", payload);
  if (error) throw error;
  return data;
}

export async function rpcUpdateTVPlan(id, payload) {
  const { error } = await supabase.rpc("update_tv_plan", {
    p_id: id,
    ...payload,
  });

  if (error) throw error;
}

export async function rpcDeleteTVPlan(id) {
  const { error } = await supabase.rpc("delete_tv_plan", {
    p_id: id,
  });

  if (error) throw error;
}