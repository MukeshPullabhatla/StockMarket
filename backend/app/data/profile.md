# Mukesh Kumar Pullabhatla — profile

This file is the ONLY source of facts for the "Ask about Mukesh" assistant on
his website. Edit it to change what the assistant knows. Anything not written
here, the assistant will say it doesn't know. Keep it public-safe: no internal
repository or system names, no confidential employer details.

## Summary
- Name: Mukesh Kumar Pullabhatla (goes by Mukesh; site name "Mukesh KP").
- Current title: Software Developer III — AI Engineer, at United Wholesale
  Mortgage (UWM).
- Designs and builds production GenAI and conversational AI platforms for the
  mortgage industry, across the full lifecycle: architecture, implementation,
  testing, CI/CD and live production deployment.
- At UWM he architected ChatUWM and the GenAI microservices platform it runs
  on: LLM orchestration across Vertex AI, Azure OpenAI, OpenAI, Gemini and
  Claude; RAG and knowledge-graph search; real-time voice agents; and shared
  libraries other teams build on.
- Strong full-stack (.NET, Python, React/TypeScript) and cloud/DevOps
  engineering background.

## Experience
### United Wholesale Mortgage (UWM) — current
- Role: Software Developer III — AI Engineer.
- UWM is the largest mortgage lender in the U.S.
- Architecting and building ChatUWM and the GenAI platform behind it, used by
  brokers, account executives and underwriters to work with loan data and
  mortgage processes through natural conversation.

### Rocket Companies — previous
- Built scalable web platforms in the mortgage tech space.

## Work highlights (at UWM)
### ChatUWM — enterprise conversational AI platform
- Designed and built it end to end: a core .NET API with a domain-driven
  architecture, a real-time streaming layer (SignalR), an integration layer
  connecting it with other services, and a React + TypeScript + Vite frontend.
- Extracted a reusable agent component framework (chat, citations, document
  upload, charts, real-time notifications) that now powers 4+ specialized AI
  agents, so new agents don't rebuild chat infrastructure each time.

### GenAI microservices platform
- Designed the platform pattern GenAI services run on: a plugin-based gateway
  and router in front of the AI services, and a reusable "Starter Kit" service
  template that new GenAI services are built from.
- Platform services for configuration, prompt history, model management,
  text-to-speech audio, and AI-assisted writing (emails, texts, call scripts).
- An evaluation framework that uses mutation testing to validate AI/LLM output
  quality.
- Early adopter of the Model Context Protocol (MCP) for standardized LLM
  tool/agent interoperability.
- Shared .NET libraries used across services: resilient HTTP/retry handling,
  Redis caching, Kafka Avro schema registry, vector management, and a shared
  test harness.
- Self-service admin and smart-tools consoles for managing the platform.

### RAG and knowledge-graph search
- Built the pipeline behind retrieval-augmented generation (RAG): document
  preprocessing and ingestion, enrichment (BigQuery, Pub/Sub, Orkes Conductor),
  transformation, and indexing into an Azure Cosmos DB (Gremlin) knowledge
  graph, so AI answers are grounded in company content.

### Real-time voice AI agent
- Worked on an LLM-powered phone agent: a real-time Pipecat pipeline over
  Twilio/Daily telephony, with Deepgram speech-to-text, OpenAI/Gemini
  reasoning and ElevenLabs text-to-speech, orchestrated with Orkes Conductor
  workflows.

### Lending platform services
- Contributed to rules-driven services behind loan origination: income
  calculation and loan validation on the NRules rules engine, a loan product
  and pricing qualification engine with a quote UI, identity and entitlement
  propagation across services, and an enterprise content gateway.

### Multi-cloud AI R&D
- Prototyped Google Vertex AI integration (C# and Python) alongside the Azure
  OpenAI stack to inform a multi-cloud AI strategy.
- Built Kafka producer/consumer reference implementations for event-driven
  messaging.

## Skills
- AI / LLM: Vertex AI, Azure OpenAI, OpenAI, Gemini, Claude; LLM
  orchestration, RAG, Model Context Protocol (MCP), prompt engineering,
  knowledge graphs, AI output evaluation (mutation testing).
- Voice AI: Pipecat, Deepgram (STT), ElevenLabs (TTS), Twilio, Daily.
- Languages: C# (.NET 6/8/10), TypeScript, JavaScript, Python.
- Frontend: React, Vite, MUI, SignalR client.
- Backend: ASP.NET Core, FastAPI, Node.js/Express, Domain-Driven Design,
  NRules rules engine.
- Data & messaging: Kafka (Confluent, Avro schema registry), Pub/Sub,
  BigQuery, Orkes Conductor.
- Data stores: Azure Cosmos DB (Gremlin graph API), Redis, SQL Server.
- Cloud & DevOps: AWS, Azure, GCP, Docker, Docker Compose, Kubernetes/Helm,
  Terraform, Jenkins, CircleCI, nginx.
- Testing & quality: xUnit, Vitest, Pytest, Stryker mutation testing.
- Security & identity: JWT, Active Directory, entitlement/impersonation
  propagation.
- Content & search: Nuxeo, Coveo, Azure Blob Storage.
- Version control: GitHub, Bitbucket.

## Projects
### This website (mukeshpullabhatla.com)
- Personal site with Home, Stocks and Contact pages, an animated AI-themed
  design, a privacy-friendly visitor counter, and this "Ask about Mukesh"
  assistant (grounded only in this profile, with rate limiting).
- Self-hosted on an Oracle Cloud VM with Docker Compose, Caddy for automatic
  HTTPS, on his own domain mukeshpullabhatla.com.

### Stock Trend Dashboard (on this site, under Stocks)
- Live stock dashboard: quotes, trend charts, market movers, and a personal
  watchlist, with real-time price updates over WebSockets.
- AI market assistant that uses LLM tool calling: the model must call live
  market-data tools (quotes, price history, top movers) before answering, so
  every number it cites is current rather than from training data. Answers
  stream token by token.
- Stack: React + TypeScript (Vite), FastAPI (Python), yfinance for market
  data, SQLite, an LLM via the Groq API; rate limiting and caching to protect
  the AI quota and data provider.

## Not in this profile
- Education, certifications, years of experience, location and salary are not
  listed here — suggest contacting Mukesh directly for those.

## Contact
- Email: amukeshps@gmail.com
- LinkedIn: https://www.linkedin.com/in/mukesh-kumar-pullabhatla-47a502200
- GitHub: https://github.com/mukeshpullabhatla
- Website contact page: /contact
