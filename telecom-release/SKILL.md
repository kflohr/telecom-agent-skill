---
name: Telecom Agent Skill
description: Turn your AI Agent into a phone operator. Make calls, send SMS, and remember conversations.
version: 1.1.0
---

# 📡 Telecom Agent Skill

**Turn your AI Agent into a phone operator.**

This skill allows your **MoltBot** or **OpenClaw** agent to make real phone calls, send SMS, and "remember" conversations via the Telop.dev cloud.

## ✨ Capabilities

### 🗣️ Voice & Speech
*   **Make Calls**: Agent can dial any number globally.
*   **Speak**: Dynamic "Text-to-Speech" intro messages powered by Twilio.
*   **Listen**: Records the call audio automatically for later review.

### 🧠 Agent Memory
*   **Transcription**: The agent receives a full text transcript of the call to understand what happened.
*   **Audio Recall**: Access the raw MP3 recording directly from the agent's memory or chat interface.
*   **Persistence**: All logs are saved to your secure Operator Console dashboard.

### 🛡️ Safety Layer
*   **Human-in-the-Loop**: High-risk calls (like international dialing) can be configured to require **Human Approval** via the dashboard before the agent proceeds.
*   **Audit Log**: Every action is traced and logged.

---

## 🚀 Quick Start

### 1. Installation
Install this skill into your agent workspace.

```bash
/install https://github.com/kflohr/telecom-agent-skill
```

### 2. Configuration (One-time)
Your agent needs to link to your Twilio account to pay for the calls.

```bash
telecom onboard
# Follow the prompts to enter Account SID & Auth Token
```

### 3. Usage Examples

**Make a Smart Call**
Instruct your agent to call a customer or service.
```bash
telecom agent call +14155550100 --intro "Hello, I am calling from the dental office to confirm your appointment."
```

**Check Memory (Transcript & Audio)**
Retrieve what happened during the call.
```bash
telecom agent memory CA12345...
# Output:
# 🧠 Agent Memory: "Yes, I can make it at 2 PM."
# 🎙️ Audio Link: https://api.twilio.com/...
```

**Telegram Integration**
If using the Telegram bot, you can also ask:
> "memory CA12345..."
> *Bot replies with the text and the playable MP3 audio.*
