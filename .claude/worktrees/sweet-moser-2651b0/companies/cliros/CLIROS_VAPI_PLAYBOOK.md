# Cliros VAPI Cold-Call Playbook — GA Closing Attorneys

Adapted from the EstimateProof "James" voice-agent build (every pattern below
was tuned across ~10 live test calls). This is the **operational** guide for
running an AI voice agent that calls Georgia closing attorneys to drive Cliros
Founding-Attorney signups. Pair with `CLIROS_COMMS_MACHINE_PLAYBOOK.md`.

Cliros product, in one breath: a property address in → a complete title-search
report + draft Attorney Opinion Letter in minutes, $100 vs ~$300, attorney
keeps the judgment. The call's job is NOT to sell on the phone — it's to earn a
**yes to a follow-up email** with the Founding-Attorney signup link, and to
**capture + confirm the attorney's email**.

---

## 1. ARCHITECTURE (reused from EstimateProof, proven working)

```
prospects (cliros.prospects, 804 GA attorneys)
   ├─ have phone → VAPI call sheet  ──► VAPI assistant places call
   │                                       │ analysisPlan extracts EMAIL
   │                                       ▼
   │                              /api/vapi/call-webhook (x-vapi-secret)
   │                                       │ Resend
   │                                       ▼
   │                              Founding-Attorney signup link emailed
   └─ email only → Resend outreach (see comms playbook)
```

- **Assistant** (one, reused): Anthropic Haiku model + 11labs voice. Driven by a
  system prompt (the persona file) you push via an `--update-assistant` script.
- **Caller script**: reads the phone-lead CSV, places throttled outbound calls.
- **Webhook**: `POST /api/vapi/call-webhook` — on `end-of-call-report`, pulls the
  confirmed email from `analysis.structuredData`, sends the signup link via
  Resend. Auth via `x-vapi-secret` header (set `VAPI_WEBHOOK_SECRET` in Render).

---

## 2. PHONE NUMBER — the #1 gotcha (learn from our pain)

**Do NOT ship on a VAPI-provided free number.** It has a **daily outbound cap**
and fails calls open-ended (stuck "in-progress", $0, no connect) — we burned an
evening on this. **Import a Twilio number into VAPI** (VAPI dashboard → Phone
Numbers → Import from Twilio) before any real campaign. ~$1/mo, reliable
outbound, and it's also the path to SMS later.

---

## 3. THE PERSONA / SCRIPT (the hard-won part)

Store as a markdown file; push it as the assistant's `system` prompt. The
EstimateProof tuning that took ~10 calls to get right — inherit it:

**Voice:** warm, humble, peer-to-peer. A real person who thinks this helps, not
a slick closer. Never robotic, never pushy. Short turns — ONE idea or ONE
question per turn, then STOP and listen.

**Opener — greet first, WAIT for a hello before pitching:**
> firstMessage: "Hey, this is [name] over at Cliros — how's your day going?"
Then pause. (Do NOT machine-gun the pitch; humans greet and wait.)

**TELL before you ASK (the bug we hit):** if you ask "can I tell you why I'm
calling?" and they say yes, the NEXT turn must actually *tell* them — never fire
a question back. Lead with the BENEFIT, product noun second:
> "Quick version — we get closing attorneys a full title search and a draft
> opinion letter back in minutes instead of days, for about a third of what a
> title search runs you. Can I tell you how it works?"

**Then lead with a question** (let them name their pain):
> "When you're clearing title on a closing right now — what's the part that
> actually eats your time?"

**Empathy lines (use one, matched to their answer) — attorney-specific:**
- "I know a single closing means waiting on five different search vendors, and
  the file just sits while the clock runs on the closing date."
- "Every hour your paralegal spends pulling judgments and liens by hand is an
  hour not billed to a client."
- "Title insurance eats 95%+ overhead — your client's paying for risk that
  almost never pays out."

**Close — earn the email step by step (don't grab for it early):**
1. "Want me to send you the link so you can run one yourself and see?" → yes
2. "Great — and I can set you up as a founding attorney: twenty free report
   credits, no card. What's the best email for that?"
3. **Slow, chunked email read-back** (this is where people get garbled on a
   phone — go slow): "Let me read that back slow so I don't fat-finger it —
   [name]… at… [domain]… dot com — did I get that right?"
4. Warm goodbye, then **the call ends**: "Perfect, it's on its way from Cliros.
   Appreciate your time — go close some deals."

**Callback fallback:** "No problem — want me to just email you the link so it's
there when you've got a sec? What's the best email?" Then end warmly.

**Hard rules:**
- NEVER read internal data aloud (no "call summary", no "interest level", no
  field names). The agent is ONLY a person on a call. The webhook captures the
  email silently AFTER the call.
- No invented facts / legal guarantees about title or AOL coverage. If unsure,
  "the email has the details / happy to connect you with the founder."
- Drive to the self-serve signup link; never take payment or create an account
  on the call.

---

## 4. ASSISTANT SETTINGS (latency + safety, copy these)

- `maxTokens: ~120` — keeps replies short so the agent doesn't ramble.
- `startSpeakingPlan: { waitSeconds: 0.2, smartEndpointingPlan: { provider: 'livekit' } }`
  — snappy, natural turn-taking.
- `voice speed ~0.92` — slightly slower so the email read-back is clear.
- `endCallFunctionEnabled: true` + `endCallPhrases` (e.g. "go close some deals",
  "take care", "bye now") — so it hangs up after the goodbye instead of
  lingering and reading notes.
- `analysisPlan.structuredDataSchema`: extract **email only** (don't ask the
  model to narrate interest — that's what leaked "call summary" aloud for us).

---

## 5. THE WEBHOOK (Founding-Attorney follow-up)

`POST /api/vapi/call-webhook`:
1. Auth: require `x-vapi-secret` === `VAPI_WEBHOOK_SECRET` (set in Render).
2. Only act on `message.type === 'end-of-call-report'`.
3. Pull email from `analysis.structuredData.email` (fallback `customer.email`).
4. If a valid email → send the Founding-Attorney email via Resend with the
   signup link (the program is already defined in `FOUNDING_ATTORNEY_PROGRAM.md`
   — 20 free credits, no card). If no email → log and stop.
5. Never create the account on the attorney's behalf — self-serve link only.

---

## 6. RUNNING A BATCH

- Throttle: **3 calls per 15 min** (deliverability + you can monitor early ones).
- Maintain a **sent/called log** so re-runs never double-dial.
- **Test on yourself first** — place ONE call to your own number, verify the
  greeting + pause, the flow, and that the follow-up email actually lands,
  BEFORE dialing a real attorney.
- Phone-only prospects feed VAPI; email-having prospects go to the comms machine.

---

## 7. PRE-FLIGHT CHECKLIST

- [ ] Twilio number imported into VAPI (NOT the free number)
- [ ] `VAPI_WEBHOOK_SECRET` set in Render; webhook returns 401 on wrong secret
- [ ] Assistant `serverUrl` points at the live `/api/vapi/call-webhook`
- [ ] Persona pushed; `firstMessage` is greeting-only; maxTokens/voice/endCall set
- [ ] One test call to your own number → email follow-up received
- [ ] Called-log in place so re-runs never double-dial
- [ ] Resend domain (cliros.ai) verified; founding-attorney email template ready
