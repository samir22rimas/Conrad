"use client";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
export default function CoursesPage() {
  const { data: courses = [], isLoading } = useQuery({ queryKey: ["courses"], queryFn: async () => (await api.get("/courses")).data });
  return <main className="max-w-6xl mx-auto px-6 py-10"><Link href="/dashboard" className="text-sm text-primary">← Dashboard</Link><h1 className="text-3xl font-bold mt-4">Courses</h1><p className="text-muted-foreground mt-1">Published learning paths from your database.</p><div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">{isLoading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 rounded-2xl bg-muted animate-pulse" />) : courses.length ? courses.map((course: any) => <Link key={course.id} href={`/courses/${course.slug}`} className="p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/50"><p className="text-xs text-primary">{course.category} · {course.difficulty}</p><h2 className="font-semibold text-lg mt-2">{course.title}</h2><p className="text-sm text-muted-foreground mt-2 line-clamp-3">{course.description}</p><p className="text-xs text-muted-foreground mt-4">{course._count.lessons} lessons</p></Link>) : <p className="text-muted-foreground">No published courses are available yet.</p>}</div></main>;
}
