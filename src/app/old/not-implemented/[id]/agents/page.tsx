// import { Suspense } from "react";
// import { CreateAgentForm } from "./create-agent-form";
// import { AgentsList } from "./agents-list";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Loader2 } from "lucide-react";

// // Loading component for Suspense
// function AgentsLoading() {
//   return (
//     <div className="flex justify-center items-center p-8">
//       <Loader2 className="h-8 w-8 animate-spin" />
//     </div>
//   );
// }

// // Main page component
// export default async function AgentManagementPage({
//   params,
// }: {
//   params: { id: string };
// }) {
//   const crewId = parseInt(params.id, 10);

//   return (
//     <Card className="w-full max-w-3xl">
//       <CardHeader>
//         <CardTitle>Agent Management for Crew {crewId}</CardTitle>
//       </CardHeader>
//       <CardContent>
//         {/* Create Agent Form - Client Component */}
//         <CreateAgentForm crewId={crewId} />

//         {/* Agents List with Suspense */}
//         <Suspense fallback={<AgentsLoading />}>
//           <AgentsList crewId={crewId} />
//         </Suspense>
//       </CardContent>
//     </Card>
//   );
// }

import React from "react";

const page = () => {
  return <div>NOT IMPLEMENTED PAGE</div>;
};

export default page;
