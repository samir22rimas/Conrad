"use client";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
export default function CourseDetailPage({ params }: { params: { slug: string } }) {
  const { data: course, isLoading, isError } = useQuery({ queryKey: ["course", params.slug], queryFn: async () => (await api.get(`/courses/${params.slug}`)).data });
  if (isLoading) return <main className="max-w-4xl mx-auto px-6 py-10 animate-pulse"><div className="h-8 w-64 bg-muted rounded" /><div className="h-40 bg-muted rounded-2xl mt-6" /></main>;
  if (isError || !course) return <main className="max-w-4xl mx-auto px-6 py-10"><Link href="/courses" className="text-primary">← Courses</Link><p className="mt-6">Course not found.</p></main>;
  return <main className="max-w-4xl mx-auto px-6 py-10"><Link href="/courses" className="text-sm text-primary">← Courses</Link><p className="text-sm text-primary mt-5">{course.category} · {course.difficulty}</p><h1 className="text-3xl font-bold mt-2">{course.title}</h1><p className="text-muted-foreground mt-3">{course.description}</p><section className="mt-8 space-y-3"><h2 className="text-xl font-semibold">Lessons</h2>{course.lessons.length ? course.lessons.map((lesson: any) => <Link key={lesson.id} href={`/courses/${params.slug}/lessons/${lesson.slug}`} className="block p-5 rounded-xl bg-card border border-border/50 hover:border-primary/50"><div className="flex justify-between gap-4"><div><p className="font-medium">{lesson.order + 1}. {lesson.title}</p><p className="text-sm text-muted-foreground mt-1">{lesson.description}</p></div><span className="text-xs text-muted-foreground whitespace-nowrap">{lesson.duration} min</span></div></Link>) : <p className="text-muted-foreground">Lessons will appear when published.</p>}</section></main>;
}
