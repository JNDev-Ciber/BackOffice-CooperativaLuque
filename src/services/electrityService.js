import { supabase } from "../supabaseClient";

export async function fetchElectrityPlans() {
  const { data, error } = await supabase
    .from("electrity_plans")
    .select("*")
    .order("price", { ascending: true });

  if (error) throw error;
  return data;
}

export async function rpcCreateElectrityPlan(payload) {
  const { data, error } = await supabase.rpc(
    "create_electrity_plan",
    payload
  );

  if (error) throw error;
  return data;
}

export async function rpcUpdateElectrityPlan(id, payload) {
  const { error } = await supabase.rpc("update_electrity_plan", {
    p_id: id,
    ...payload,
  });

  if (error) throw error;
}

export async function rpcDeleteElectrityPlan(id) {
  const { error } = await supabase.rpc("delete_electrity_plan", {
    p_id: id,
  });

  if (error) throw error;
}