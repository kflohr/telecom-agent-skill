---
name: "Telecom Agent Skill"
description: "Turn your AI Agent into a phone operator. Make calls, send SMS, and remember conversations."
version: "1.1.1"
---

# 📡 Telecom Agent Skill

**Turn your AI Agent into a phone operator.**

This skill allows your **MoltBot** or **OpenClaw** agent to make real phone calls, send SMS, and "remember" conversations via the Telop.dev cloud.

## ✨ Capabilities

### 🗣️ Voice & Speech
*   **Make Calls**: Agent can dial any number globally.
*   **Speak**: Dynamic "Text-to-Speech" intro messages.
*   **Listen**: Records the call audio automatically.

### 🧠 Agent Memory
*   **Transcript**: The agent receives a full text transcript.
*   **Audio**: Access the raw MP3 recording.
*   **Persistence**: Logs saved to your Operator Console.

### 🛡️ Safety Layer
*   **Approvals**: Require human approval for high-risk calls.
*   **Audit**: Full traceability.

---

## 🚀 Quick Start

### 1. Installation
```bash
/install https://github.com/kflohr/telecom-agent-skill
```

### 2. Setup
```bash
telecom onboard
```

### 3. Usage
```bash
telecom agent call +14155550100 --intro "Hello!"
telecom agent memory <CallSid>
```
