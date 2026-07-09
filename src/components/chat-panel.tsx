"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Send, FileUp, CheckCircle, MessagesSquare, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  image: string | null;
  role: string;
  country: string | null;
}

interface FileData {
  id: string;
  name: string;
  url: string;
}

interface Message {
  id: string;
  channel: string;
  senderId: string;
  sender: User;
  content: string;
  files: FileData[];
  createdAt: string;
}

export function ChatPanel({ projectId, projectMembers = [] }: { projectId: string; projectMembers?: any[] }) {
  const { data: session } = useSession();
  
  const [channels, setChannels] = useState<{ id: string; name: string; type: string }[]>([]);
  const [activeChannel, setActiveChannel] = useState("general");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [assignPopoverUser, setAssignPopoverUser] = useState<User | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const userRole = session?.user?.role;
    const baseChannels = [
      { id: "general", name: "Genel", type: "global" }
    ];
    
    if (userRole && userRole !== "student") {
      baseChannels.push({ id: "teachers", name: "Öğretmenler", type: "global" });
      baseChannels.push({ id: "local_teachers", name: "Yerel Öğretmenler", type: "global" });
    }
    
    // Fetch teams
    fetch(`/api/projects/${projectId}/teams`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
           const teamChannels = data.map((t: any) => ({
             id: `team_${t.id}`,
             name: `Ekip: ${t.name}`,
             type: "team"
           }));
           setChannels([...baseChannels, ...teamChannels]);
        } else {
           setChannels(baseChannels);
        }
      })
      .catch(() => setChannels(baseChannels));
  }, [projectId, session?.user?.role]);

  useEffect(() => {
    fetchMessages();
  }, [projectId, activeChannel]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/chat?channel=${activeChannel}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: activeChannel, content: input }),
      });
      if (res.ok) {
        const newMessage = await res.json();
        setMessages(prev => [...prev, newMessage]);
        setInput("");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !assignPopoverUser) return;
    
    setIsAssigning(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/quick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          assigneeId: assignPopoverUser.id
        })
      });
      if (res.ok) {
        setAssignPopoverUser(null);
        setTaskTitle("");
        alert("Görev başarıyla atandı ve bildirim gönderildi!");
      }
    } catch (error) {
      console.error(error);
    }
    setIsAssigning(false);
  };

  return (
    <div className="flex h-[600px] bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm mt-4">
      {/* Channels Sidebar */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold flex items-center gap-2">
            <MessagesSquare className="w-5 h-5" /> Kanallar
          </h2>
        </div>
        <div className="p-2 space-y-1 overflow-y-auto flex-1">
          {channels.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveChannel(c.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                activeChannel === c.id 
                  ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              )}
            >
              <span className="text-gray-400">#</span> {c.name}
            </button>
          ))}
        </div>
        
        {/* Members Sidebar Section */}
        <div className="p-4 border-b border-t border-gray-200 dark:border-gray-800 mt-auto flex-1 overflow-y-auto">
          <h2 className="font-semibold flex items-center gap-2 mb-2 text-sm text-gray-500">
            <Users className="w-4 h-4" /> Kişiler
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-1 px-2">Öğretmenler</h3>
              <div className="space-y-1">
                {projectMembers.filter(m => m.role !== "student").map((member: any) => (
                  <div key={member.user.id} className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg group text-sm">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        {member.user.image ? (
                          <img src={member.user.image} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-blue-600 text-xs font-semibold">
                            {member.user.name?.charAt(0) || "U"}
                          </span>
                        )}
                      </div>
                      <span className="truncate text-gray-700 dark:text-gray-300">{member.user.name}</span>
                    </div>
                    {member.user.id !== session?.user?.id && session?.user?.role !== "student" && (
                      <button 
                        onClick={() => setAssignPopoverUser(member.user)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Bu kişiye görev ata"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-1 px-2">Öğrenciler</h3>
              <div className="space-y-1">
                {projectMembers.filter(m => m.role === "student").map((member: any) => (
                  <div key={member.user.id} className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg group text-sm">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        {member.user.image ? (
                          <img src={member.user.image} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-emerald-600 text-xs font-semibold">
                            {member.user.name?.charAt(0) || "U"}
                          </span>
                        )}
                      </div>
                      <span className="truncate text-gray-700 dark:text-gray-300">{member.user.name}</span>
                    </div>
                    {member.user.id !== session?.user?.id && session?.user?.role !== "student" && (
                      <button 
                        onClick={() => setAssignPopoverUser(member.user)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                        title="Bu kişiye görev ata"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col relative">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-950">
          <h2 className="font-semibold flex items-center gap-2">
            <span className="text-gray-400">#</span>
            {channels.find(c => c.id === activeChannel)?.name || "Kanal"}
          </h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {loading ? (
            <div className="flex justify-center p-4">Yükleniyor...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 p-4">Bu kanalda henüz mesaj yok. İlk mesajı siz gönderin!</div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-4 group", msg.senderId === session?.user?.id ? "flex-row-reverse" : "flex-row")}>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 overflow-hidden relative">
                  {msg.sender?.image ? (
                    <img src={msg.sender.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-blue-600 font-semibold">
                      {msg.sender?.name?.charAt(0) || "U"}
                    </span>
                  )}
                </div>
                <div className={cn("max-w-[70%]", msg.senderId === session?.user?.id ? "items-end" : "items-start")}>
                  <div className={cn("flex items-center gap-2 mb-1", msg.senderId === session?.user?.id ? "flex-row-reverse" : "flex-row")}>
                    <span className="font-medium text-sm">{msg.sender?.name}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.senderId !== session?.user?.id && session?.user?.role !== "student" && (
                      <button 
                        onClick={() => setAssignPopoverUser(msg.sender)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Bu kişiye görev ata"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className={cn("px-4 py-2 rounded-2xl text-sm", 
                    msg.senderId === session?.user?.id 
                      ? "bg-blue-600 text-white rounded-tr-none" 
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none"
                  )}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          <form onSubmit={sendMessage} className="flex gap-2">
            <button type="button" className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors shrink-0">
              <FileUp className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`#${channels.find(c => c.id === activeChannel)?.name || "Kanal"} kanalına mesaj gönder...`}
              className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-3 rounded-xl bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-colors shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Quick Assign Popover */}
        {assignPopoverUser && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-2xl w-96 max-w-full">
              <h3 className="font-semibold mb-4 text-lg">Görev Ata: {assignPopoverUser.name}</h3>
              <form onSubmit={handleAssignTask} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Görev Başlığı</label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Örn: Afişi tasarla"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAssignPopoverUser(null)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={!taskTitle.trim() || isAssigning}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isAssigning ? "Atanıyor..." : "Ata"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
