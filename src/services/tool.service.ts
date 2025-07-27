import type { Tool } from "@/types";

/**
 * Fetches all available tools from the API
 *
 * @returns Promise resolving to an array of Tool objects
 *
 * Query key: ['tools']
 * Stale time: 10 minutes (tools don't change often)
 */
export async function fetchTools(): Promise<Tool[]> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tools/available`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch tools: ${response.status}`);
    }

    return (await response.json()) as Tool[];
  } catch (error) {
    console.error("Failed to fetch tools:", error);
    throw new Error("Failed to fetch tools from API");
  }
}

/**
 * Helper function to filter tools by category
 *
 * @param tools Array of Tool objects
 * @param category Category to filter by
 * @returns Filtered array of tools
 */
export const filterToolsByCategory = (
  tools: Tool[],
  category: string
): Tool[] => {
  return tools.filter((tool) => tool.category === category);
};

/**
 * Helper function to filter tools by IDs
 *
 * @param tools Array of Tool objects
 * @param ids Array of tool IDs to include
 * @returns Filtered array of tools
 */
export const filterToolsByIds = (tools: Tool[], ids: string[]): Tool[] => {
  return tools.filter((tool) => ids.includes(tool.id));
};

/**
 * Helper function to find a specific tool by ID
 *
 * @param tools Array of Tool objects
 * @param id Tool ID to find
 * @returns Tool object or undefined if not found
 */
export const findToolById = (tools: Tool[], id: string): Tool | undefined => {
  return tools.find((tool) => tool.id === id);
};

/**
 * Helper function to get all available tool IDs
 *
 * @param tools Array of Tool objects
 * @returns Array of tool IDs
 */
export const getToolIds = (tools: Tool[]): string[] => {
  return tools.map((tool) => tool.id);
};

/**
 * Execute a buy operation for DAO tokens
 *
 * @param accessToken - User's access token
 * @param btcAmount - Amount of BTC to spend (as string)
 * @param contractPrincipal - DAO token contract address
 * @param slippage - Slippage tolerance (default: "15")
 * @returns Promise resolving to ApiResponse
 */
export async function executeBuy(
  accessToken: string,
  btcAmount: string,
  contractPrincipal: string,
  slippage: string = "15"
): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tools/faktory/execute_buy?token=${encodeURIComponent(
        accessToken
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          btc_amount: btcAmount,
          dao_token_dex_contract_address: contractPrincipal,
          slippage,
        }),
      }
    );

    return (await response.json()) as ApiResponse;
  } catch (error) {
    console.error("Failed to execute buy:", error);
    throw new Error("Failed to execute buy operation");
  }
}

/**
 * Submit a DAO proposal to send a message
 *
 * @param accessToken - User's access token
 * @param payload - Proposal payload with extension data
 * @returns Promise resolving to ApiResponse
 */
export async function proposeSendMessage(
  accessToken: string,
  payload: {
    agent_account_contract: string;
    action_proposals_voting_extension: string;
    action_proposal_contract_to_execute: string;
    dao_token_contract_address: string;
    message: string;
    memo: string;
  }
): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tools/dao/action_proposals/propose_send_message?token=${encodeURIComponent(
        accessToken
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    return (await response.json()) as ApiResponse;
  } catch (error) {
    console.error("Failed to propose send message:", error);
    throw new Error("Failed to submit proposal");
  }
}

/**
 * Submit a veto proposal for a DAO action
 *
 * @param accessToken - User's access token
 * @param payload - Veto payload with contract and proposal ID
 * @returns Promise resolving to ApiResponse
 */
export async function vetoProposal(
  accessToken: string,
  payload: {
    dao_action_proposal_voting_contract: string;
    proposal_id: string;
  }
): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tools/dao/action_proposals/veto_proposal?token=${encodeURIComponent(
        accessToken
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    return (await response.json()) as ApiResponse;
  } catch (error) {
    console.error("Failed to veto proposal:", error);
    throw new Error("Failed to submit veto proposal");
  }
}

/**
 * Generate AI-powered proposal recommendations for a DAO
 *
 * @param accessToken - User's access token
 * @param request - Recommendation request parameters
 * @returns Promise resolving to ProposalRecommendationResult
 */
export async function generateProposalRecommendation(
  accessToken: string,
  request: {
    dao_id: string;
    focus_area?: string;
    specific_needs?: string;
    model_name?: string;
    temperature?: number;
  }
): Promise<ProposalRecommendationResult> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tools/dao/proposal_recommendations/generate?token=${encodeURIComponent(
        accessToken
      )}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return (await response.json()) as ProposalRecommendationResult;
  } catch (error) {
    console.error("Failed to generate proposal recommendation:", error);
    throw new Error("Failed to generate AI proposal recommendation");
  }
}

/**
 * Fund testnet wallet with sBTC from Faktory faucet
 *
 * @param accessToken - User's access token
 * @returns Promise resolving to ApiResponse
 */
export async function fundTestnetSBTC(
  accessToken: string
): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tools/faktory/fund_testnet_sbtc?token=${encodeURIComponent(
        accessToken
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }
    );

    return (await response.json()) as ApiResponse;
  } catch (error) {
    console.error("Failed to fund testnet sBTC:", error);
    throw new Error("Failed to request testnet sBTC from faucet");
  }
}

/**
 * Fund testnet wallet with STX from faucet
 *
 * @param accessToken - User's access token
 * @returns Promise resolving to ApiResponse
 */
export async function fundTestnetSTX(
  accessToken: string
): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tools/wallet/fund_testnet_faucet?token=${encodeURIComponent(
        accessToken
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }
    );

    return (await response.json()) as ApiResponse;
  } catch (error) {
    console.error("Failed to fund testnet STX:", error);
    throw new Error("Failed to request testnet STX from faucet");
  }
}

// Type definitions for the new service functions
export interface ApiResponse {
  output: string;
  error: string | null;
  success: boolean;
}

export interface ProposalRecommendationRequest {
  dao_id: string;
  focus_area?: string;
  specific_needs?: string;
  model_name?: string;
  temperature?: number;
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
}

export interface TokenUsageBreakdown {
  proposal_recommendation_agent: TokenUsage;
}

export type ProposalPriority = "high" | "medium" | "low";

export interface ProposalRecommendationResponse {
  title: string;
  content: string;
  rationale: string;
  priority: ProposalPriority;
  estimated_impact: string;
  suggested_action?: string;
  dao_id: string;
  dao_name: string;
  proposals_analyzed: number;
  token_usage: TokenUsageBreakdown;
}

export interface ProposalRecommendationError {
  error: string;
  title: "";
  content: "";
  rationale: string;
  priority: "low";
  estimated_impact: "None";
  dao_id?: string;
  dao_name?: string;
}

export type ProposalRecommendationResult =
  | ProposalRecommendationResponse
  | ProposalRecommendationError;

/**
 * Type guard to check if the response is an error
 */
export function isProposalRecommendationError(
  result: ProposalRecommendationResult
): result is ProposalRecommendationError {
  return "error" in result;
}

/**
 * Fetch default prompts for proposal evaluation
 *
 * @param accessToken - User's access token
 * @returns Promise resolving to DefaultPrompts
 */
export async function fetchDefaultPrompts(
  accessToken: string
): Promise<DefaultPrompts> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tools/evaluation/default_prompts`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch default prompts: ${response.status}`);
    }

    return (await response.json()) as DefaultPrompts;
  } catch (error) {
    console.error("Failed to fetch default prompts:", error);
    throw new Error("Failed to fetch default prompts");
  }
}

/**
 * Evaluate a proposal using comprehensive AI analysis
 *
 * @param accessToken - User's access token
 * @param request - Evaluation request parameters
 * @returns Promise resolving to EvaluationResult
 */
export async function evaluateProposal(
  accessToken: string,
  request: {
    proposal_id: string;
    dao_id: string;
    custom_system_prompt: string;
    custom_user_prompt: string;
    config: {
      model_name: string;
      temperature: number;
      approval_threshold: number;
    };
  }
): Promise<EvaluationResult> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tools/evaluation/comprehensive`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server error: ${response.status}`);
    }

    const responseData = await response.json();

    // Handle nested response structure
    if (responseData.evaluation) {
      return responseData.evaluation as EvaluationResult;
    }

    // Fallback for flat response structure
    return responseData as EvaluationResult;
  } catch (error) {
    console.error("Evaluation error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to evaluate proposal"
    );
  }
}

// Type definitions for evaluation services
export interface DefaultPrompts {
  system_prompt: string;
  user_prompt_template: string;
}

export interface EvaluationCategory {
  category: string;
  score: number;
  weight: number;
  reasoning: string[];
}

export interface EvaluationResult {
  proposal_id: string;
  categories: EvaluationCategory[];
  final_score: number;
  decision: boolean;
  explanation: string;
  flags: string[];
  summary: string;
  token_usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    model_name: string;
  };
  images_processed: number;
}
