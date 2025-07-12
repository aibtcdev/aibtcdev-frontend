// Base Supabase service - centralized client and utilities
import { PostgrestError } from "@supabase/supabase-js";

export { supabase } from "@/utils/supabase/client";

/**
 * Common error handling utility for Supabase operations
 * @param error The error object from Supabase
 * @param operation Description of the operation that failed
 */
export const handleSupabaseError = (
  error: PostgrestError | Error | null,
  operation: string
) => {
  console.error(`Error in ${operation}:`, error);
  throw error;
};

/**
 * Generic query wrapper with error handling
 * @param queryFn Function that returns a Supabase query
 * @param operation Description of the operation
 */
export const executeQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  operation: string
): Promise<T> => {
  try {
    const { data, error } = await queryFn();
    if (error) {
      handleSupabaseError(error, operation);
    }
    return data as T;
  } catch (error) {
    const errorToHandle =
      error instanceof Error ? error : new Error(String(error));
    handleSupabaseError(errorToHandle, operation);
    throw error;
  }
};
