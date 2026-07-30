"use client";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
export default function QuizzesPage() {
  const { data: quizzes = [] } = useQuery({ queryKey: ["quizzes"], queryFn: async () => (await api.get("/quizzes")).data });
  return <main className="max-w-5xl mx-auto px-6 py-10"><Link href="/dashboard" className="text-sm text-primary">← Dashboard</Link><h1 className="text-3xl font-bold mt-4">Quizzes</h1><div className="grid md:grid-cols-2 gap-4 mt-8">{quizzes.length ? quizzes.map((quiz: any) => <div key={quiz.id} className="p-5 rounded-2xl bg-card border border-border/50"><p className="text-xs text-primary">{quiz.category} · {quiz.difficulty}</p><h2 className="font-semibold text-lg mt-2">{quiz.title}</h2><p className="text-sm text-muted-foreground mt-2">{quiz.description}</p><p className="text-xs text-muted-foreground mt-4">{quiz._count.questions} questions · {quiz.timeLimit || "No"} min limit</p></div>) : <p className="text-muted-foreground">No published quizzes are available yet.</p>}</div></main>;
}
