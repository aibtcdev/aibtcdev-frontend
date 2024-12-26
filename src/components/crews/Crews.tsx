// "use client";

// import React from "react";
// import { useState, useEffect, useCallback } from "react";
// import { supabase } from "@/utils/supabase/client";
// import { Crew } from "@/types/supabase";
// import { CrewManagement } from "@/components/crews/CrewManagement";
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import { AlertCircle } from "lucide-react";

// export default function Crews() {
//   const [crews, setCrews] = useState<Crew[]>([]);
//   const [error, setError] = useState<string | null>(null);

//   const fetchCrews = useCallback(async () => {
//     try {
//       const { data, error } = await supabase
//         .from("crews")
//         .select("id, name, description, created_at")
//         .order("created_at", { ascending: false });

//       if (error) {
//         throw error;
//       }

//       setCrews(data || []);
//     } catch (err) {
//       console.error("Error fetching crews:", err);
//       setError("Failed to fetch crews");
//     }
//   }, []);

//   const checkClonedAnalyzer = useCallback(async () => {
//     try {
//       const {
//         data: { user },
//         error: authError,
//       } = await supabase.auth.getUser();
//       if (authError) throw authError;
//       if (!user) {
//         console.error("No authenticated user found");
//         return;
//       }

//       const { error } = await supabase
//         .from("crews")
//         .select("*")
//         .eq("profile_id", user.id)
//         .eq("name", "Trading Analyzer");

//       if (error) {
//         throw error;
//       }
//     } catch (err) {
//       console.error("Error checking for cloned analyzer:", err);
//       setError("Failed to check cloned analyzer status");
//     }
//   }, []);

//   useEffect(() => {
//     const initializeDashboard = async () => {
//       await Promise.all([fetchCrews(), checkClonedAnalyzer()]);
//     };

//     initializeDashboard();
//   }, [fetchCrews, checkClonedAnalyzer]);

//   const handleCrewsUpdated = useCallback(
//     (updatedCrews: Crew[]) => {
//       setCrews(updatedCrews);
//       checkClonedAnalyzer();
//     },
//     [checkClonedAnalyzer]
//   );

//   return (
//     <>
//       {error && (
//         <Alert variant="destructive">
//           <AlertCircle className="h-4 w-4" />
//           <AlertTitle>Error</AlertTitle>
//           <AlertDescription>{error}</AlertDescription>
//         </Alert>
//       )}
//       <CrewManagement initialCrews={crews} onCrewUpdate={handleCrewsUpdated} />
//     </>
//   );
// }
