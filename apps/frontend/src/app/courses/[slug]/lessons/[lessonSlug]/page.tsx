"use client";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
export default function LessonPage({ params }: { params: { slug: string; lessonSlug: string } }) {
  const client = useQueryClient(); const { data: lesson, isLoading } = useQuery({ queryKey: ["lesson", params.lessonSlug], queryFn: async () => (await api.get(`/courses/${params.slug}/lessons/${params.lessonSlug}`)).data });
  const complete = useMutation({ mutationFn: async () => api.post("/progress", { courseId: lesson.courseId, lessonId: lesson.id, status: "COMPLETED", mastery: 100 }), onSuccess: () => client.invalidateQueries({ queryKey: ["progress"] }) });
  if (isLoading) return <main className="max-w-4xl mx-auto px-6 py-10 animate-pulse"><div className="h-8 w-64 bg-muted rounded" /></main>;
  if (!lesson) return null;
  return <main className="max-w-4xl mx-auto px-6 py-10"><Link href={`/courses/${params.slug}`} className="text-sm text-primary">← {lesson.course.title}</Link><h1 className="text-3xl font-bold mt-5">{lesson.title}</h1><article className="prose prose-invert max-w-none mt-6 whitespace-pre-wrap">{lesson.content || lesson.description}</article><section className="mt-8"><h2 className="text-xl font-semibold">Exercises</h2>{lesson.exercises.length ? lesson.exercises.map((exercise: any) => <div key={exercise.id} className="p-4 mt-3 rounded-xl bg-card border border-border/50"><p className="font-medium">{exercise.title}</p><p className="text-sm text-muted-foreground mt-1">{exercise.description}</p></div>) : <p className="text-muted-foreground mt-3">No exercises for this lesson yet.</p>}</section><button onClick={() => complete.mutate()} disabled={complete.isPending} className="mt-8 px-4 py-2 bg-primary text-primary-foreground rounded">{complete.isPending ? "Saving…" : "Mark complete"}</button></main>;
}
