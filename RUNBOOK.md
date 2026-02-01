# Telecom-as-Code: Go-Live Smoke Test Runbook

This document outlines the manual verification steps required to certify the platform for production traffic.

## 1. Environment Verification
**Pre-requisite:** `TELECOM_API_URL` is set to public URL (e.g. ngrok or prod domain).

```bash
# Verify API Health and DB Connection
curl -H "X-Workspace-Token: $TELECOM_API_TOKEN" $TELECOM_API_URL/v1/health
# Expected: { "status": "ok", "db": "up", "workspaceCount": 1 }
```

## 2. Agent Heartbeat
Verify the Agent Runtime logic.

```bash
# 1. Send Heartbeat
curl -X POST $TELECOM_API_URL/v1/agent/heartbeat \
  -H "X-Workspace-Token: $TELECOM_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "active", "label": "TestAgent"}'

# 2. Check Status
curl -H "X-Workspace-Token: $TELECOM_API_TOKEN" $TELECOM_API_URL/v1/agent/status
# Expected: { "online": true, "status": "active", ... }
```

## 3. Outbound Voice (The "Dial" Test)
1. Open the Web Console.
2. Run: `telecom call dial <your-cell-phone>`
3. **Verify:**
   - Your phone rings.
   - You answer and hear silence/TwiML default.
   - Dashboard shows call as "IN_PROGRESS".
   - Audit Log shows `call.dial` success.

## 4. Inbound Voice (The "Park" Test)
1. Call the Twilio Number from your cell phone.
2. **Verify:**
   - You hear "Welcome to the control plane. Please hold..."
   - You hear hold music.
   - Dashboard shows new "INBOUND" call with state "INITIATED" or "RINGING".

## 5. Merge Test (The "Control" Test)
1. Keep the Inbound call (Step 4) active (on hold).
2. Note its CallSid (from Dashboard or `telecom call list`).
3. Dial a second number (e.g., another mobile) via `telecom call dial`. Answer it.
4. Run: `telecom call merge <Inbound_Sid> <Outbound_Sid>`
5. **Verify:**
   - Both phones are connected in a conference.
   - Dashboard shows "Active Merges" with 2 participants.

## 6. Approvals & Policy
1. Run: `telecom call merge <Sid1> <Sid2>` (again, or new calls).
2. **Verify:** 
   - CLI/UI says "Approval Pending".
   - Call does NOT merge immediately.
3. Go to Approvals Tab.
4. Click "Approve".
5. **Verify:** Calls merge immediately after click.

## 7. Rollback Plan
If any step fails:
1. Log in to Twilio Console.
2. Remove the Webhook URL from the Phone Number configuration.
3. Rotate `TELECOM_API_TOKEN` in `.env`.
4. Restart the `apps/api` service.
