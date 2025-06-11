import { supabase } from "@/utils/supabase/client";
import { getRandomImageUrl } from "@/lib/generate-image";

/**
 * Available tools for DAO agents
 */
const daoTools = [
  // DAO tools
  "dao_list",
  "dao_get_by_name",
  "dao_core_get_linked_voting_contracts",
  // Contract tools
  "contract_sip10_info",
  "contract_dao_deploy",
  "contract_fetch_source",
  // Stacks tools
  "stacks_transaction_status",
  "stacks_transaction_details",
  "stacks_transactions_by_address",
  "stacks_get_stx_price",
  "stacks_get_contract_info",
  "stacks_get_principal_address_balance",
  // Wallet tools
  "wallet_get_my_balance",
  "wallet_get_my_address",
  "wallet_send_stx",
  "wallet_get_my_transactions",
  "wallet_send_sip10_token",
  // DEX tools (only DAO-related)
  "faktory_get_dao_tokens",
  // External integrations
  "twitter_post_tweet",
  "send_telegram_notification",
];

/**
 * Default tasks for DAO agents
 */
const tasks = [
  {
    name: "Daily DAO Overview",
    prompt:
      "Generate a daily report on the DAO's activities including new proposals, voting trends, and treasury balance. Use the dao_list and dao_get_by_name tools to gather information about the DAO.",
    cron: "0 9 * * *", // Daily at 9 AM
  },
  {
    name: "Proposal Monitoring",
    prompt:
      "Monitor new and ongoing proposals. Use the dao_core_get_linked_voting_contracts tool to check for new proposals and summarize their key points and voting progress. Alert if any proposals are nearing deadline or require attention.",
    cron: "0 */4 * * *", // Every 4 hours
  },
  {
    name: "Treasury Management",
    prompt:
      "Review the DAO's treasury balance using the stacks_get_principal_address_balance tool. Analyze recent transactions with stacks_transactions_by_address. Suggest potential investment or utilization strategies based on current market conditions.",
    cron: "0 12 * * *", // Daily at 12 PM
  },
  {
    name: "Token Analysis",
    prompt:
      "Analyze the DAO's token using contract_sip10_info and faktory_get_dao_tokens. Provide insights on token distribution, liquidity, and any significant changes.",
    cron: "0 1 * * *", // Daily at 1 AM
  },
  {
    name: "Community Engagement",
    prompt:
      "Draft a tweet summarizing recent DAO achievements or upcoming events using the gathered information. Use the twitter_post_tweet tool to post it after approval. Send a notification about the tweet using send_telegram_notification.",
    cron: "0 15 * * *", // Daily at 3 PM
  },
];

/**
 * Creates a DAO agent with associated tasks for the current user
 * @returns Promise<Agent | null> - The created agent or null if user already has one
 * @throws Error if creation fails
 */
export async function createDaoAgent() {
  try {
    // Get the current user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    if (!session) throw new Error("No authenticated session found");

    const profile_id = session.user.id;

    // Check if user already has a DAO agent
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("has_dao_agent")
      .eq("id", profile_id)
      .single();

    if (profileError) throw profileError;

    // If user already has a DAO agent, return null
    if (profile.has_dao_agent) {
      console.log("User already has a DAO agent, skipping creation");
      return null;
    }

    // Create Agent
    const agentData = {
      name: "DAO Manager",
      role: "Comprehensive DAO Operations Manager",
      goal: "Efficiently manage all aspects of DAO operations including governance, treasury, token analysis, and community engagement.",
      backstory:
        "I am an AI agent specialized in DAO operations on the Stacks blockchain. I leverage various tools to provide comprehensive management and insights for DAOs.",
      image_url: getRandomImageUrl(),
      profile_id,
      agent_tools: daoTools,
    };

    const { data: agentResult, error: agentError } = await supabase
      .from("agents")
      .insert(agentData)
      .select()
      .single();

    if (agentError) throw agentError;

    // Create Tasks
    const tasksData = tasks.map((task) => ({
      ...task,
      agent_id: agentResult.id,
      is_scheduled: false,
      profile_id,
    }));

    const { error: tasksError } = await supabase
      .from("tasks")
      .insert(tasksData);

    if (tasksError) {
      // Rollback agent creation if tasks fail
      await supabase.from("agents").delete().eq("id", agentResult.id);
      throw tasksError;
    }

    // Update the profile to indicate that the user now has a DAO agent
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ has_dao_agent: true })
      .eq("id", profile_id);

    if (updateError) throw updateError;

    console.log("DAO Manager agent and tasks created successfully");
    return agentResult;
  } catch (error) {
    console.error("Error creating DAO Manager agent and tasks:", error);
    throw error;
  }
}
