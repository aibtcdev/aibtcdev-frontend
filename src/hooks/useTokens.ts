import { useState, useEffect } from "react";
import { fetchTokens } from "@/services/dao.service";
import type { Token } from "@/types";

export const useTokens = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTokens = async () => {
      try {
        setLoading(true);
        const tokensData = await fetchTokens();
        setTokens(tokensData);
        setError(null);
      } catch (err) {
        console.error("Error fetching tokens:", err);
        setError("Failed to fetch tokens");
      } finally {
        setLoading(false);
      }
    };

    loadTokens();
  }, []);

  // Create a lookup map for quick access
  const tokenLookup = tokens.reduce(
    (acc, token) => {
      acc[token.dao_id] = token.symbol;
      return acc;
    },
    {} as Record<string, string>
  );

  return {
    tokens,
    tokenLookup,
    loading,
    error,
  };
};
