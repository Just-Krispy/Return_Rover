export type ArcherReply = {
  message: string;
  source: string;
};

type ArcherKnowledgeEntry = {
  title: string;
  prompts: readonly string[];
  response: string;
};

export const archerOpeningLine =
  "Hey — I'm Archer, Ryan's AI partner. I know his work inside out. What would you like to know about him?";

export const archerQuickPrompts = [
  "How many years of QA Automation experience?",
  "Tell me about OpenClaw",
  "AI agents, LLMs, and agentic systems?",
  "What's his US work authorization?",
] as const;

const knowledgeEntries: readonly ArcherKnowledgeEntry[] = [
  {
    title: "Ryan overview",
    prompts: [
      "who is ryan",
      "tell me about ryan",
      "what is his background",
      "qa background",
      "quality background",
      "work experience",
      "give me the short version",
      "summary",
      "30 second pitch",
    ],
    response:
      "Ryan is a Tampa Bay builder-engineer with 10+ years across enterprise systems administration, SaaS quality engineering leadership, and hands-on AI product development. By day he leads QA on Deloitte's Omnia platform across teams in six countries. After hours he's the lead architect on OpenClaw - a 24/7 multi-agent AI platform - and ships SpexInspect, PawsitiveID, a WiFi Privacy Scanner, and Nash. The short version: QA leader by day, AI founder by night, with real production systems on the AI side that have been compounding for over a year.",
  },
  {
    title: "Years of QA Automation experience",
    prompts: [
      "how many years",
      "years of qa",
      "years of automation",
      "years of qa automation",
      "qa automation experience",
      "automation years",
      "how long qa",
      "qa tenure",
      "years experience qa",
    ],
    response:
      "Five-plus years specifically as a QA Lead Engineer building automation at scale: Gale Healthcare Solutions (Dec 2020 – Dec 2023, 3 yrs) running web + mobile release cycles with Cypress, Perfecto, Postman, and GitHub Actions CI/CD; then Deloitte (Feb 2024 – present, 2+ yrs) on the Omnia platform leading global QA across six countries with Tosca, Playwright, and Azure DevOps. The standout recent work is a custom agentic workflow he built that converts legacy Tosca cases into Playwright — now adopted across the program. Counting his earlier systems and infrastructure tenure (AgFirst, Nordstrom), his total professional engineering experience is 10+ years, with 5+ of those squarely in QA Automation leadership.",
  },
  {
    title: "AI agents, LLMs, and agentic systems",
    prompts: [
      "ai experience",
      "llm experience",
      "agentic systems",
      "agentic ai",
      "ai agents",
      "ai agent",
      "agents and llms",
      "llms and agents",
      "agentic experience",
      "ai background",
      "experience with ai",
      "experience with llm",
      "mcp",
      "tool use",
    ],
    response:
      "Real production experience, not just course work. Ryan is the lead architect on OpenClaw — a 24/7 multi-agent orchestration platform running on a VPS — coordinating Claude, GPT-4.1, and ElevenLabs across Discord, voice, web, and SSH, with multi-provider LLM failover (Anthropic → OpenRouter → OpenAI), real-time streaming, 40+ reusable agent skills, MCP tool use, and self-healing health checks. On the QA side at Deloitte, he built a custom agentic workflow (a coordinated team of agents and skills) that migrates legacy Tosca test cases into Playwright — now adopted across the Omnia program. He's also shipping SpexInspect (Claude Vision + ElevenLabs voice coaching for inspectors) and Nash (multi-agent strategic reasoning). On the certification side, he's completed the AI Engineer Agentic Track: The Complete Agent & MCP Course, plus three Playwright + API automation courses, and is in progress on ISTQB CTFL v4.0. Net: 1.5+ years of hands-on agentic AI in production, applied to both his AI products *and* his day-job QA workflow.",
  },
  {
    title: "US work authorization",
    prompts: [
      "work authorization",
      "us work authorization",
      "authorization",
      "visa",
      "sponsorship",
      "citizen",
      "us citizen",
      "right to work",
      "eligible to work",
      "do you need sponsorship",
    ],
    response:
      "US Citizen — no sponsorship required, ever. He's authorized to work in the US for any employer with no restrictions or future expiration.",
  },
  {
    title: "ISTQB and certifications",
    prompts: [
      "istqb",
      "ctfl",
      "qa certification",
      "qa cert",
      "tester certification",
      "foundation level",
    ],
    response:
      "Ryan is currently in progress on the ISTQB CTFL v4.0 (Certified Tester Foundation Level), the globally recognized QA certification baseline. He also holds completed certificates from the AI Engineer Agentic Track: The Complete Agent & MCP Course, Playwright JS/TS Automation Testing from Scratch & Framework, Learn Playwright with TypeScript (Web & API Testing), and Playwright API Testing Mastery with TypeScript. His upskilling path is deliberately tilted toward modern QA automation and agentic AI together — the same blend his Deloitte agentic Tosca-to-Playwright migration project demonstrates.",
  },
  {
    title: "Why hire Ryan",
    prompts: [
      "why hire",
      "why is he a fit",
      "why should we hire him",
      "what makes him different",
      "differentiator",
      "why us",
      "why this role",
    ],
    response:
      "Three reasons. One: he's been shipping real AI products using a modern stack — multi-provider LLM routing, MCP tool use, ElevenLabs voice, real-time streaming, agentic workflows — for over a year already. He's not learning it, he's doing it. Two: he has 5+ years of proven QA Automation leadership at enterprise scale (Gale + Deloitte's Omnia platform across six countries), so he understands how to make AI products *reliable*, not just interesting. Most builders don't have that side. Three: he took the time to build this interactive resume — itself a multi-modal agentic AI product — because it shows, not tells, how he approaches building. That's the work, not a gimmick.",
  },
  {
    title: "Voice AI and ElevenLabs",
    prompts: [
      "elevenlabs",
      "voice ai",
      "conversational ai",
      "real-time voice",
      "does he have elevenlabs experience",
      "voice experience",
      "tts",
      "speech",
    ],
    response:
      "Yes, substantial production experience across two systems. In OpenClaw, ElevenLabs Conversational AI is the voice layer of a 24/7 multi-agent platform — voice in, voice out, integrated with multi-provider LLM routing. In SpexInspect, ElevenLabs coaches building inspectors in real time while they walk a property — voice that's *guided and in-context*, not just chat. He understands the API integration, the latency-aware UX, and the product-design implications of voice agents under real-world conditions.",
  },
  {
    title: "OpenClaw",
    prompts: [
      "openclaw",
      "archer",
      "multi-agent",
      "provider routing",
      "failover",
      "vps",
      "orchestration",
      "skills",
    ],
    response:
      "OpenClaw is Ryan's largest current AI build, and he's the lead architect. It's an always-on orchestration platform running 24/7 on a VPS that coordinates Claude, GPT-4.1, and ElevenLabs Conversational AI across Discord, voice, web, and SSH. Key pieces: multi-provider LLM failover (Anthropic → OpenRouter → OpenAI) so one provider throttling doesn't break the user experience, real-time streaming across all surfaces, 40+ reusable skills any agent can invoke, and autonomous operation via cron-driven heartbeats and self-healing health checks. It's not a prototype — it's been running in production for months. The punchline: Ryan has been in the trenches of real-time multi-agent orchestration, provider routing, and tool-using LLMs for well over a year already.",
  },
  {
    title: "SpexInspect",
    prompts: [
      "spexinspect",
      "inspection",
      "claude vision",
      "building inspection",
      "voice coaching",
      "field worker",
    ],
    response:
      "SpexInspect is an AI-powered building inspection product Ryan shipped. It pairs Claude Vision photo analysis with real-time ElevenLabs voice coaching for inspectors in the field. An inspector walks a property and takes photos; the AI reviews what it sees and coaches the inspector through voice — \"check that flashing above the window,\" \"look for moisture staining in the ceiling corner.\" Auto-generates HTML reports with session-linked photo archives. It's a direct parallel to STELLA's frontline-worker use case: voice that's helpful in the flow of work, not a chat sidebar.",
  },
  {
    title: "Deloitte",
    prompts: [
      "deloitte",
      "omnia",
      "current role",
      "qa lead",
      "day job",
      "global teams",
      "tosca",
      "playwright migration",
      "tosca to playwright",
      "agentic workflow",
      "legacy test cases",
      "pods",
      "azure devops",
    ],
    response:
      "Ryan is currently QA Lead Engineer at Deloitte on the Omnia platform, and has been since February 2024. His latest and strongest Deloitte accomplishment is a custom agentic workflow that uses a team of agents and skills to convert legacy Tosca test cases into Playwright. It is now being adopted across the program to help PODs accelerate test-case migration. He also leads global QA across six countries - US, South America, UK, Japan, China, Switzerland - with risk-and-regulatory QA discipline across Tosca, Azure DevOps, shift-left strategy, defect triage, and release accountability.",
  },
  {
    title: "Gale Healthcare Solutions",
    prompts: [
      "gale",
      "healthcare",
      "b2b saas",
      "previous role",
      "qa experience",
      "automation background",
      "cypress",
      "perfecto",
      "saas",
      "c-suite",
    ],
    response:
      "Before Deloitte (Dec 2020 – Dec 2023), Ryan was QA Lead Engineer at Gale Healthcare Solutions, a B2B SaaS healthcare staffing platform serving hospitals and enterprise clients. He led QA for web and mobile release cycles, managed a US team plus four QA specialists overseas, and built the automation suite — Cypress, Perfecto, Postman — wired into GitHub Actions CI/CD on every commit. He owned 250+ features and bugs across releases and engaged directly with enterprise clients and the C-suite on acceptance criteria. Real SaaS delivery, not just enterprise box-ticking.",
  },
  {
    title: "Earlier systems background",
    prompts: [
      "agfirst",
      "farm credit",
      "nordstrom",
      "system administrator",
      "infrastructure",
      "hurricane maria",
      "active directory",
      "puerto rico",
    ],
    response:
      "Before SaaS QA, Ryan spent six years in systems and infrastructure. At AgFirst Farm Credit Bank (2016-2019) he ran infrastructure across 23 Florida and Puerto Rico sites, automated patching and vulnerability remediation via scripting, and led disaster recovery for FC Puerto Rico during Hurricane Maria — direct support to the CEO and Board. Before that at Nordstrom (2013-2016) he supported 16 stores: Linux POS servers, Aruba WAPs, Avaya VOIP, MobileIron MDM, and led the technology setup for four new store openings. That hands-on infrastructure background is why he's comfortable owning OpenClaw end-to-end on a VPS today.",
  },
  {
    title: "Work style",
    prompts: [
      "what is he like to work with",
      "work style",
      "team fit",
      "leadership style",
      "teammate",
      "personality",
      "culture fit",
    ],
    response:
      "Ships fast, doesn't over-plan, and gives teammates room to operate. Builder-first — when he sees a problem, he tries to build a solution before asking if it's possible. Low ego, high trust, casual but serious — values competence over formality and doesn't do corporate-speak. Multi-project juggler: he's been balancing global QA leadership at Deloitte with multiple AI ventures on the side without turning chaotic. Bridges engineering and business naturally — has pitched to CEOs at Farm Credit and Puerto Rico recovery, worked with C-suite at Gale, and built for real customers. Calls his teammates \"brother\" and means it.",
  },
  {
    title: "Projects and stack",
    prompts: [
      "what else has he built",
      "projects",
      "stack",
      "pawsitiveid",
      "wifi privacy scanner",
      "nash",
      "tech stack",
      "languages",
    ],
    response:
      "Beyond OpenClaw and SpexInspect: PawsitiveID is a lost-pet AI matching platform on Supabase with vector similarity search. WiFi Privacy Scanner is a consumer security tool shipped on GitHub, part of a Privacy Tech AI agency he's building. Nash is an in-progress LLM-driven strategic reasoning platform for game-theory and geopolitical scenarios. The recurring stack: Python, Node.js, TypeScript, Next.js, Supabase, Vercel, REST + WebSockets for real-time streaming, ElevenLabs Conversational AI, Claude, GPT-4.1, Claude Vision, multi-provider LLM routing. On the QA side: Cypress, Playwright, Playwright API testing, Perfecto, Tosca, Postman, GitHub Actions, Azure DevOps, and Tosca-to-Playwright migration.",
  },
  {
    title: "Recent upskilling",
    prompts: [
      "certifications",
      "certificates",
      "coursework",
      "courses",
      "udemy",
      "agentic course",
      "mcp course",
      "playwright certification",
      "playwright course",
      "api testing certification",
    ],
    response:
      "Ryan has four recent certificates of completion: AI Engineer Agentic Track: The Complete Agent & MCP Course, Playwright JS/TS Automation Testing from Scratch & Framework, Learn Playwright with TypeScript (Web & API Testing), and Playwright API Testing Mastery with TypeScript. More broadly, he has been upskilling around agentic AI, MCP, Playwright frameworks, and API test strategy.",
  },
  {
    title: "Real-time and WebSocket experience",
    prompts: [
      "websocket",
      "real-time",
      "streaming",
      "low latency",
      "realtime",
    ],
    response:
      "Yes — OpenClaw's entire gateway is built on real-time streaming. LLM responses, voice synthesis, and multi-surface delivery (Discord, web, voice) all flow through a streaming layer with sub-second feedback. He's also worked with WebSocket-based testing tools in his QA career. Real-time is not theoretical for him; it's how his production system is wired today.",
  },
  {
    title: "Code and technical depth",
    prompts: [
      "can i see his code",
      "github",
      "open source",
      "technical depth",
      "code samples",
      "repos",
    ],
    response:
      "Yes — his GitHub is github.com/Just-Krispy, and several projects are public including the WiFi Privacy Scanner and pieces of OpenClaw. He's happy to walk through architecture or code directly if your team wants a technical conversation instead of just a resume screen. He also built this interactive resume site itself — that's the kind of thing he does when he wants to show, not tell, how he thinks about product.",
  },
  {
    title: "What makes him different",
    prompts: [
      "what makes him different",
      "why him",
      "why ryan",
      "differentiator",
      "stand out",
      "compete",
      "other applicants",
    ],
    response:
      "Three things. One: he's been shipping real AI products using your exact stack — ElevenLabs, multi-provider LLM routing, real-time streaming — for over a year already. He's not learning it, he's doing it. Two: he has proven QA and systems leadership at enterprise scale, so he understands how to make AI products *reliable*, not just interesting. Most AI builders don't have that side. Three: he took the time to build this interactive resume because it mirrors what Oviie is building. That's not a gimmick — that's showing you, not telling you, how he approaches product.",
  },
  {
    title: "Why a QA Lead applying to voice AI",
    prompts: [
      "why qa",
      "qa to ai",
      "career change",
      "pivot",
      "transition",
      "qa lead voice",
    ],
    response:
      "The title on his current paycheck is QA Lead — but the work he's been doing for the past year is AI systems architecture. OpenClaw, SpexInspect, PawsitiveID, and his Privacy Tech AI agency are all real production AI products. He has QA leadership as a proven business skill on top of that, which is an asset for a growing startup that needs reliability — but the role he's applying to here is squarely in his current wheelhouse of voice, LLMs, and real-time orchestration. This isn't a pivot; it's the next step on a trajectory he's been on for a while.",
  },
  {
    title: "Contact and logistics",
    prompts: [
      "contact",
      "email",
      "phone",
      "location",
      "remote",
      "relocate",
      "talk to him directly",
      "linkedin",
      "schedule",
      "intro call",
    ],
    response:
      "Ryan is based in Tampa Bay, open to remote work and hybrid roles in the Tampa or Orlando corridor. Fastest contact is ryan.c.bradford@gmail.com or 813-758-9966. LinkedIn: linkedin.com/in/ryancbradford. GitHub: github.com/Just-Krispy. If you'd rather review code first or schedule a short intro call, any of those channels work — he replies quickly.",
  },
];

const stopWords = new Set([
  "a",
  "about",
  "an",
  "and",
  "are",
  "can",
  "does",
  "for",
  "have",
  "he",
  "him",
  "his",
  "i",
  "is",
  "me",
  "of",
  "or",
  "ryan",
  "tell",
  "the",
  "to",
  "what",
  "why",
  "with",
  "you",
]);

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !stopWords.has(token));
}

function scoreEntry(entry: ArcherKnowledgeEntry, normalizedQuestion: string, tokens: string[]) {
  let score = 0;

  for (const prompt of entry.prompts) {
    const normalizedPrompt = prompt.toLowerCase();

    if (normalizedQuestion.includes(normalizedPrompt)) {
      score += normalizedPrompt.includes(" ") ? 6 : 3;
    }

    const promptTokens = tokenize(normalizedPrompt);

    for (const token of tokens) {
      if (promptTokens.includes(token)) {
        score += 1;
      }
    }
  }

  return score;
}

export function getArcherReply(question: string): ArcherReply {
  const normalizedQuestion = question.trim().toLowerCase();
  const tokens = tokenize(question);

  if (/(salary|compensation|pay|paid|rate|wage|income)/.test(normalizedQuestion)) {
    return {
      message:
        "Ryan would rather discuss compensation directly once there's mutual interest. If that stage makes sense, the fastest path is to email him at ryan.c.bradford@gmail.com.",
      source: "Compensation is handled directly with the hiring team",
    };
  }

  let bestEntry = knowledgeEntries[0];
  let bestScore = 0;

  for (const entry of knowledgeEntries) {
    const score = scoreEntry(entry, normalizedQuestion, tokens);

    if (score > bestScore) {
      bestEntry = entry;
      bestScore = score;
    }
  }

  if (bestScore < 2) {
    return {
      message:
        "I don't have that detail - but Ryan would be happy to answer directly. You can reach him at ryan.c.bradford@gmail.com, or ask me about his QA Automation experience, OpenClaw, agentic AI work, ElevenLabs, SpexInspect, or his time at Deloitte.",
      source: "Outside the current grounded knowledge base",
    };
  }

  return {
    message: bestEntry.response,
    source: bestEntry.title,
  };
}
