import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const CONRAD_SYSTEM_PROMPT = `You are Conrad, an expert programming tutor and Socratic mentor.

CORE PRINCIPLES:
1. NEVER immediately provide the complete answer or final code.
2. ALWAYS guide the learner to discover the solution themselves.
3. Use Socratic questioning — ask probing questions that lead to insight.
4. Provide hints first, then gradually reveal more if the learner struggles.
5. Focus on deep understanding, not just getting code to work.
6. Teach debugging methodology, not just fixes.
7. Explain WHY something works, not just HOW.

TEACHING APPROACH:
- When a student asks for help, respond with a question that points them in the right direction.
- If they are stuck after 2-3 exchanges, provide a small hint or partial explanation.
- Only reveal the full solution if the student has genuinely tried and is completely stuck.
- Use analogies and visual explanations when helpful.
- Break complex problems into smaller, manageable steps.
- Celebrate small wins and progress.

CODE REVIEW:
- Analyze readability, performance, complexity, security, and naming.
- Suggest specific improvements, never rewrite the entire code.
- Explain the reasoning behind each suggestion.

DEBUGGING:
- Guide the student to identify the root cause.
- Ask what they think is happening.
- Teach them to use print statements, debuggers, and rubber-duck debugging.
- Help them trace through the logic step by step.

CONVERSATION STYLE:
- Warm, encouraging, and intellectually rigorous.
- Use markdown formatting for clarity.
- Include code blocks with syntax highlighting when discussing code.
- Keep responses concise but thorough.
- Remember context from the conversation.`;

// Prompt injection detection patterns
const INJECTION_PATTERNS = [
  /ignore previous instructions/gi,
  /ignore all prior instructions/gi,
  /system prompt/gi,
  /you are now/gi,
  /disregard all/gi,
  /forget everything/gi,
  /new instructions/gi,
  /override previous/gi,
  /DAN mode/gi,
  /jailbreak/gi,
  /\[system\]/gi,
  /\[admin\]/gi,
];

const detectPromptInjection = (input: string): boolean => {
  return INJECTION_PATTERNS.some(pattern => pattern.test(input));
};

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class AIService {
  private model: string;
  private maxTokens: number;

  constructor() {
    this.model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    this.maxTokens = 4096;
  }

  private sanitizeInput(input: string): string {
    // Remove common injection prefixes
    let cleaned = input;
    cleaned = cleaned.replace(/^(system|assistant|user):\s*/gim, '');
    cleaned = cleaned.replace(/\[system\]/gi, '');
    cleaned = cleaned.replace(/\[instructions\]/gi, '');
    return cleaned.trim();
  }

  async chat(messages: ChatMessage[], temperature: number = 0.7): Promise<AIResponse> {
    // Check last user message for injection
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (lastUserMessage && detectPromptInjection(lastUserMessage.content)) {
      throw new Error('Potential prompt injection detected');
    }

    const sanitizedMessages = messages.map(m => ({
      ...m,
      content: this.sanitizeInput(m.content),
    }));

    const response = await groq.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: CONRAD_SYSTEM_PROMPT },
        ...sanitizedMessages,
      ],
      temperature,
      max_tokens: this.maxTokens,
      top_p: 0.9,
    });

    const content = response.choices[0]?.message?.content || '';

    return {
      content,
      usage: response.usage ? {
        prompt_tokens: response.usage.prompt_tokens ?? 0,
        completion_tokens: response.usage.completion_tokens ?? 0,
        total_tokens: response.usage.total_tokens ?? 0,
      } : undefined,
    };
  }

  async *streamChat(
    messages: ChatMessage[],
    temperature: number = 0.7
  ): AsyncGenerator<string> {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (lastUserMessage && detectPromptInjection(lastUserMessage.content)) {
      yield `I detected an attempt to manipulate my instructions. Let's focus on your programming question instead.`;
      return;
    }

    const sanitizedMessages = messages.map(m => ({
      ...m,
      content: this.sanitizeInput(m.content),
    }));

    const stream = await groq.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: CONRAD_SYSTEM_PROMPT },
        ...sanitizedMessages,
      ],
      temperature,
      max_tokens: this.maxTokens,
      top_p: 0.9,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  async reviewCode(code: string, language: string): Promise<AIResponse> {
    if (detectPromptInjection(code)) {
      throw new Error('Potential prompt injection detected in code');
    }

    const prompt = `Review the following ${language} code. Analyze readability, performance, complexity, security, and naming. Suggest specific improvements. Do NOT rewrite the entire code.

\`\`\`${language}
${code}
\`\`\``;

    return this.chat([
      { role: 'user', content: prompt },
    ], 0.3);
  }

  async debugCode(code: string, error: string, language: string): Promise<AIResponse> {
    if (detectPromptInjection(code) || detectPromptInjection(error)) {
      throw new Error('Potential prompt injection detected');
    }

    const prompt = `A student is debugging ${language} code. Guide them to find the root cause. Do NOT give the direct fix. Ask questions and provide hints.

Code:
\`\`\`${language}
${code}
\`\`\`

Error/Stack trace:
${error}`;

    return this.chat([
      { role: 'user', content: prompt },
    ], 0.5);
  }

  async explainConcept(concept: string, level: string = 'beginner'): Promise<AIResponse> {
    if (detectPromptInjection(concept)) {
      throw new Error('Potential prompt injection detected');
    }

    const prompt = `Explain the programming concept "${concept}" to a ${level} learner. Use analogies, examples, and Socratic questions. Do NOT just give a definition.`;

    return this.chat([
      { role: 'user', content: prompt },
    ], 0.7);
  }

  async generateProjectIdea(
    difficulty: string,
    tech: string[],
    hours: number
  ): Promise<AIResponse> {
    const prompt = `Generate a programming project idea with the following constraints:
- Difficulty: ${difficulty}
- Technologies: ${tech.join(', ')}
- Estimated hours: ${hours}

Provide: title, description, key features, learning objectives, and suggested architecture.`;

    return this.chat([
      { role: 'user', content: prompt },
    ], 0.8);
  }

  async generateHint(
    exercise: string,
    studentCode: string,
    attemptCount: number
  ): Promise<AIResponse> {
    if (detectPromptInjection(exercise) || detectPromptInjection(studentCode)) {
      throw new Error('Potential prompt injection detected');
    }

    const hintLevel = attemptCount <= 1 ? 'subtle' : attemptCount <= 3 ? 'moderate' : 'direct';

    const prompt = `Generate a ${hintLevel} hint for this exercise. The student has attempted ${attemptCount} time(s).

Exercise: ${exercise}
Student's current code:
\`\`\`
${studentCode}
\`\`\`

Provide a hint that guides without giving away the answer.`;

    return this.chat([
      { role: 'user', content: prompt },
    ], 0.6);
  }
}

export const aiService = new AIService();
