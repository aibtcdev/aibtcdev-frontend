"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AgentForm } from "@/components/agents/agent-form";
import { Agent } from "@/types/supabase";
import { supabase } from "@/utils/supabase/client";
import { useSessionStore } from "@/store/session";
import { getRandomImageUrl } from "@/lib/generate-image";

export const runtime = "edge";

export default function EditAgentPage() {
  const router = useRouter();
  const params = useParams();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stxAddresses, setStxAddresses] = useState<{
    testnet: string;
    mainnet: string;
  }>({ testnet: "", mainnet: "" });
  const { network } = useSessionStore();

  useEffect(() => {
    try {
      const blockstackSession = localStorage.getItem("blockstack-session");
      if (blockstackSession) {
        const sessionData = JSON.parse(blockstackSession);
        const addresses = sessionData?.userData?.profile?.stxAddress;
        if (addresses) {
          setStxAddresses({
            testnet: addresses.testnet,
            mainnet: addresses.mainnet,
          });
        }
      }
    } catch (error) {
      console.error("Error reading blockstack session:", error);
    }
  }, []);

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const { data, error } = await supabase
          .from("agents")
          .select("*")
          .eq("id", params.id)
          .single();

        if (error) throw error;
        setAgent(data);
      } catch (error) {
        console.error("Error fetching agent:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchAgent();
    }
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent) return;

    const updatedAgent = {
      ...agent,
      image_url: getRandomImageUrl(),
    };

    setSaving(true);
    try {
      const { error } = await supabase
        .from("agents")
        .update(updatedAgent)
        .eq("id", agent.id);

      if (error) throw error;
      router.push("/agents");
    } catch (error) {
      console.error("Error updating agent:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setAgent((prev) => {
      if (!prev) return null;

      // If the name is being updated, also update the image_url with the combined name
      if (name === "name") {
        // select the correct stx address based on the network
        const imageUrlName = `${value}_${
          stxAddresses[network as keyof typeof stxAddresses]
        }`;

        return {
          ...prev,
          [name]: value,
          image_url: `https://bitcoinfaces.xyz/api/get-image?name=${encodeURIComponent(
            imageUrlName
          )}`,
        };
      }

      // For other fields, just update normally
      return { ...prev, [name]: value };
    });
  };

  const handleToolsChange = (tools: string[]) => {
    setAgent((prev) => (prev ? { ...prev, agent_tools: tools } : null));
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-zinc-500">
        Loading agent...
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-zinc-500">
        Agent not found
      </div>
    );
  }

  return (
    <aside className="h-full flex-1 border-r border-zinc-800/40 bg-black/10 flex flex-col">
      <div className="p-4 border-b border-zinc-800/40">
        <h2 className="text-sm font-medium text-zinc-200">Edit Agent</h2>
      </div>

      <div className="flex-grow overflow-auto p-4">
        <AgentForm
          formData={agent}
          saving={saving}
          onSubmit={handleSubmit}
          onChange={handleChange}
          onToolsChange={handleToolsChange}
        />
      </div>
    </aside>
  );
}
