import { ChatBot } from "@/components/chat-bot";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return (
    <>
      {children}
      <ChatBot projectId={resolvedParams.id} />
    </>
  );
}
