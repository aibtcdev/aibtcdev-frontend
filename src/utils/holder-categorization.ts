import type { Holder } from "@/types";

export interface CategorizedHolders {
  protocol: Holder[];
  contracts: Holder[];
  agentVotingAccounts: Holder[];
  addresses: Holder[];
}

export interface UserContext {
  connectedWallet: string | null;
  agentVotingAccount: string | null;
}

/**
 * Protocol contracts - core DAO functionality
 * These should be checked first and most specifically
 */
const PROTOCOL_CONTRACTS = [
  "treasury",
  "faktory-dex",
  "pre-faktory",
  // Add bitflow pool patterns after graduation
];

/**
 * Other known contracts - utility and external contracts
 */
const OTHER_CONTRACTS = ["aibtc-dao-run-cost", "btc2aibtc"];

/**
 * Check if an address is a protocol contract
 */
export function isProtocolContract(address: string): boolean {
  return PROTOCOL_CONTRACTS.some((contract) => {
    // Check if address contains the contract name pattern (with any prefix)
    // Matches: fast12-treasury, fake-treasury, treasury, etc.
    return address.includes(`-${contract}`) || address.endsWith(`.${contract}`);
  });
}

/**
 * Check if an address is another known contract
 */
export function isOtherContract(address: string): boolean {
  return OTHER_CONTRACTS.some((contract) => address.includes(`.${contract}`));
}

/**
 * Check if an address is an agent voting account
 * Pattern: SP2Z9...6ZABY.aibtc-acct-[SHORTENED-ADDRESS]
 */
export function isAgentVotingAccount(address: string): boolean {
  return address.includes(".aibtc-acct-");
}

/**
 * Check if an address is a contract (has ADDRESS.name format)
 */
export function isContract(address: string): boolean {
  // Check if it has the pattern: ADDRESS.contract-name
  const parts = address.split(".");
  return parts.length === 2 && parts[0].length > 20; // Stacks addresses are typically longer
}

/**
 * Check if holder is the user's connected wallet
 */
export function isUserWallet(
  holder: Holder,
  userContext: UserContext
): boolean {
  return holder.address === userContext.connectedWallet;
}

/**
 * Check if holder is the user's agent voting account
 */
export function isUserAgentAccount(
  holder: Holder,
  userContext: UserContext
): boolean {
  return holder.address === userContext.agentVotingAccount;
}

/**
 * Categorize holders into sections
 */
export function categorizeHolders(
  holders: Holder[],
  userContext: UserContext
): CategorizedHolders {
  const categorized: CategorizedHolders = {
    protocol: [],
    contracts: [],
    agentVotingAccounts: [],
    addresses: [],
  };

  for (const holder of holders) {
    // Check protocol contracts FIRST and most specifically
    if (isProtocolContract(holder.address)) {
      categorized.protocol.push(holder);
    }
    // Check agent voting accounts SECOND
    else if (isAgentVotingAccount(holder.address)) {
      categorized.agentVotingAccounts.push(holder);
    }
    // Check other known contracts THIRD
    else if (isOtherContract(holder.address)) {
      categorized.contracts.push(holder);
    }
    // Check if it's any other contract format FOURTH
    else if (isContract(holder.address)) {
      categorized.contracts.push(holder);
    }
    // Everything else is a regular address
    else {
      categorized.addresses.push(holder);
    }
  }

  // Sort each category by balance (highest first)
  const sortByBalance = (a: Holder, b: Holder) =>
    Number.parseFloat(b.balance) - Number.parseFloat(a.balance);

  categorized.protocol.sort(sortByBalance);
  categorized.contracts.sort(sortByBalance);
  categorized.agentVotingAccounts.sort(sortByBalance);
  categorized.addresses.sort(sortByBalance);

  // Move user's agent voting account to the top of its section
  if (userContext.agentVotingAccount) {
    const userAgentIndex = categorized.agentVotingAccounts.findIndex(
      (holder) => holder.address === userContext.agentVotingAccount
    );
    if (userAgentIndex > 0) {
      const userAgent = categorized.agentVotingAccounts.splice(
        userAgentIndex,
        1
      )[0];
      categorized.agentVotingAccounts.unshift(userAgent);
    }
  }

  return categorized;
}

/**
 * Get section title and description
 */
export function getSectionInfo(section: keyof CategorizedHolders) {
  switch (section) {
    case "protocol":
      return {
        title: "Protocol Contracts",
        description: "Core DAO treasury and DEX contracts",
        icon: "🏛️",
      };
    case "contracts":
      return {
        title: "Other Contracts",
        description: "Utility and external smart contracts",
        icon: "📋",
      };
    case "agentVotingAccounts":
      return {
        title: "Agent Voting Accounts",
        description: "Smart contracts for agent-based voting",
        icon: "🤖",
      };
    case "addresses":
      return {
        title: "Individual Addresses",
        description: "Personal wallets and other addresses",
        icon: "👤",
      };
    default:
      return {
        title: "Unknown",
        description: "",
        icon: "❓",
      };
  }
}
