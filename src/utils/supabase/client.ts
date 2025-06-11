import { createBrowserClient } from "@supabase/ssr";

const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "client: missing supabase url or supabase anon key in env vars"
    );
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = createClient();
