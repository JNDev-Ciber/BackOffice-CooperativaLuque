import { supabase } from "../supabaseClient";

export async function fetchCellularPlans() {
  const { data, error } = await supabase
    .from("cellular_telephony_plans")
    .select("*")
    .order("id", { ascending: false });

  if (error) throw error;
  return data;
}

export async function rpcCreateCellularPlan(payload) {
  const { data, error } = await supabase.rpc(
    "create_cellular_telephony_plan",
    payload
  );

  if (error) throw error;
  return data;
}

export async function rpcUpdateCellularPlan(id, payload) {
  const { error } = await supabase.rpc(
    "update_cellular_telephony_plan",
    {
      p_id: id,
      ...payload,
    }
  );

  if (error) throw error;
}

export async function rpcDeleteCellularPlan(id) {
  const { error } = await supabase.rpc(
    "delete_cellular_telephony_plan",
    {
      p_id: id,
    }
  );

  if (error) throw error;
}