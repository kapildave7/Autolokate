import type { ChatThread } from "./types";
import threadsJson from "./json/chat-threads.json";

export const chatThreadsSeed = threadsJson as ChatThread[];
