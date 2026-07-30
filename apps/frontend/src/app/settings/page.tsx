"use client";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Link from "next/link";
export default function SettingsPage() {
  const client = useQueryClient(); const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: async () => (await api.get("/user/settings")).data });
  const [theme, setTheme] = useState("DARK"); const [language, setLanguage] = useState("en");
  useEffect(() => { if (settings) { setTheme(settings.theme); setLanguage(settings.language); } }, [settings]);
  const save = useMutation({ mutationFn: async () => api.patch("/user/settings", { theme, language }), onSuccess: () => client.invalidateQueries({ queryKey: ["settings"] }) });
  return <main className="max-w-2xl mx-auto px-6 py-10"><Link href="/dashboard" className="text-sm text-primary">← Dashboard</Link><h1 className="text-3xl font-bold mt-4">Settings</h1><form onSubmit={e => { e.preventDefault(); save.mutate(); }} className="p-6 rounded-2xl bg-card border border-border/50 mt-8 space-y-5"><label className="block">Theme<select value={theme} onChange={e => setTheme(e.target.value)} className="block mt-2 w-full p-3 bg-muted rounded"><option value="DARK">Dark</option><option value="LIGHT">Light</option><option value="SYSTEM">System</option></select></label><label className="block">Language<input value={language} onChange={e => setLanguage(e.target.value)} className="block mt-2 w-full p-3 bg-muted rounded" /></label><button disabled={save.isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded">{save.isPending ? "Saving…" : "Save settings"}</button></form></main>;
}
