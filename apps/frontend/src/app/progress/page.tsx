"use client";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
export default function ProgressPage() {
  const { data: progress = [] } = useQuery({ queryKey: ["progress"], queryFn: async () => (await api.get("/progress")).data });
  return <main className="max-w-4xl mx-auto px-6 py-10"><Link href="/dashboard" className="text-sm text-primary">← Dashboard</Link><h1 className="text-3xl font-bold mt-4">Your progress</h1><div className="space-y-3 mt-8">{progress.length ? progress.map((item: any) => <div key={item.id} className="p-5 rounded-2xl bg-card border border-border/50"><div className="flex justify-between gap-4"><div><h2 className="font-semibold">{item.lesson?.title || item.course?.title || "Learning item"}</h2><p className="text-sm text-muted-foreground">{item.course?.title || item.status}</p></div><span>{item.mastery}%</span></div><div className="h-2 bg-muted rounded mt-4"><div className="h-full bg-primary rounded" style={{ width: `${item.mastery}%` }} /></div></div>) : <p className="text-muted-foreground">Start a lesson to track progress.</p>}</div></main>;
}
