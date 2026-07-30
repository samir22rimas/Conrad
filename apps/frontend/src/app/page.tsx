"use client";
import { motion } from "framer-motion";
import { Terminal, Brain, Code2, Sparkles, ArrowRight, Play } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Terminal className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">Conrad</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition">
              Sign In
            </Link>
            <Link href="/signup" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6 border border-primary/20">
              <Sparkles className="w-3 h-3" />
              AI-Powered Socratic Mentor
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Learn to Debug.<br />
              <span className="text-gradient">Don't Just Copy Answers.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Conrad is an AI coding tutor that teaches programming through guided discovery.
              Instead of writing code for you, Conrad asks the right questions until you find the solution yourself.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/signup" className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition flex items-center gap-2 glow-primary">
                Start Learning Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button className="px-8 py-3 border border-border rounded-xl font-semibold hover:bg-muted transition flex items-center gap-2">
                <Play className="w-4 h-4" />
                Watch Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Brain, title: "Socratic Method", desc: "Conrad never gives answers immediately. Through guided questions, you'll develop deep problem-solving intuition." },
              { icon: Code2, title: "Live Code Playground", desc: "Write, run, and debug code in multiple languages with real-time AI feedback and syntax highlighting." },
              { icon: Terminal, title: "Debug Like a Pro", desc: "Learn systematic debugging. Conrad teaches you to trace logic, not just patch symptoms." },
            ].map((feature, i) => (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-border/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to master the craft?</h2>
          <p className="text-muted-foreground mb-8">Join thousands of developers who learned to think before they code.</p>
          <Link href="/signup" className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition inline-flex items-center gap-2 glow-primary">
            Start Learning for Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">Conrad</span>
            <span>2024</span>
          </div>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-foreground transition">Privacy</Link>
            <Link href="#" className="hover:text-foreground transition">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
