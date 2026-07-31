"use client";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
export default function HistoryPage() {
  const client = useQueryClient(); const [search, setSearch] = useState(""); const { data: chats = [] } = useQuery({ queryKey: ["chats"], queryFn: async () => (await api.get("/chat")).data });
  const remove = useMutation({ mutationFn: async (id: string) => api.delete(`/chat/${id}`), onSuccess: () => client.invalidateQueries({ queryKey: ["chats"] }) });
  const rename = useMutation({ mutationFn: async ({ id, title }: { id: string; title: string }) => api.patch(`/chat/${id}`, { title }), onSuccess: () => client.invalidateQueries({ queryKey: ["chats"] }) });
  const visible = chats.filter((chat: any) => chat.title.toLowerCase().includes(search.toLowerCase()));
  return <main className="max-w-4xl mx-auto px-6 py-10"><Link href="/dashboard" className="text-sm text-primary">← Dashboard</Link><div className="flex justify-between gap-4 mt-4"><h1 className="text-3xl font-bold">Conversation history</h1><Link href="/tutor" className="px-3 py-2 rounded bg-primary text-primary-foreground text-sm">New chat</Link></div><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations" className="mt-6 p-3 w-full rounded bg-muted" /><div className="space-y-3 mt-5">{visible.length ? visible.map((chat: any) => <article key={chat.id} className="p-4 rounded-xl bg-card border border-border/50 flex justify-between items-center gap-4"><Link href="/tutor" className="min-w-0 flex-1"><p className="font-medium truncate">{chat.title}</p><p className="text-xs text-muted-foreground mt-1">{chat._count.messages} messages · {new Date(chat.updatedAt).toLocaleString()}</p></Link><div className="flex gap-2"><button onClick={() => { const title = window.prompt("Conversation title", chat.title); if (title?.trim()) rename.mutate({ id: chat.id, title: title.trim() }); }} className="text-sm text-primary">Rename</button><button onClick={() => remove.mutate(chat.id)} className="text-sm text-destructive">Delete</button></div></article>) : <p className="text-muted-foreground">No conversations found.</p>}</div></main>;
}
