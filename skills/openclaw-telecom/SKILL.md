---
name: "telecom-operator"
description: "AI Agent skill for controlling Twilio voice, SMS, and conference infrastructure via CLI."
author: "kflohr"
version: "1.0.0"
fusion_model: "gpt-4-turbo"
capabilities:
  - voice_control
  - sms_messaging
  - human_approval
environment:
  required:
    - TELECOM_API_URL
    - TELECOM_API_TOKEN
---

# Telecom Operator Skill

This skill allows the agent to control real-world telecom infrastructure (Twilio) via the `telecom` CLI tool.
The agent acts as a Level 1 Network Operator.

## Environment Requirements
The environment must have the `telecom` binary in the PATH and the following environment variables set:
- `TELECOM_API_URL`: The URL of the Telecom-as-Code API (Default: https://telop.dev)
- `TELECOM_API_TOKEN`: Valid workspace token with `x-actor-source: cli` permissions.

## Capabilities

### 0. Initial Setup (Headless)
Configure Twilio credentials directly from the CLI/Agent (Authentication required).
```bash
telecom setup <AC_sid> <auth_token> <+1_number>
```


### 1. Status Check
Check the health of the system and view active calls/conferences.
```bash
telecom status
```

### 2. Voice Operations
**Dialing Out:**
Initiate a call to a customer or partner.
```bash
telecom call dial <e164_number>
# Example: telecom call dial +14155550100
```
*Returns JSON with `callSid`. Store this SID for merging.*

**Merging Calls (Conferencing):**
Connect two active calls together. Requires two CallSIDs.
```bash
telecom call merge <callSidA> <callSidB>
```
*Note: This operation usually requires approval if policy is strict.*

### 3. Messaging
Send SMS notifications or alerts.
```bash
telecom sms send <e164_number> "<message_body>"
```

### 4. Approvals
If a previous action returned a pending approval status, or if you are auditing the queue.
```bash
# Approve a pending action
telecom approve <approval_id>

# Deny a pending action
telecom deny <approval_id> "Reason for denial"
```

## Best Practices for Agents
1. **Always check status first** to see if the system is healthy.
2. **Store CallSIDs** in your context/memory. You cannot merge calls without them.
3. **Handle Errors Gracefully**: The CLI returns JSON errors. If `code: AUTH_MISSING`, alert the user.
4. **Do not spam**: SMS and Calls cost money. Verify intent before executing.
5. **JSON Output**: The CLI outputs JSON by default. Parse this to confirm success (`ok: true` or `success: true`).
