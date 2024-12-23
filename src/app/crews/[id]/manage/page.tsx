import React from "react";
import { AgentManagement } from "@/components/new/AgentManagement";
import { TaskManagement } from "@/components/new/TaskManagement";
export const runtime = "edge";
const page = () => {
  return (
    <div>
      <AgentManagement />
      <TaskManagement />
    </div>
  );
};

export default page;
