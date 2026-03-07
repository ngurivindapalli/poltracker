import ChatInterface from "@/components/chat/ChatInterface"

export default function ChatPage() {
  return (
    <div className="container mx-auto max-w-4xl py-10 px-6">
      <h1 className="text-3xl font-bold mb-2 text-[#1E3A5F]">PolTracker AI</h1>
      <p className="mb-8 text-[#64748B] text-[16px]">
        Ask about legislation, senators, representatives, or policy.
      </p>

      <ChatInterface />
    </div>
  )
}
