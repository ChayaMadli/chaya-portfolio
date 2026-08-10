# Chaya Madli — AI Portfolio Assistant

An interactive AI-powered portfolio assistant built with React and Vite.

The application combines a streaming AI chat interface with a server-side portfolio tool that allows the AI to retrieve structured information about specific projects and render the result as a real UI component.

---

## FE-07 — Generative UI / Tool Calling

This project implements a server-side tool called `getProjectDetails`.

The tool allows the AI assistant to retrieve structured information about Chaya Madli's portfolio projects.

Instead of returning the tool result as raw JSON, the frontend renders the structured response as a dedicated **Project Result** component.

---

## Tool Contract

### Tool name

`getProjectDetails`

### Purpose

Retrieves structured information about one of Chaya Madli's portfolio projects.

The AI can call this tool when the user asks for details about a specific project.

### Input schema

The tool uses a Zod schema.

```js
{
  project: "colorDetector" | "soldierMonitoring" | "homeAutomation"
}