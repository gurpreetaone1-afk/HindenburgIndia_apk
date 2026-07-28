import { useCallback, useRef, useState } from "react";

export interface ChatMessage {
  id: string;
  text: string;
  /** true = sent by the user (right, purple), false = support agent. */
  mine: boolean;
  at: number;
}

export const QUICK_REPLIES = [
  "Deposit not credited",
  "Withdrawal status",
  "KYC / bank details",
  "Trading issue",
];

const GREETING =
  "Hi! You're chatting with Hindenburg Support. Tell us what you need help with — deposits, withdrawals, KYC or trading.";

// Canned responses. This screen is UI-only for now: there's no support
// inbox on the backend, so replies are simulated locally. Swap
// `scheduleReply` for a socket/REST call when the inbox ships — the rest
// of the screen doesn't change.
const REPLIES: Record<string, string> = {
  deposit:
    "Deposits usually reflect within 10-15 minutes of admin approval. Share the UTR number and we'll track it right away.",
  withdraw:
    "Withdrawal requests are processed on working days between 9 AM and 6 PM. You can see the live status under Wallet → Withdrawals.",
  kyc: "For KYC, add your PAN, Aadhaar and bank details under Profile → Account details → KYC status. Changes to a saved bank account need an OTP.",
  bank: "You can save up to 5 bank accounts. To add a sixth, delete one from Profile → Account details → KYC status.",
  order:
    "Please share the order ID and the instrument — we'll check the execution log and get back to you.",
};

const FALLBACK =
  "Thanks for reaching out — a support executive will pick this up shortly. You can also message us on WhatsApp for a faster response.";

function pickReply(text: string): string {
  const q = text.toLowerCase();
  const hit = Object.keys(REPLIES).find((k) => q.includes(k));
  return hit ? REPLIES[hit]! : FALLBACK;
}

let seq = 0;
const nextId = (): string => `m${++seq}`;

/** Local chat state for the support screen: message list, the agent
 *  "typing…" indicator and the simulated reply timer. */
export function useSupportChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: nextId(), text: GREETING, mine: false, at: Date.now() },
  ]);
  const [typing, setTyping] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const send = useCallback((raw: string) => {
    const text = raw.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: nextId(), text, mine: true, at: Date.now() },
    ]);
    setTyping(true);
    timers.current.push(
      setTimeout(() => {
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          { id: nextId(), text: pickReply(text), mine: false, at: Date.now() },
        ]);
      }, 1200),
    );
  }, []);

  const reset = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  return { messages, typing, send, reset };
}
