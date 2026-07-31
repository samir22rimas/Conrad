"use client";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Link from "next/link";
export default function ProfilePage() {
  const client = useQueryClient(); const { data: user } = useQuery({ queryKey: ["profile"], queryFn: async () => (await api.get("/user/profile")).data }); const [name, setName] = useState(""); const [bio, setBio] = useState("");
  useEffect(() => { if (user) { setName(user.name || ""); setBio(user.profile?.bio || ""); } }, [user]);
  const save = useMutation({ mutationFn: async () => api.patch("/user/profile", { name, bio }), onSuccess: () => { client.invalidateQueries({ queryKey: ["profile"] }); client.invalidateQueries({ queryKey: ["auth"] }); } });
  return <main className="max-w-2xl mx-auto px-6 py-10"><Link href="/dashboard" className="text-sm text-primary">← Dashboard</Link><h1 className="text-3xl font-bold mt-4">Profile</h1><form onSubmit={e => { e.preventDefault(); save.mutate(); }} className="mt-7 p-6 rounded-2xl bg-card border border-border/50 space-y-4"><div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-xl">{name.slice(0, 1).toUpperCase() || "?"}</div><label className="block">Name<input value={name} onChange={e => setName(e.target.value)} required className="mt-2 p-3 w-full bg-muted rounded" /></label><label className="block">Bio<textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={500} className="mt-2 p-3 w-full bg-muted rounded" /></label><p className="text-sm text-muted-foreground">{user?.email}</p><button disabled={save.isPending} className="px-4 py-2 rounded bg-primary text-primary-foreground">{save.isPending ? "Saving…" : "Save profile"}</button></form></main>;
}
