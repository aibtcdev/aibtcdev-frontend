export interface Message {
  agent_id: string | null;
  thread_id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string | null;
  status: "sent" | "planning" | "processing" | "complete" | "end" | null;
  type?:
    | "history"
    | "task"
    | "step"
    | "result"
    | "tool"
    | "token"
    | "message"
    | "completion"
    | null;
  tool?: string;
  tool_input?: string;
  tool_output?: string;
}

export interface Thread {
  id: string;
  title: string;
  last_message?: Message;
  created_at: Date;
  updated_at: Date;
  agent_id: string | null;
}

export interface Agent {
  id: string;
  name: string;
  image_url?: string;
  description?: string;
}
