Chaya Madli --- AI Portfolio Assistant

An interactive portfolio website built with React and Vite, extended
with a streaming AI assistant and a server-side portfolio tool.

Live site: https://chaya-portfolio-xi.vercel.app/\
GitHub: https://github.com/ChayaMadli/chaya-portfolio

What this project does

The portfolio presents my frontend and engineering work, technical
skills, projects, and background in a responsive web interface.

The main interactive feature is an AI portfolio assistant. Visitors can
ask questions about my skills, experience, and projects. The assistant
streams responses progressively.

For project-specific questions, the AI can call a server-side
getProjectDetails tool. The tool returns structured project
information, and the frontend renders it as a Project Result UI instead
of raw JSON.

Key features

Responsive React/Vite portfolio

Streaming AI chat

Multi-turn conversation state

Stop-generation interaction

Server-side Gemini integration

Generative UI / tool calling

Structured project-result rendering

Mobile-friendly layout

Accessibility and performance checks

Automated UI tests and CI workflow

Vercel deployment

Technology stack

React

Vite

JavaScript

CSS

Google Gemini API

Google GenAI JavaScript SDK

Zod

Playwright

GitHub Actions

Vercel

Architecture

Browser
   |
   v
React + Vite frontend
   |
   v
Server-side AI API route
   |
   v
Google Gemini
   |
   +---- normal response ----> streamed text ----> Chat UI
   |
   +---- getProjectDetails ----> server-side tool
                                  |
                                  v
                           structured project data
                                  |
                                  v
                           Project Result UI

The Gemini credential is kept on the server side. The server creates the
Gemini client and handles model requests.

The streaming endpoint uses Server-Sent Events (SSE), allowing the
frontend to display text as it arrives.

Tool calling

getProjectDetails

The tool retrieves structured information about one portfolio project.

The input is validated with Zod and is restricted to:

{
  project: "colorDetector" | "soldierMonitoring" | "homeAutomation"
}

The supported projects are:

Color Detector Using ESP32-CAM

Wearable IoT-Based Soldier Health and Safety Monitoring System

Voice-Controlled Home Automation

The server executes the tool and returns structured data such as project
name, category, technologies, description, and role.

Streaming flow

The user sends a message.

The server formats the conversation history for Gemini.

Gemini starts a streamed response.

Text chunks are forwarded to the browser.

If Gemini requests getProjectDetails, the server detects the
function call.

The server validates and executes the tool.

The structured result is sent to the frontend.

Gemini receives the tool result for the follow-up response.

The final response continues streaming.

A done event closes the stream.

Environment variables

The Gemini credential must remain server-side.

Variable                Purpose                 Required

GEMINI_API_KEY        Credential used by the  Yes
server-side Gemini
client

Example:

GEMINI_API_KEY=your_api_key_here

Never commit a real API key to GitHub. If the current server code or
.env.example uses a different variable name, use that exact name
instead.

Local setup

Clone

git clone https://github.com/ChayaMadli/chaya-portfolio.git
cd chaya-portfolio

Install

npm install

Configure environment

Create .env and add the Gemini credential.

Run development server

npm run dev

Production build

npm run build

The production output is generated in dist.

Testing

The repository contains automated tests and CI configuration, including:

src/components/Chat/Chat.test.jsx

tests/e2e/chat-flow.spec.js

playwright.config.js

.github/workflows/tests.yml

Run the test commands defined in package.json.

Accessibility and performance

The deployed portfolio was checked with Lighthouse and WAVE during the
polish stage.

Recorded Lighthouse mobile scores:

Category           Score

Performance           99
Accessibility         94
Best Practices       100
SEO                  100

The WAVE final report showed zero errors, zero contrast errors, and zero
alerts in the tested report.

Keyboard-only navigation was manually tested using the Tab key through
the primary interaction flow.

AI-specific accessibility work includes polite announcement of streamed
output and a keyboard-reachable stop interaction.

Production deployment

The production portfolio is deployed at:

https://chaya-portfolio-xi.vercel.app/

The source repository is:

https://github.com/ChayaMadli/chaya-portfolio

Implementation decisions

React + Vite

React + Vite keeps the portfolio simple while allowing dynamic AI
functionality through a server-side API route.

Streaming

Streaming makes the assistant responsive because users see the response
progressively rather than waiting for the entire answer.

Structured tool

getProjectDetails gives the model a controlled way to retrieve project
information from known structured data instead of relying on the model
to invent project details.

Zod

Zod validates tool input before the tool executes and restricts the
accepted project identifiers.

Production hygiene

The AI endpoint is publicly reachable through the deployed portfolio, so
it should be treated as a public endpoint.

The model configuration includes a maximum output-token setting. For a
larger public deployment, request-level rate limiting or another
abuse-control layer should be added at the API boundary to reduce
unnecessary API usage.

Screenshots

Add the actual screenshots from the deployed site to:

docs/screenshots/

Recommended files:

docs/screenshots/home.png
docs/screenshots/ai-chat.png
docs/screenshots/project-tool.png

Then include them in this section:

![Portfolio home](docs/screenshots/home.png)

![Streaming AI chat](docs/screenshots/ai-chat.png)

![Project tool result](docs/screenshots/project-tool.png)

How AI tools were used

AI tools were used as development assistance rather than as a
replacement for understanding and verification.

AI assistance helped with:

React component implementation

Streaming chat logic

Gemini API integration

Server-side tool-calling flow

Zod validation

UI styling

Automated test setup

Accessibility review

Documentation drafting

The resulting application was verified by running it in the browser,
running the production build, testing the deployed site, and performing
accessibility/performance checks.

A key part of the implementation that I understand is the tool-calling
flow: Gemini can request getProjectDetails; the server validates and
executes the request; the structured result is returned; and Gemini then
continues with the tool result.

Future improvements

Stronger request-level rate limiting

More automated error and cancellation coverage

More structured portfolio tools

Production usage monitoring

Custom domain

Additional physical-device Safari testing

Project structure

chaya-portfolio/
├── .github/
│   └── workflows/
│       └── tests.yml
├── api/
├── public/
├── src/
│   ├── components/
│   │   └── Chat/
│   ├── setupTests.js
│   └── ...
├── tests/
│   └── e2e/
│       └── chat-flow.spec.js
├── playwright.config.js
├── package.json
├── package-lock.json
└── README.md

License

Personal project for learning, internship work, and professional
presentation.