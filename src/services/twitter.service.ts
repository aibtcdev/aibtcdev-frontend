export interface TwitterOEmbedResponse {
  url: string;
  author_name: string;
  author_url: string;
  html: string;
  width: number;
  height: number | null;
  type: string;
  cache_age: string;
  provider_name: string;
  provider_url: string;
  version: string;
}

export interface TwitterOEmbedError {
  error: string;
}

export const fetchTwitterEmbed = async (
  twitterUrl: string
): Promise<TwitterOEmbedResponse | TwitterOEmbedError> => {
  try {
    // Use your backend proxy endpoint that follows the same pattern as other tools
    const encodedUrl = encodeURIComponent(twitterUrl);
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/tools/twitter/oembed?url=${encodedUrl}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch Twitter embed: ${response.status}`);
    }

    const data: TwitterOEmbedResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching Twitter embed:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch Twitter embed",
    };
  }
};

export const isTwitterOEmbedError = (
  response: TwitterOEmbedResponse | TwitterOEmbedError
): response is TwitterOEmbedError => {
  return "error" in response;
};
