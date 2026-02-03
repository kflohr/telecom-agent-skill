# 🤖 Telecom Agent Skill
> **Give your MoltBot/OpenClaw the power of Voice & SMS.**

This is the official skill package for connecting Autonomous Agents to the [Telop.dev](https://telop.dev) Cloud.

## 📦 Install
```bash
/install https://github.com/YOUR_USERNAME/telecom-agent-skill
```

## 🚀 Quick Start

### 1. Configure
Run the onboarding wizard to link your Twilio account to the cloud.
```bash
telecom onboard
```

### 2. Autonomous Agent Usage
Your bot can now use these commands:

*   **🗣️ Speak & Listen**:
    ```bash
    telecom agent call <number> --intro "Hello, I am scheduling an appointment."
    ```
    *The bot calls the number, reads the intro text (TTS), and records the response.*

*   **🧠 Memory (Transcription)**:
    ```bash
    telecom agent memory <CallSid>
    ```
    *The bot retrieves the text transcript of the call to understand what the user said.*

## 🛠️ Manual Usage (CLI)
You can also use the CLI manually for debugging:
```bash
telecom call dial +15550100
telecom sms send +15550100 "Hello world"
```

## 📚 Documentation
*   **Web Dashboard**: [https://telop.dev](https://telop.dev)
*   **Full Docs**: [https://telop.dev/docs](https://telop.dev/docs)

## 🛡️ License
MIT License. Open Source.
