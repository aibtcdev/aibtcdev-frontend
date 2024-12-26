"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export const runtime = "edge";

export default function CrewRedirect() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    router.push(`/crews/${id}/manage`);
  }, [id, router]);

  return <div>Redirecting to crew manager...</div>;
}
