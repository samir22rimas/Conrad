"use client";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
export default function NotificationsPage() {
  const client = useQueryClient(); const { data: notifications = [] } = useQuery({ queryKey: ["notifications"], queryFn: async () => (await api.get("/notifications")).data });
  const read = useMutation({ mutationFn: async (id: string) => api.patch(`/notifications/${id}/read`), onSuccess: () => client.invalidateQueries({ queryKey: ["notifications"] }) });
  const readAll = useMutation({ mutationFn: async () => api.patch("/notifications/read-all"), onSuccess: () => client.invalidateQueries({ queryKey: ["notifications"] }) });
  return <main className="max-w-3xl mx-auto px-6 py-10"><div className="flex justify-between"><div><Link href="/dashboard" className="text-sm text-primary">← Dashboard</Link><h1 className="text-3xl font-bold mt-4">Notifications</h1></div><button onClick={() => readAll.mutate()} className="text-sm text-primary">Mark all read</button></div><div className="space-y-3 mt-8">{notifications.length ? notifications.map((n: any) => <button onClick={() => !n.isRead && read.mutate(n.id)} key={n.id} className={`text-left w-full p-4 rounded-xl border ${n.isRead ? "bg-card border-border/50" : "bg-primary/10 border-primary/30"}`}><p className="font-medium">{n.title}</p><p className="text-sm text-muted-foreground mt-1">{n.message}</p><p className="text-xs text-muted-foreground mt-2">{new Date(n.createdAt).toLocaleString()}</p></button>) : <p className="text-muted-foreground">You have no notifications.</p>}</div></main>;
}
