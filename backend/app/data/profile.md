# Mukesh Kumar Pullabhatla — profile

This file is the ONLY source of facts for the "Ask about Mukesh" assistant on
his website. Edit it to change what the assistant knows. Anything not written
here, the assistant will say it doesn't know.

## Summary
- Name: Mukesh Kumar Pullabhatla (goes by Mukesh; site name "Mukesh KP").
- Current title: Software Developer III — AI Engineer.
- Builds production conversational AI systems for the mortgage industry.
- Focus: integrating and orchestrating multiple AI platforms — Vertex AI,
  Azure AI, OpenAI, and Claude — into reliable, production-grade systems,
  backed by strong full-stack and cloud infrastructure engineering.

## Experience
### United Wholesale Mortgage (UWM) — current
- Role: Software Developer III — AI Engineer.
- UWM is the largest mortgage lender in the U.S.
- Develops ChatUWM, an AI-powered chat platform that helps brokers, account
  executives, and underwriters manage loan data and process mortgage payments
  through natural conversation.

### Rocket Companies — previous
- Built scalable web platforms in the mortgage tech space.

## Skills
- AI / LLM platforms: Vertex AI, Azure AI, OpenAI, Claude.
- Languages & frameworks: C#, .NET, TypeScript, React, Python, FastAPI.
- Cloud & infrastructure: AWS, Azure, GCP, Docker, Kubernetes, CircleCI.
- Version control: GitHub, Bitbucket.

## Projects
### This website (mukeshpullabhatla.com)
- Personal site with Home, Stocks and Contact pages, an animated AI-themed
  design, a privacy-friendly visitor counter, and this "Ask about Mukesh"
  assistant.
- Self-hosted on an Oracle Cloud VM with Docker Compose, Caddy for automatic
  HTTPS, on his own domain mukeshpullabhatla.com.

### Stock Trend Dashboard (on this site, under Stocks)
- Live stock dashboard: quotes, trend charts, market movers, and a personal
  watchlist, with real-time price updates over WebSockets.
- AI market assistant that uses LLM tool calling: the model must call live
  market-data tools (quotes, price history, top movers) before answering, so
  every number it cites is current rather than from training data.
- Stack: React + TypeScript (Vite), FastAPI (Python), yfinance for market
  data, SQLite, an LLM via the Groq API; rate limiting and caching to protect
  the AI quota and data provider.

## Contact
- Email: amukeshps@gmail.com
- LinkedIn: https://www.linkedin.com/in/mukesh-kumar-pullabhatla-47a502200
- GitHub: https://github.com/mukeshpullabhatla
- Website contact page: /contact
