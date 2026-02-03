---
name: Telecom Agent Skill
description: Give your Agent the power of Voice & SMS. Connects to Telop.dev cloud.
version: 1.1.0
---

# 📡 Telecom Agent Skill

**Turn your AI Agent into a phone operator.**

This skill allows your MoltBot or OpenClaw agent to make real phone calls, send SMS, and "remember" conversations via the [Telop.dev](https://telop.dev) cloud.

## ✨ Capabilities

### 🗣️ Voice & Speech
*   **Make Calls**: Agent can dial any number.
*   **Speak**: "Text-to-Speech" intro messages.
*   **Listen**: Records the call audio automatically.

### 🧠 Agent Memory
*   **Transcription**: The agent can read the text transcript of the call to understand what happened.
*   **Persistence**: All logs are saved to your secure dashboard.

### 🛡️ Safety Layer
*   **Human-in-the-Loop**: High-risk calls (like international dialing) can be configured to require *Human Approval* via the dashboard before the agent proceeds.

## 🚀 Quick Start

### 1. Installation
Install this skill into your agent.
```bash
/install https://github.com/kflohr/telecom-agent-skill
```

### 2. Configuration (One-time)
Your agent needs to link to your Twilio account.
```bash
telecom onboard
# Follow the prompts to enter Account SID & Auth Token
```

### 3. Usage Examples

**Make a Call:**
```bash
telecom agent call +14155550100 --intro "Hello, I am calling from the dental office to confirm your appointment."
```

**Check Memory (Transcript):**
```bash
telecom agent memory CA12345...
```
