"use client";

import React from "react";
import CrewManagement from "@/components/crews/CrewManagement";
import { useParams } from "next/navigation";
import { CrewDetails } from "@/components/crews/CrewDetails";

export const runtime = "edge";

const CrewPage = () => {
  const { id } = useParams();
  const crewId = id as string;

  return (
    <div className="space-y-6 p-6">
      <CrewDetails crewId={crewId} />
      <CrewManagement />
    </div>
  );
};

export default CrewPage;
