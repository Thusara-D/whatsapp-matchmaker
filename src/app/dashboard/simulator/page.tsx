"use client";

import { useState, useEffect, useRef } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Send, Trash2, Image as ImageIcon, Smartphone } from "lucide-react";

export default function SimulatorPage() {
  const [mockPhone, setMockPhone] = useState("94770000000");
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mockPhone) return;

    const unsub = onSnapshot(doc(db, "users", mockPhone), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const historyText = data.chatHistory || "";
        
        // Parse the history string into an array of objects
        // History looks like: "\nUser: Hello\nBot: Hi there"
        const parsed: { sender: string; text: string }[] = [];
        const lines = historyText.split("\n").filter((l: string) => l.trim().length > 0);
        
        lines.forEach((line: string) => {
          if (line.startsWith("User: ")) {
            parsed.push({ sender: "User", text: line.replace("User: ", "") });
          } else if (line.startsWith("Bot: ")) {
            parsed.push({ sender: "Bot", text: line.replace("Bot: ", "") });
          }
        });
        
        setMessages(parsed);
      } else {
        setMessages([]);
      }
    });

    return () => unsub();
  }, [mockPhone]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendWebhookPayload = async (msgBody: string, type: "text" | "image" = "text") => {
    if (!msgBody.trim() && type === "text") return;
    setLoading(true);
    
    // We immediately add the user's message to local state so it feels instant,
    // though onSnapshot will catch it shortly after the webhook updates Firestore.
    if (type === "text") setInputMessage("");

    const payload = {
      object: "whatsapp_business_account",
      entry: [{
        id: "SIMULATOR",
        changes: [{
          value: {
            messaging_product: "whatsapp",
            metadata: { display_phone_number: "1234567890", phone_number_id: "SIMULATOR_ID" },
            contacts: [{ profile: { name: "Simulator User" }, wa_id: mockPhone }],
            messages: [{
              from: mockPhone,
              id: `wamid.${Date.now()}`,
              timestamp: Math.floor(Date.now() / 1000).toString(),
              type: type,
              ...(type === "text" ? { text: { body: msgBody } } : { image: { id: "simulated_image_id" } })
            }]
          }
        }]
      }]
    };

    try {
      await fetch("/api/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error("Webhook simulation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!confirm("Clear this user's entire history and start onboarding over?")) return;
    await setDoc(doc(db, "users", mockPhone), {
      chatHistory: "",
      state: "ONBOARDING",
      profileData: {},
      currentMatches: []
    });
  };

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-700 ease-out px-2 max-w-5xl mx-auto flex gap-8">
      
      {/* Control Panel */}
      <div className="flex-1">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">WhatsApp Simulator</h2>
          <p className="text-gray-500 text-sm mt-2 font-medium">Test your automated chatbot without a real phone.</p>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-sm border border-white/60 p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Simulated Phone Number</label>
            <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-200 transition-all">
              <Smartphone className="w-5 h-5 text-gray-400 mr-2" />
              <input 
                type="text" 
                value={mockPhone}
                onChange={(e) => setMockPhone(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-gray-800 font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 space-y-4">
             <button 
                onClick={handleClearChat}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-colors border border-red-200"
              >
                <Trash2 className="w-4 h-4" /> Clear Chat & Restart
             </button>

             <button 
                onClick={() => sendWebhookPayload("[Simulated Bank Receipt Image]", "image")}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-xl transition-colors border border-blue-200"
              >
                <ImageIcon className="w-4 h-4" /> Simulate Image Upload (Receipt/Photo)
             </button>
          </div>

          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-sm text-emerald-800 font-medium">
            <strong>Pro Tip:</strong> When the bot asks you to "SELECT 1", just type "SELECT 1" in the chat to trigger the payment flow. Then click "Simulate Image Upload" above to pretend you sent the bank receipt!
          </div>
        </div>
      </div>

      {/* Phone UI Container */}
      <div className="w-[380px] h-[750px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl relative shrink-0 border-4 border-gray-800">
        {/* Notch */}
        <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-20">
          <div className="w-32 h-6 bg-gray-900 rounded-b-3xl"></div>
        </div>

        <div className="w-full h-full bg-[#efeae2] rounded-[2.5rem] overflow-hidden flex flex-col relative font-sans">
          {/* WhatsApp Header */}
          <div className="bg-[#008069] text-white px-4 py-3 pt-10 flex items-center gap-3 shadow-md z-10">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden shrink-0">
               <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Matchmaker" alt="Bot" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">LoveRoad Matchmaker</h3>
              <p className="text-xs text-emerald-100">online</p>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat opacity-90"
          >
            <div className="flex justify-center mb-4">
              <span className="bg-[#e1f3fb] text-gray-600 text-xs px-3 py-1 rounded-lg shadow-sm">
                Messages are end-to-end simulated.
              </span>
            </div>

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === "User" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm shadow-sm relative ${msg.sender === "User" ? "bg-[#d9fdd3] text-gray-800 rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none"}`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span className="text-[10px] text-gray-400 float-right mt-1 ml-3">Now</span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                 <div className="bg-white rounded-lg px-3 py-2 text-sm shadow-sm rounded-tl-none text-gray-400 italic">
                    typing...
                 </div>
              </div>
            )}
          </div>

          {/* Chat Input Area */}
          <div className="bg-[#f0f2f5] p-2 flex items-end gap-2 z-10 pb-6 pt-2">
            <div className="flex-1 bg-white rounded-2xl flex items-center px-4 py-1 shadow-sm min-h-[44px]">
              <textarea 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendWebhookPayload(inputMessage);
                  }
                }}
                placeholder="Type a message"
                className="w-full bg-transparent border-none outline-none text-gray-800 resize-none max-h-24 py-2"
                rows={1}
              />
            </div>
            <button 
              onClick={() => sendWebhookPayload(inputMessage)}
              disabled={!inputMessage.trim() || loading}
              className="w-11 h-11 bg-[#00a884] rounded-full flex items-center justify-center shrink-0 shadow-sm text-white disabled:opacity-50 transition-opacity"
            >
              <Send className="w-5 h-5 ml-1" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
