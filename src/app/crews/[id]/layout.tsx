"use client";

import React from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Settings, Play, LogsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CrewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const id = params.id as string;
  const pathname = usePathname();

  const isManage = pathname.includes("/manage");
  const isExecute = pathname.includes("/execute");
  const isJobs = pathname.includes("/jobs");
  const isAgents = pathname.includes("/agents");

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex flex-start items-center">
        <div className="flex gap-2">
          <Link href={`/crews/${id}/manage`}>
            <Button variant={isManage ? "default" : "outline"}>
              <Settings className="w-4 h-4 mr-2" />
              Manage
            </Button>
          </Link>
          <Link href={`/crews/${id}/execute`}>
            <Button variant={isExecute ? "default" : "outline"}>
              <Play className="w-4 h-4 mr-2" />
              Execute
            </Button>
          </Link>
          <Link href={`/crews/${id}/jobs`}>
            <Button variant={isJobs ? "default" : "outline"}>
              <LogsIcon className="w-4 h-4 mr-2" />
              Logs
            </Button>
          </Link>
          {/* <Link href={`/crews/${id}/agents`}>
            <Button variant={isAgents ? "default" : "outline"}>
              <LogsIcon className="w-4 h-4 mr-2" />
              Agents
            </Button>
          </Link> */}
        </div>
      </div>
      {children}
    </div>
  );
}
