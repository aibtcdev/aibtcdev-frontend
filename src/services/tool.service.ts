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
