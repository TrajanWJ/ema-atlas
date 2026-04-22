'use client';

import { create } from 'zustand';
import type { SessionMessage } from '@contracts/messages';

interface MessageState {
  messages: Record<string, SessionMessage[]>;

  addMessage: (tabId: string, message: SessionMessage) => void;
  getHistory: (tabId: string) => SessionMessage[];
  setMessages: (messages: Record<string, SessionMessage[]>) => void;
  clearTab: (tabId: string) => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: {},

  addMessage: (tabId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [tabId]: [...(state.messages[tabId] ?? []), message],
      },
    })),

  getHistory: (tabId) => get().messages[tabId] ?? [],

  setMessages: (messages) => set({ messages }),

  clearTab: (tabId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [tabId]: [],
      },
    })),
}));
