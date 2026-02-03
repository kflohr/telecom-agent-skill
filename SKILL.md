---
name: Telecom Control Plane
description: A production-grade Control Plane for Twilio. Manage voice, SMS, and recording workflows with policy enforcement and compliance built-in.
version: 1.1.0
---

# 📡 Telecom Control Plane

**Turn your Twilio account into a managed, compliant, and intelligent communication platform.**

This skill deploys a full-stack **Operator Console** that sits between your code and the telephony provider, giving you superpowers like Global Policy Enforcement, Auto-Transcription, and a Unified Audit Log.

## ✨ Features

### 🛡️ Policy Engine
Stop unexpected bills before they happen.
*   **Concurrency Limits:** Hard-cap simultaneous calls (e.g., max 5 active lines).
*   **Approval Workflows:** Require manual human approval for sensitive actions (e.g., calling international numbers).
*   **Auto-Review:** Define rules to auto-approve safe traffic.

### 🧠 Voice Intelligence
*   **Automatic Recording:** Flip a switch to record all calls for compliance.
*   **Transcription:** Auto-transcribe voice to text and save it to your database.
*   **Persistent Memory:** Every call, message, and decision is logged forever.

### 🚀 Developer Experience
*   **CLI First:** `telecom` command for instant control.
*   **Secure:** Token-based authentication and secure deployment.
*   **Self-Healing:** Auto-restarting API services.

## 🛠️ Quick Start

1.  **Deploy Infrastructure**
    Run the included script to provision your API and Database on any Ubuntu server (or AWS EC2).
    \`\`\`bash
    ./deploy_api.sh
    \`\`\`

2.  **Connect Provider**
    Link your Twilio account securely.
    \`\`\`bash
    telecom onboard
    \`\`\`

3.  **Take Control**
    Start managing your telecom operations!
    ```bash
    # Set a safety limit
    telecom policy set --concurrency 10
    
    # Make a smart call
    telecom call dial +14155550100 --record --transcribe
    ```

4.  **🤖 Autonomous Agents**
    Enable your AI bots to act in the real world.
    ```bash
    # Cloud Agent introduces itself and records the call
    telecom agent call +15550199 --intro "Hello, I am scheduling an appointment."

    # Retrieve the conversation transcript ("memory")
    telecom agent memory <CallSid>
    ```
