import React from "react";
import CrewManagement from "@/components/crews/CrewManagement";
export const runtime = "edge";
const page = () => {
  return (
    <div>
      <CrewManagement />
    </div>
  );
};

export default page;
