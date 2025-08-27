import { supabase } from "@/services/supabase";
import type { Veto } from "@/types/veto";

// Interface for Veto with related data from Supabase
interface VetoWithRelations {
  id: string;
  created_at: string;
  updated_at: string;
  wallet_id: string | null;
  dao_id: string | null;
  agent_id: string | null;
  proposal_id: string | null;
  profile_id: string | null;
  tx_id: string | null;
  address: string | null;
  amount: string | null;
  contract_caller: string | null;
  tx_sender: string | null;
  vetoer_user_id: number | null;
  reasoning: string | null;
  agents: { id: string } | null;
}

// Helper function to check if vetos table exists
async function checkVetosTableExists(): Promise<boolean> {
  try {
    const { error } = await supabase.from("vetos").select("id").limit(1);
    return !error;
  } catch (error) {
    console.warn("Vetos table check failed:", error);
    return false;
  }
}

// Fetch all vetos with details
export async function fetchVetos(): Promise<Veto[]> {
  try {
    const tableExists = await checkVetosTableExists();
    if (!tableExists) {
      console.warn("Vetos table does not exist");
      return [];
    }

    const { data: vetosData, error } = await supabase
      .from("vetos")
      .select(
        `
        *,
        agents ( id )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Error fetching vetos:", error);
      return [];
    }

    if (!vetosData) {
      return [];
    }

    return vetosData.map((veto: VetoWithRelations) => ({
      id: veto.id,
      created_at: veto.created_at,
      updated_at: veto.updated_at,
      wallet_id: veto.wallet_id,
      dao_id: veto.dao_id,
      agent_id: veto.agent_id,
      proposal_id: veto.proposal_id,
      profile_id: veto.profile_id,
      tx_id: veto.tx_id,
      address: veto.address,
      amount: veto.amount,
      contract_caller: veto.contract_caller,
      tx_sender: veto.tx_sender,
      vetoer_user_id: veto.vetoer_user_id,
      reasoning: veto.reasoning,
    }));
  } catch (error) {
    console.warn("Failed to fetch vetos:", error);
    return [];
  }
}

// Fetch vetos for a specific proposal
export async function fetchProposalVetos(proposalId: string): Promise<Veto[]> {
  try {
    const tableExists = await checkVetosTableExists();
    if (!tableExists) {
      console.warn("Vetos table does not exist");
      return [];
    }

    const { data: vetosData, error } = await supabase
      .from("vetos")
      .select(
        `
        *,
        agents ( id )
      `
      )
      .eq("proposal_id", proposalId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Error fetching proposal vetos:", error);
      return [];
    }

    if (!vetosData) {
      return [];
    }

    return vetosData.map((veto: VetoWithRelations) => ({
      id: veto.id,
      created_at: veto.created_at,
      updated_at: veto.updated_at,
      wallet_id: veto.wallet_id,
      dao_id: veto.dao_id,
      agent_id: veto.agent_id,
      proposal_id: veto.proposal_id,
      profile_id: veto.profile_id,
      tx_id: veto.tx_id,
      address: veto.address,
      amount: veto.amount,
      contract_caller: veto.contract_caller,
      tx_sender: veto.tx_sender,
      vetoer_user_id: veto.vetoer_user_id,
      reasoning: veto.reasoning,
    }));
  } catch (error) {
    console.warn(`Failed to fetch vetos for proposal ${proposalId}:`, error);
    return [];
  }
}

// Fetch vetos for a specific DAO
export async function fetchDAOVetos(daoId: string): Promise<Veto[]> {
  try {
    const tableExists = await checkVetosTableExists();
    if (!tableExists) {
      console.warn("Vetos table does not exist");
      return [];
    }

    const { data: vetosData, error } = await supabase
      .from("vetos")
      .select(
        `
        *,
        agents ( id )
      `
      )
      .eq("dao_id", daoId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Error fetching DAO vetos:", error);
      return [];
    }

    if (!vetosData) {
      return [];
    }

    return vetosData.map((veto: VetoWithRelations) => ({
      id: veto.id,
      created_at: veto.created_at,
      updated_at: veto.updated_at,
      wallet_id: veto.wallet_id,
      dao_id: veto.dao_id,
      agent_id: veto.agent_id,
      proposal_id: veto.proposal_id,
      profile_id: veto.profile_id,
      tx_id: veto.tx_id,
      address: veto.address,
      amount: veto.amount,
      contract_caller: veto.contract_caller,
      tx_sender: veto.tx_sender,
      vetoer_user_id: veto.vetoer_user_id,
      reasoning: veto.reasoning,
    }));
  } catch (error) {
    console.warn(`Failed to fetch vetos for DAO ${daoId}:`, error);
    return [];
  }
}

// Create a new veto
export async function createVeto(
  veto: Omit<Veto, "id" | "created_at" | "updated_at">
): Promise<Veto | null> {
  try {
    const tableExists = await checkVetosTableExists();
    if (!tableExists) {
      console.warn("Vetos table does not exist, cannot create veto");
      return null;
    }

    const { data, error } = await supabase
      .from("vetos")
      .insert([veto])
      .select()
      .single();

    if (error) {
      console.warn("Error creating veto:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.warn("Failed to create veto:", error);
    return null;
  }
}

// Fetch a single veto by ID with details
export async function fetchVetoById(vetoId: string): Promise<Veto | null> {
  try {
    const tableExists = await checkVetosTableExists();
    if (!tableExists) {
      console.warn("Vetos table does not exist");
      return null;
    }

    const { data: vetoData, error } = await supabase
      .from("vetos")
      .select(
        `
        *,
        agents ( id )
      `
      )
      .eq("id", vetoId)
      .single();

    if (error) {
      console.warn("Error fetching veto by ID:", error);
      return null;
    }

    if (!vetoData) {
      return null;
    }

    const veto = vetoData as VetoWithRelations;
    return {
      id: veto.id,
      created_at: veto.created_at,
      updated_at: veto.updated_at,
      wallet_id: veto.wallet_id,
      dao_id: veto.dao_id,
      agent_id: veto.agent_id,
      proposal_id: veto.proposal_id,
      profile_id: veto.profile_id,
      tx_id: veto.tx_id,
      address: veto.address,
      amount: veto.amount,
      contract_caller: veto.contract_caller,
      tx_sender: veto.tx_sender,
      vetoer_user_id: veto.vetoer_user_id,
      reasoning: veto.reasoning,
    };
  } catch (error) {
    console.warn(`Failed to fetch veto ${vetoId}:`, error);
    return null;
  }
}

// Check if an agent has already vetoed a specific proposal
export async function checkAgentVetoStatus(
  proposalId: string,
  contractCaller: string
): Promise<Veto | null> {
  try {
    const tableExists = await checkVetosTableExists();
    if (!tableExists) {
      return null;
    }

    console.log("Checking veto status for:", { proposalId, contractCaller });

    // Try a more flexible approach - first check if any vetos exist for this proposal
    const { data: allVetos, error: listError } = await supabase
      .from("vetos")
      .select("*")
      .eq("proposal_id", proposalId);

    if (listError) {
      console.warn("Error fetching vetos for proposal:", listError);
      return null;
    }

    console.log("All vetos for proposal:", allVetos);

    // Find matching veto by contract_caller
    const matchingVeto = allVetos?.find(
      (veto) => veto.contract_caller === contractCaller
    );

    if (matchingVeto) {
      console.log("Found matching veto:", matchingVeto);
      return matchingVeto;
    }

    return null;
  } catch (error) {
    console.warn(
      `Failed to check veto status for proposal ${proposalId}:`,
      error
    );
    return null;
  }
}

/**
 * Helper function to format veto amounts (similar to vote formatting)
 * @param amount String representing raw veto amount
 * @returns Formatted string representation
 */
export function formatVetoAmount(amount: string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "0";
  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount === 0) return "0";
  // Assuming 1e8 (100,000,000) is the correct decimal place adjustment
  const adjustedAmount = numericAmount / 1e8;
  return adjustedAmount.toString(); // Or use .toLocaleString() for better formatting
}
