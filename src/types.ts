export type Stage = { type: string; provider: string; stage: string; status: string; text?: string; conversationId?: string };
export type Message = { id: string; role: 'user' | 'assistant'; text: string; stages?: Stage[]; mode?: string; error?: boolean };
export type Chat = { id: string; title: string; created: string; messages: Message[] };
export type Settings = { web: boolean; write: boolean; mode: 'normal' | 'deep' };
export type State = { conversations: Chat[]; workspace: string; settings: Settings };
export type Status = Record<string, { installed: boolean; version?: string; error?: string }>;
export type Entry = { name: string; path: string; directory: boolean; symlink: boolean };
declare global { interface Window { nexus?: {
 state(): Promise<State>; status(): Promise<Status>; newChat(): Promise<Chat>; deleteChat(id: string): Promise<State>; settings(value: Settings): Promise<Settings>; folder(): Promise<string>; reveal(): Promise<void>;
 workspace<T = any>(name: string, args?: Record<string, unknown>): Promise<T>; stop(): Promise<void>; send(value: { id: string; prompt: string }): Promise<State>; pdf(value: { title: string; text: string }): Promise<string | null>;
 onEvent(fn: (event: Stage) => void): () => void;
} } }
