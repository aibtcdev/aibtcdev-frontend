"use client";

import { useParams } from "next/navigation";
import JobsView from "@/components/crews/CrewJobs";

export const runtime = 'edge';

export default function JobsPage() {
  const params = useParams();
  console.log(params);
  const crewId = parseInt(params.id as string, 10); // Ensure 'crewId' matches the dynamic segment

  if (isNaN(crewId)) {
    return <div className="p-4 text-center text-red-500">Invalid crew ID</div>;
  }

  return <JobsView crewId={crewId} />;
}
