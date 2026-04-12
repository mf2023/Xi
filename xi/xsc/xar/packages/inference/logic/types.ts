export type MessageRole = "system" | "user" | "assistant" | "tool";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  name?: string;
  tool_call_id?: string;
  timestamp: number;
}

export interface ChatState {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: number;
  updatedAt: number;
}

export interface InferenceResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: MessageRole;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      content?: string;
    };
    finish_reason: string | null;
  }[];
}
