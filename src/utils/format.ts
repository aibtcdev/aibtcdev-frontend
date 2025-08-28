/**
 * Truncates an address to show only the first and last few characters
 * @param address - The address string to truncate
 * @param startChars - Number of characters to show at the start (default: 5)
 * @param endChars - Number of characters to show at the end (default: 5)
 * @returns The truncated address with "..." in the middle
 */
export function truncateAddress(
  address: string,
  startChars = 5,
  endChars = 5
): string {
  if (!address) return "";
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Truncates a string to show only the first few characters
 * @param str - The string to truncate
 * @param startLength - Number of characters to show at the start
 * @param endLength - Optional number of characters to show at the end
 * @returns The truncated string with "..."
 */
export function truncateString(
  str: string,
  startLength: number,
  endLength?: number
): string {
  if (!str) return "";

  // If endLength is provided, show start...end format
  if (endLength !== undefined) {
    if (str.length <= startLength + endLength) return str;
    return `${str.slice(0, startLength)}...${str.slice(-endLength)}`;
  }

  // Otherwise, show start... format
  if (str.length <= startLength) return str;
  return str.slice(0, startLength) + "...";
}

/**
 * Formats a STX balance from microSTX to a human-readable format with 2 decimal places
 * @param balance - The balance in microSTX (string or number)
 * @returns Formatted STX balance as string
 */
export function formatStxBalance(balance: string | number): string {
  if (!balance) return "0";
  const num = Number(balance) / 1_000_000;
  return num.toFixed(2);
}

/**
 * Formats a token balance from microunits to a human-readable format with 2 decimal places and commas
 * @param balance - The balance in microunits (string or number)
 * @returns Formatted token balance as string with locale formatting
 */
export function formatTokenBalance(balance: string | number): string {
  if (!balance) return "0";
  const num = Number(balance) / 1_000_000_00;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats a number with appropriate suffixes (K, M, B)
 * @param num - The number to format
 * @returns Formatted number with suffix
 */
export function formatNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}

/**
 * Converts satoshis to BTC with 8 decimal places
 * @param satoshis - The amount in satoshis (as string)
 * @returns The amount in BTC as string with 8 decimal places
 */
export function satoshiToBTC(satoshis: string): string {
  if (!satoshis || isNaN(Number(satoshis))) return "0";
  return (Number(satoshis) / 100000000).toFixed(8);
}

/**
 * Extracts a token name from a full token identifier
 * @param fullTokenId - The full token identifier (e.g., "contract.token" or "contract::token")
 * @returns The extracted token name
 */
export function extractTokenName(fullTokenId: string): string {
  if (!fullTokenId) return "";

  // Try to extract the token name after the :: delimiter
  if (fullTokenId.includes("::")) {
    return fullTokenId.split("::")[1];
  }

  // If no :: delimiter, try to extract the token name after the last dot
  if (fullTokenId.includes(".")) {
    const parts = fullTokenId.split(".");
    const lastPart = parts[parts.length - 1];

    // If the last part contains a hyphen, extract the part after the hyphen
    if (lastPart.includes("-")) {
      return lastPart.split("-")[0];
    }

    return lastPart;
  }

  return fullTokenId;
}

/**
 * Formats a contract action by removing the contract name and keeping only the function name
 * @param action - The full action string (e.g., "contract.function-name")
 * @returns The formatted function name
 */
export function formatAction(action: string): string {
  if (!action) return "";
  // Remove the contract name and keep only the function name
  const parts = action.split(".");
  return parts[parts.length - 1];
}

/**
 * Formats a Date object into a human-readable string
 * @param date - The Date object to format
 * @returns Formatted date string (e.g., "Jan 15, 2024, 10:30 AM")
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Generates an explorer link for various Stacks blockchain entities
 * @param type - The type of entity ("tx", "address", or "contract")
 * @param identifier - The transaction ID, address, or contract identifier
 * @returns The complete explorer URL
 */
export function getExplorerLink(
  type: "tx" | "address" | "contract",
  identifier: string
): string {
  const baseUrl = "https://explorer.hiro.so";
  const network = process.env.NEXT_PUBLIC_STACKS_NETWORK;
  const chainParam = network === "testnet" ? "testnet" : "mainnet";

  let path: string;
  switch (type) {
    case "tx":
      path = `/txid/${identifier}`;
      break;
    case "address":
      path = `/address/${identifier}`;
      break;
    case "contract":
      path = `/contract/${identifier}`;
      break;
    default:
      path = "";
  }

  return `${baseUrl}${path}?chain=${chainParam}`;
}

/**
 * Formats a token price to a string with appropriate decimal places.
 * @param value - The price as a number or string
 * @returns Formatted price string (e.g., "$0.00000978")
 */
export function formatTokenPrice(value: number | string): string {
  if (!value || Number(value) === 0) return "$0.00";
  const num = Number(value);
  if (isNaN(num) || num === 0) return "$0.00";
  if (num < 0.01) {
    return `$${num.toFixed(8)}`;
  }
  if (num < 1) {
    return `$${num.toFixed(4)}`;
  }
  return `$${num.toFixed(2)}`;
}

export function extractMission(description: string): string {
  if (!description) return "";

  // Check if the description contains markdown structure
  const hasMarkdownStructure =
    /##\s*\w+|###\s*\w+|\*\*\w+\*\*|\n\s*[-*]\s+|\[.*\]\(.*\)/i.test(
      description
    );

  if (!hasMarkdownStructure) {
    // If no markdown structure detected, return the description as-is (truncated if too long)
    return description.length > 150
      ? description.substring(0, 150) + "..."
      : description;
  }

  // First, convert literal \n to actual newlines if needed
  const normalizedMarkdown = description.includes("\\n")
    ? description.replace(/\\n/g, "\n")
    : description;

  // Try to extract mission section
  const missionRegex = /##\s*Mission\s*\n\s*([\s\S]*?)(?=\n##|$)/i;
  const match = normalizedMarkdown.match(missionRegex);

  if (match && match[1]) {
    const mission = match[1].trim().replace(/\n\s*\n\s*\n/g, "\n\n"); // Normalize multiple newlines
    // Clean up markdown formatting for display
    return cleanMarkdownForDisplay(mission);
  }

  // If no mission section found, try to extract the first paragraph/section
  const firstParagraphMatch = normalizedMarkdown.match(
    /^(?:#{1,6}\s*.*\n\s*)?(.*?)(?=\n#{1,6}|$)/
  );
  if (firstParagraphMatch && firstParagraphMatch[1]) {
    const firstParagraph = firstParagraphMatch[1].trim();
    return cleanMarkdownForDisplay(firstParagraph);
  }

  // Fallback: return first 150 characters
  return description.length > 150
    ? description.substring(0, 150) + "..."
    : description;
}

// Helper function to clean markdown formatting for display
function cleanMarkdownForDisplay(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold markers
    .replace(/\*(.*?)\*/g, "$1") // Remove italic markers
    .replace(/`(.*?)`/g, "$1") // Remove code markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Convert links to just text
    .replace(/\n\s*[-*]\s+/g, "\n• ") // Convert list markers to bullets
    .replace(/\n{3,}/g, "\n\n") // Normalize multiple newlines
    .trim();
}

// Alternative approach with more detailed detection
export function extractMissionAdvanced(description: string): string {
  if (!description) return "";

  // Detect different types of content structure
  const contentAnalysis = {
    hasHeaders: /#{1,6}\s+/g.test(description),
    hasLists: /\n\s*[-*]\s+/g.test(description),
    hasBold: /\*\*.*?\*\*/g.test(description),
    hasLinks: /\[.*?\]\(.*?\)/g.test(description),
    hasNewlines: /\n/g.test(description),
    isShort: description.length < 100,
    hasMarkdownSyntax: /[#*`\[\]]/g.test(description),
  };

  // If it's a short description without markdown syntax, return as-is
  if (contentAnalysis.isShort && !contentAnalysis.hasMarkdownSyntax) {
    return description;
  }

  // If it's just a sentence or two without markdown structure
  if (
    !contentAnalysis.hasHeaders &&
    !contentAnalysis.hasLists &&
    !contentAnalysis.hasNewlines
  ) {
    return description.length > 150
      ? description.substring(0, 150) + "..."
      : description;
  }

  // Process markdown content
  const normalizedMarkdown = description.includes("\\n")
    ? description.replace(/\\n/g, "\n")
    : description;

  // Try to extract mission section
  const missionRegex = /##\s*Mission\s*\n\s*([\s\S]*?)(?=\n##|$)/i;
  const match = normalizedMarkdown.match(missionRegex);

  if (match && match[1]) {
    return cleanMarkdownForDisplay(match[1].trim());
  }

  // Extract first meaningful content block
  const lines = normalizedMarkdown.split("\n").filter((line) => line.trim());
  let content = "";

  for (const line of lines) {
    // Skip headers that are just titles
    if (line.match(/^#{1,6}\s*.{1,30}$/)) continue;

    // Take first substantial content
    if (line.length > 20) {
      content = line;
      break;
    }
  }

  if (content) {
    return cleanMarkdownForDisplay(content);
  }

  // Final fallback
  return description.length > 150
    ? description.substring(0, 150) + "..."
    : description;
}
