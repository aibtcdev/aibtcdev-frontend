"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";
import { supabase } from "@/utils/supabase/client";

interface StreamMessage {
  type: "task" | "step" | "result";
  content: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  streamMessages?: StreamMessage[];
}

interface ExecutionPanelProps {
  crewName: string;
  crewId: number;
}

export default function ExecutionPanel({
  crewName,
  crewId,
}: ExecutionPanelProps) {
  const [inputStr, setInputStr] = useState("");
  const [streamingMessages, setStreamingMessages] = useState<StreamMessage[]>(
    []
  );
  const [authToken, setAuthToken] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setAuthToken(session.access_token);
      }
    };

    getSession();
  }, []);

  const handleExecuteCrew = async () => {
    if (!inputStr.trim()) return;

    setStreamingMessages([]);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/crew/execute/${crewId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(inputStr),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { task_id } = await response.json();

      // Start SSE connection
      const eventSource = new EventSource(
        `${process.env.NEXT_PUBLIC_API_URL}/crew/tasks/${task_id}/stream`
      );

      eventSource.onmessage = (event) => {
        try {
          if (!event.data || event.data.trim() === "") return;

          const data = JSON.parse(event.data);
          if (!data || typeof data !== "object") return;

          switch (data.type) {
            case "step":
            case "task":
            case "result":
              setStreamingMessages((prev) => [
                ...prev,
                { type: data.type, content: data.content },
              ]);
              break;
            default:
              console.warn("Unknown message type:", data.type);
          }

          if (data.type === "result") {
            eventSource.close();
          }
        } catch (error) {
          console.error("Error parsing SSE data:", error);
        }
      };

      eventSource.onerror = (error) => {
        console.error("EventSource failed:", error);
        toast({
          title: "Connection Failed",
          description:
            "There was a problem with the connection. Please try again.",
          variant: "destructive",
        });
      };
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "An error occurred while executing the crew.",
        variant: "destructive",
      });
    } finally {
      setInputStr("");
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Execute Crew: {crewName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Input
            type="text"
            value={inputStr}
            onChange={(e) => setInputStr(e.target.value)}
            placeholder="Enter input data"
            onKeyUp={(e) => e.key === "Enter" && handleExecuteCrew()}
          />
          <Button onClick={handleExecuteCrew}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div>
          {streamingMessages.map((msg, index) => (
            <div key={index}>
              <p>{msg.content}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
