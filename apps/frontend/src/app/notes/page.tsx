"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { FileText, FolderPlus, Plus, Search, Trash2, BookOpen, Terminal } from "lucide-react";
import Link from "next/link";

interface Note {
  id: string;
  title: string;
  content: string;
  summary?: string;
  createdAt: string;
}

export default function NotesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  // Using custom chats or playground templates as backing for notes demo
  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ["notes"],
    queryFn: async () => [
      {
        id: "1",
        title: "Recursion Basics",
        content: "Recursion is a process in which a function calls itself directly or indirectly. Essential parts: 1. Base Case, 2. Recursive Step.",
        summary: "A function self-reference mechanism requiring base and recursive steps to prevent stack overflow.",
        createdAt: new Date().toISOString()
      },
      {
        id: "2",
        title: "Big O Complexity",
        content: "Big O notation describes the execution time or space used by an algorithm in terms of the input size N.",
        summary: "Mathematical upper bound notation describing algorithmic time/space scaling.",
        createdAt: new Date().toISOString()
      }
    ]
  });

  const handleCreateNote = () => {
    if (!newTitle.trim()) return;
    const note: Note = {
      id: Date.now().toString(),
      title: newTitle,
      content: newContent,
      summary: "AI Summary: " + newContent.substring(0, 60) + "...",
      createdAt: new Date().toISOString()
    };
    notes.push(note);
    setNewTitle("");
    setNewContent("");
    setSelectedNote(note);
  };

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="glass border-b border-border/50 h-16 flex items-center justify-between px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Terminal className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold">Conrad Study Notes</span>
        </Link>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          Back to Dashboard
        </Link>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full md:w-80 border-r border-border/50 bg-card/30 flex flex-col p-4 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-muted/50 rounded-xl border border-border/50 text-sm focus:outline-none focus:border-primary/50"
            />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-muted-foreground uppercase">All Notes</span>
            <button onClick={() => setSelectedNote(null)} className="p-1 hover:bg-muted rounded text-primary">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredNotes.map(n => (
              <button
                key={n.id}
                onClick={() => setSelectedNote(n)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedNote?.id === n.id ? "bg-primary/10 border-primary/30" : "bg-card hover:bg-muted border-border/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <p className="font-medium text-sm truncate">{n.title}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.content}</p>
              </button>
            ))}
          </div>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 p-6 overflow-y-auto flex flex-col space-y-6">
          {selectedNote ? (
            <article className="space-y-6 max-w-3xl">
              <div>
                <h1 className="text-3xl font-bold">{selectedNote.title}</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Saved on {new Date(selectedNote.createdAt).toLocaleDateString()}
                </p>
              </div>

              {selectedNote.summary && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">AI Key Takeaway</span>
                  <p className="text-sm leading-relaxed">{selectedNote.summary}</p>
                </div>
              )}

              <div className="prose prose-invert max-w-none">
                <p className="whitespace-pre-wrap leading-relaxed">{selectedNote.content}</p>
              </div>
            </article>
          ) : (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold">Create New Study Note</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Save code explanations, AI tutoring insights, or custom notes here.
                </p>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium">Title</span>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Recursion base cases..."
                    className="w-full mt-1.5 p-3 bg-muted/50 rounded-xl border border-border/50 focus:outline-none focus:border-primary/50"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium">Content</span>
                  <textarea
                    rows={8}
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    placeholder="Paste details or explanations here..."
                    className="w-full mt-1.5 p-3 bg-muted/50 rounded-xl border border-border/50 focus:outline-none focus:border-primary/50 text-sm"
                  />
                </label>

                <button
                  onClick={handleCreateNote}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition"
                >
                  Create Note
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
