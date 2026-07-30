"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import {
  Play, Bug, Eye, RotateCcw, Copy, Check, Wand2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
];

const DEFAULT_CODE = `function processData(items) {
  const results = [];
  for (let i = 0; i < items.length; i++) {
    // BUG: Potential off-by-one here?
    const val = items[i + 1];
    results.push(val * 2);
  }
  return results;
}

const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
console.log(processData(data));`;

export default function PlaygroundPage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [aiMode, setAiMode] = useState<"explain" | "review" | "debug" | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const runCode = () => {
    setIsRunning(true);
    setOutput("");
    if (language === "javascript" || language === "typescript") {
      const logs: string[] = [];
      const mockConsole = {
        log: (...args: any[]) => logs.push(args.map((a) => String(a)).join(" ")),
        error: (...args: any[]) => logs.push(`Error: ${args.map((a) => String(a)).join(" ")}`),
      };
      try {
        const fn = new Function("console", code);
        fn(mockConsole);
        setOutput(logs.join("\n") || "Code executed successfully (no output)");
      } catch (err: any) {
        setOutput(`Runtime Error: ${err.message}`);
      }
    } else {
      setOutput(`Execution for ${language} requires a backend runner.\n\nFor now, use the AI features to review and debug your code.`);
    }
    setIsRunning(false);
  };

  const handleAiAction = async (mode: "explain" | "review" | "debug") => {
    setAiMode(mode);
    setIsAiLoading(true);
    setAiResponse("");
    try {
      let endpoint = "";
      let body: any = { code, language };
      if (mode === "explain") endpoint = "/playground/explain";
      else if (mode === "review") endpoint = "/playground/review";
      else if (mode === "debug") {
        endpoint = "/playground/debug";
        body.error = output || "Unknown error";
      }
      const { data } = await api.post(endpoint, body);
      setAiResponse(data.content);
    } catch (error) {
      setAiResponse("Failed to get AI response. Please try again.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-14 border-b border-border/50 glass flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <select value={language} onChange={(e) => setLanguage(e.target.value)}
            className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary">
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>
          <span className="text-sm text-muted-foreground">
            main.{language === "typescript" ? "ts" : language === "javascript" ? "js" : language}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copyCode} className="p-2 rounded-lg hover:bg-muted transition text-muted-foreground" title="Copy code">
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
          </button>
          <button onClick={() => setCode("")} className="p-2 rounded-lg hover:bg-muted transition text-muted-foreground" title="Reset">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={runCode} disabled={isRunning}
            className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 flex items-center gap-2">
            <Play className="w-4 h-4" />
            {isRunning ? "Running..." : "Run"}
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        <div className="flex-1 min-w-0">
          <Editor height="100%" language={language} value={code}
            onChange={(value) => setCode(value || "")}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 16 },
              fontFamily: "JetBrains Mono, monospace",
            }}
          />
        </div>

        <div className="w-96 border-l border-border/50 flex flex-col bg-card">
          <div className="p-4 border-b border-border/50">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Conrad AI</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { mode: "explain" as const, icon: Eye, label: "Explain" },
                { mode: "review" as const, icon: Wand2, label: "Review" },
                { mode: "debug" as const, icon: Bug, label: "Debug" },
              ].map(({ mode: m, icon: Icon, label }) => (
                <button key={m} onClick={() => handleAiAction(m)}
                  className={`p-2 rounded-lg border text-xs font-medium transition flex flex-col items-center gap-1 ${
                    aiMode === m ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
                  }`}>
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {aiMode && (aiResponse || isAiLoading) ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                    <Wand2 className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm font-medium">
                    {aiMode === "explain" && "Code Explanation"}
                    {aiMode === "review" && "Code Review"}
                    {aiMode === "debug" && "Debug Analysis"}
                  </span>
                </div>
                {isAiLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Conrad is analyzing...</span>
                  </div>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{aiResponse}</ReactMarkdown>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Console Output</span>
                </div>
                <pre className="text-sm font-mono text-muted-foreground whitespace-pre-wrap">
                  {output || "Run your code to see output here..."}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
