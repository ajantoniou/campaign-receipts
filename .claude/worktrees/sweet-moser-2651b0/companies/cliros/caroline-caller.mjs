#!/usr/bin/env node
/**
 * Cliros VAPI cold-caller — "Caroline" (GA closing attorneys).
 *
 * Mirrors the proven EstimateProof "James" caller (dealer-caller.mjs). Caroline
 * drives every call to a YES for a follow-up email with the Founding-Attorney
 * self-serve signup link; we NEVER create an account on the call.
 *
 * Modes:
 *   --create-assistant   Create the Caroline assistant from CLIROS_CAROLINE_PERSONA.md
 *                        (one-time). Prints the new assistant id to save in .env
 *                        as CLIROS_VAPI_ASSISTANT_ID.
 *   --update-assistant   Re-push the persona / firstMessage / analysis / webhook
 *                        to the existing CLIROS_VAPI_ASSISTANT_ID.
 *   --call               Place calls to lists/attorneys-phone.csv. DRY RUN unless
 *                        --live. --limit=N caps calls. --gap=SEC spaces them.
 *
 * Env (cliros .env or AgentCompanies root .env / EP .env — VAPI account is shared):
 *   VAPI_PRIVATE_KEY              (required)
 *   CLIROS_VAPI_ASSISTANT_ID      (set after --create-assistant)
 *   CLIROS_VAPI_NUMBER_ID         (the imported 770 number; default pinned below)
 *   CLIROS_SITE_URL               (default https://cliros.ai)
 *   CLIROS_VAPI_WEBHOOK_SECRET    (matches the Cliros call-webhook secret)
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as dotenvConfig } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
// VAPI keys are shared across companies — load cliros, AgentCompanies root, and EP.
dotenvConfig({ path: resolve(__dirname, '.env') });
dotenvConfig({ path: resolve(__dirname, '../../.env') });
dotenvConfig({ path: resolve(__dirname, '../../../EstimateProof/.env') });

const KEY = process.env.VAPI_PRIVATE_KEY;
const ASSISTANT_ID = process.env.CLIROS_VAPI_ASSISTANT_ID || '';
const SITE_URL = process.env.CLIROS_SITE_URL || 'https://cliros.ai';
const WEBHOOK_SECRET = process.env.CLIROS_VAPI_WEBHOOK_SECRET || '';
const PERSONA_PATH = resolve(__dirname, 'CLIROS_CAROLINE_PERSONA.md');
const PHONE_LIST = resolve(__dirname, 'lists/attorneys-phone.csv');

// The imported Cliros 770 number (NOT the free VAPI number). Verified active.
const NUMBER_ID = process.env.CLIROS_VAPI_NUMBER_ID || 'd8ab4686-0ebd-454c-b947-643ee1c74753';

// Warm female 11labs voice (Rachel — calm, gracious). Slightly slow for clear
// email read-backs.
const VOICE = { provider: '11labs', voiceId: '21m00Tcm4TlvDq8ikWAM', model: 'eleven_turbo_v2_5', speed: 0.92 };

const FIRST_MESSAGE =
  "Hi there, this is Caroline calling from Cliros — how's your day going so far?";

const LIVE = process.argv.includes('--live');
const LIMIT = Number((process.argv.find((a) => a.startsWith('--limit=')) || '--limit=5').split('=')[1]);
const GAP_SEC = Number((process.argv.find((a) => a.startsWith('--gap=')) || '--gap=90').split('=')[1]);

const api = (path, opts = {}) =>
  fetch(`https://api.vapi.ai${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });

function normalizePhone(raw) {
  const d = String(raw).replace(/[^\d]/g, '');
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith('1')) return `+${d}`;
  return null;
}

function assistantBody() {
  const persona = readFileSync(PERSONA_PATH, 'utf8');
  return {
    name: 'Caroline from Cliros',
    firstMessage: FIRST_MESSAGE,
    model: {
      provider: 'anthropic',
      model: 'claude-haiku-4-5-20251001',
      maxTokens: 120, // short turns — one idea per turn, no rambling
      messages: [{ role: 'system', content: persona }],
    },
    startSpeakingPlan: { waitSeconds: 0.2, smartEndpointingPlan: { provider: 'livekit' } },
    voice: VOICE,
    // Modern Vapi shape: server.{url,secret}. The secret is sent as the
    // x-vapi-secret header on the webhook so our route can verify it.
    server: {
      url: `${SITE_URL}/api/vapi/call-webhook`,
      ...(WEBHOOK_SECRET ? { secret: WEBHOOK_SECRET } : {}),
    },
    endCallFunctionEnabled: true,
    endCallPhrases: ['have a good one', 'bye now', 'take care', 'goodbye'],
    // Capture the FIRM EMAIL (where the report is saved + future billing) and ONE
    // PROPERTY ADDRESS the attorney wants run free. No interest tag / summary
    // (that's what leaked "call summary" aloud on the EP build).
    analysisPlan: {
      structuredDataPrompt:
        'From the call, extract exactly what the attorney CONFIRMED, into these fields. ' +
        '"firm_email": the email address they confirmed for their firm (where the report is saved). ' +
        '"property_address": the single Georgia property address they gave to have a title report run ' +
        'free — as complete as they said it (street, city, state, zip if given). ' +
        'Leave any field empty if it was not clearly confirmed. Do not invent or complete an address.',
      structuredDataSchema: {
        type: 'object',
        properties: {
          firm_email: { type: 'string', description: 'Confirmed firm email, or empty' },
          property_address: { type: 'string', description: 'One GA property address to run free, or empty' },
          email: { type: 'string', description: 'Alias of firm_email for back-compat' },
        },
      },
    },
  };
}

async function createAssistant() {
  const r = await api('/assistant', { method: 'POST', body: JSON.stringify(assistantBody()) });
  const data = await r.json();
  if (!r.ok) throw new Error(`create failed ${r.status}: ${JSON.stringify(data)}`);
  console.log('✓ Caroline assistant created.');
  console.log('  id:', data.id);
  console.log('  → save to cliros .env as:  CLIROS_VAPI_ASSISTANT_ID=' + data.id);
  console.log('  serverUrl:', data.serverUrl);
}

async function updateAssistant() {
  if (!ASSISTANT_ID) throw new Error('CLIROS_VAPI_ASSISTANT_ID not set — run --create-assistant first');
  const r = await api(`/assistant/${ASSISTANT_ID}`, { method: 'PATCH', body: JSON.stringify(assistantBody()) });
  const data = await r.json();
  if (!r.ok) throw new Error(`update failed ${r.status}: ${JSON.stringify(data)}`);
  console.log('✓ Caroline assistant updated.', data.id);
}

async function verifyNumber() {
  const r = await api(`/phone-number/${NUMBER_ID}`);
  const n = await r.json();
  if (!n?.id) throw new Error(`Cliros VAPI number ${NUMBER_ID} not found`);
  if (n.status && n.status !== 'active') throw new Error(`Cliros VAPI number not active: ${n.status}`);
  return n.id;
}

async function placeCall(numberId, atty) {
  const phone = normalizePhone(atty.phone);
  if (!phone) return { skip: 'bad_phone', name: atty.name };
  if (!LIVE) return { dry: true, to: phone, name: atty.name };
  const r = await api('/call', {
    method: 'POST',
    body: JSON.stringify({ assistantId: ASSISTANT_ID, phoneNumberId: numberId, customer: { number: phone, name: atty.name } }),
  });
  const data = await r.json();
  if (!r.ok) return { error: `${r.status}: ${JSON.stringify(data).slice(0, 200)}`, to: phone };
  return { id: data.id, status: data.status, to: phone, name: atty.name };
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function callMode() {
  if (!ASSISTANT_ID) throw new Error('CLIROS_VAPI_ASSISTANT_ID not set — run --create-assistant first');
  const { parse } = await import('csv-parse/sync');
  const rows = parse(readFileSync(PHONE_LIST), { columns: true, skip_empty_lines: true });
  const queue = rows.filter((r) => r.phone).slice(0, LIMIT);
  console.log(`${LIVE ? 'LIVE CALLING' : 'DRY RUN'} — ${queue.length} attorneys, ${GAP_SEC}s apart`);
  const numberId = LIVE ? await verifyNumber() : 'dry';
  const results = [];
  for (let i = 0; i < queue.length; i++) {
    const res = await placeCall(numberId, queue[i]);
    results.push(res);
    console.log(`  ${i + 1}. ${queue[i].name} -> ${JSON.stringify(res)}`);
    if (LIVE && i < queue.length - 1) await sleep(GAP_SEC * 1000);
  }
  console.log('\nSUMMARY:', JSON.stringify({
    placed: results.filter((r) => r.id).length,
    errors: results.filter((r) => r.error).length,
    skipped: results.filter((r) => r.skip).length,
  }));
}

async function main() {
  if (!KEY) { console.error('VAPI_PRIVATE_KEY missing'); process.exit(1); }
  if (process.argv.includes('--create-assistant')) { await createAssistant(); return; }
  if (process.argv.includes('--update-assistant')) { await updateAssistant(); return; }
  if (process.argv.includes('--call')) { await callMode(); return; }
  console.log('Usage: --create-assistant | --update-assistant | --call [--live] [--limit=N] [--gap=SEC]');
}
main().catch((e) => { console.error(e); process.exit(1); });
