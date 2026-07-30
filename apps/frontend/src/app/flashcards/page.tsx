"use client";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
export default function FlashcardsPage() {
  const client = useQueryClient(); const { data: cards = [] } = useQuery({ queryKey: ["flashcards", "due"], queryFn: async () => (await api.get("/flashcards?due=true")).data });
  const review = useMutation({ mutationFn: async ({ id, quality }: { id: string; quality: number }) => api.post(`/flashcards/${id}/review`, { quality }), onSuccess: () => client.invalidateQueries({ queryKey: ["flashcards"] }) });
  return <main className="max-w-3xl mx-auto px-6 py-10"><Link href="/dashboard" className="text-sm text-primary">← Dashboard</Link><h1 className="text-3xl font-bold mt-4">Flashcards due today</h1><div className="space-y-4 mt-8">{cards.length ? cards.map((card: any) => <article key={card.id} className="p-6 rounded-2xl bg-card border border-border/50"><p className="font-semibold text-lg">{card.front}</p><p className="text-muted-foreground mt-3">{card.back}</p><div className="flex gap-2 mt-5">{[[1,"Again"],[3,"Good"],[5,"Easy"]].map(([quality, label]) => <button key={String(quality)} onClick={() => review.mutate({ id: card.id, quality: Number(quality) })} className="px-3 py-2 rounded bg-muted hover:bg-primary hover:text-primary-foreground text-sm">{label}</button>)}</div></article>) : <p className="text-muted-foreground">No flashcards are due right now.</p>}</div></main>;
}
