"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import ExecutionPanel from "@/components/crews/Execution";
import { Crew } from "@/types/supabase";

export const runtime = "edge";

export default function CrewExecution() {
  const params = useParams();
  const id = params.id as string;
  const [crew, setCrew] = useState<Crew | null>(null);

  useEffect(() => {
    const fetchCrew = async () => {
      const { data, error } = await supabase
        .from("crews")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        console.error("Error fetching crew:", error);
        return;
      }
      setCrew(data);
    };

    if (id) {
      fetchCrew();
    }
  }, [id]);

  if (!crew) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold pt-4">Crew: {crew.name}</h1>
      <ExecutionPanel crewName={crew.name} crewId={crew.id} />
    </div>
  );
}
