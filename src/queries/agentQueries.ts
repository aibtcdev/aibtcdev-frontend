import { supabase } from "@/utils/supabase/client"
import type { Agent } from "@/types/supabase"

export const fetchAgents = async (): Promise<Agent[]> => {
    const { data, error } = await supabase
        .from("agents")
        .select("*")
        .order("is_archived", { ascending: true })
        .order("name", { ascending: true })

    if (error) {
        throw error
    }

    return data
}

