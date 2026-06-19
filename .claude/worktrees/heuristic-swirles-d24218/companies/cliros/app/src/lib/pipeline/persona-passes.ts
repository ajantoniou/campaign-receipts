/* ─── Persona passes ───
   Sequential specialists that run between panel_review and drafting. Each
   pass takes (a) the previous artifact (b) the full report payload (c) any
   QC fixes from the previous failed attempt — and emits a structured edit
   for one section of the report.

   Stages, in order:
     chain_analysis  → Caleb Onuoha   (chain-of-title-analyst.md)
     lien_analysis   → Reena Patel    (lien-pairing-analyst.md)
     defect_review   → Maggie Lindholm(title-defect-specialist.md)
     aol_lock        → Tom Calloway   (aol-drafter.md)

   We use Anthropic tool-use with a stage-specific schema. Persona text is
   the system prompt. Output is persisted in cliros.persona_passes and the
   relevant slice of search_reports is updated by applyPassOutput().
*/

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";

const PERSONA_MODEL = process.env.ANTHROPIC_PERSONA_MODEL || "claude-opus-4-7";

// Opus 4.7 pricing (May 2026): $15/M input, $75/M output.
const OPUS_PRICE_PER_M = { input: 15.0, output: 75.0 };

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PERSONAS_DIR = path.resolve(process.cwd(), "..", "personas");

export type PersonaStage =
  | "chain_analysis"
  | "lien_analysis"
  | "defect_review"
  | "aol_lock";

export interface PersonaPassConfig {
  stage: PersonaStage;
  /** step_qc rubric step id (without the persona suffix) */
  qcStep: string;
  personaFile: string;
  shortName: string;
}

export const PERSONA_PASSES: Record<PersonaStage, PersonaPassConfig> = {
  chain_analysis: {
    stage: "chain_analysis",
    qcStep: "chain-analyst",
    personaFile: "chain-of-title-analyst.md",
    shortName: "Caleb Onuoha (chain-of-title analyst)",
  },
  lien_analysis: {
    stage: "lien_analysis",
    qcStep: "lien-analyst",
    personaFile: "lien-pairing-analyst.md",
    shortName: "Reena Patel (lien-pairing analyst)",
  },
  defect_review: {
    stage: "defect_review",
    qcStep: "defect-specialist",
    personaFile: "title-defect-specialist.md",
    shortName: "Margaret Lindholm (title defect specialist)",
  },
  aol_lock: {
    stage: "aol_lock",
    qcStep: "aol-quality",
    personaFile: "aol-drafter.md",
    shortName: "Tom Calloway (AOL drafter)",
  },
};

let _personaTextCache: Map<string, string> | null = null;
function loadPersonaText(file: string): string {
  if (!_personaTextCache) _personaTextCache = new Map();
  if (_personaTextCache.has(file)) return _personaTextCache.get(file)!;
  const fullPath = path.join(PERSONAS_DIR, file);
  const text = fs.readFileSync(fullPath, "utf-8");
  _personaTextCache.set(file, text);
  return text;
}

/* ─── Tool-use schemas per stage ─── */

const CHAIN_TOOL = {
  name: "emit_chain_revision",
  description: "Emit the cleaned chain-of-title and the real (non-Unknown) chain breaks.",
  input_schema: {
    type: "object" as const,
    properties: {
      chain_of_title: {
        type: "array",
        description:
          "Cleaned chain rows, earliest first. Each row must have recordedDate, grantor, grantee, bookPage, and a type. Add 'notes' for rows that needed annotation.",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            type: { type: "string" },
            grantor: { type: "string" },
            grantee: { type: "string" },
            recordedDate: { type: "string" },
            bookPage: { type: "string" },
            instrumentNumber: { type: "string" },
            consideration: { type: "number" },
            notes: { type: "string" },
            pull_image_required: { type: "boolean" },
          },
          required: ["grantor", "grantee", "recordedDate", "type"],
        },
      },
      chain_breaks: {
        type: "array",
        description:
          "Real chain breaks only. Pairs where either party is 'Unknown' MUST be excluded.",
        items: { type: "string" },
      },
      reasoning_one_line: { type: "string" },
    },
    required: ["chain_of_title", "chain_breaks", "reasoning_one_line"],
  },
};

const LIEN_TOOL = {
  name: "emit_lien_revision",
  description: "Emit the cleaned liens array with SD/cancellation pairing and aging flags.",
  input_schema: {
    type: "object" as const,
    properties: {
      liens: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            type: {
              type: "string",
              description: "mortgage|judgment|tax|mechanics|hoa|irs|state|ucc|other",
            },
            status: {
              type: "string",
              description: "active|released|partial|unknown",
            },
            creditor: { type: "string" },
            amount: { type: "number" },
            recordedDate: { type: "string" },
            releasedDate: { type: "string" },
            bookPage: { type: "string" },
            instrumentNumber: { type: "string" },
            referencedBookPage: { type: "string" },
            notes: { type: "string" },
            pull_image_required: { type: "boolean" },
            stale_flag: {
              type: "string",
              description:
                "If aged-out per OCGA — one of: 'ancient_sd' (>20yr SD), 'dormant_judgment' (>7yr), 'expired_fed_tax' (>10yr), 'expired_mechanics' (>1yr).",
            },
          },
          required: ["type", "status"],
        },
      },
      defect_flags_for_specialist: {
        type: "array",
        description:
          "Notes for the defect specialist about stale-but-active liens that need her judgment.",
        items: { type: "string" },
      },
      reasoning_one_line: { type: "string" },
    },
    required: ["liens", "defect_flags_for_specialist", "reasoning_one_line"],
  },
};

const DEFECT_TOOL = {
  name: "emit_defect_revision",
  description:
    "Emit the curated defects array. Promote real clouds, demote index-gap artifacts, cite OCGA.",
  input_schema: {
    type: "object" as const,
    properties: {
      defects: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            type: { type: "string" },
            title: { type: "string" },
            severity: {
              type: "string",
              description: "critical|major|minor|info",
            },
            description: {
              type: "string",
              description: "Marketability impact in one sentence + OCGA or book-page citation.",
            },
            recommendation: {
              type: "string",
              description:
                "Actionable next step naming the responsible party. STATUTE PRECISION (malpractice-grade): the closing-attorney PAYOFF AFFIDAVIT recordable when a holder fails to cancel within 60 days of payoff is OCGA §44-14-3 — NOT §44-14-67. §44-14-67 is RECONVEYANCE (a separate mechanism). Never label the payoff affidavit as §44-14-67. Example: 'Closing attorney to obtain payoff and record cancellation under OCGA §44-14-3; if the holder fails to cancel within 60 days of payoff, record the closing-attorney payoff affidavit under OCGA §44-14-3 — or obtain a reconveyance under OCGA §44-14-67.'",
            },
            statute_citation: { type: "string" },
            book_page_citation: { type: "string" },
          },
          required: ["title", "severity", "description", "recommendation"],
        },
      },
      demoted: {
        type: "array",
        description: "Defects removed from the previous list, with a one-line reason.",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            reason: { type: "string" },
          },
          required: ["title", "reason"],
        },
      },
      risk_score: {
        type: "integer",
        minimum: 0,
        maximum: 100,
        description:
          "Specialist-calibrated risk: 0-30 clean, 31-60 minor exceptions, 61-100 attention required.",
      },
      reasoning_one_line: { type: "string" },
    },
    required: ["defects", "demoted", "risk_score", "reasoning_one_line"],
  },
};

const AOL_TOOL = {
  name: "emit_aol_draft",
  description:
    "Emit the structured recitals and opinion language for the AOL. " +
    "The letter body is assembled DETERMINISTICALLY from the structured " +
    "chain_of_title and liens arrays you were given — you select and annotate " +
    "them here, you do NOT free-write the recitals.",
  input_schema: {
    type: "object" as const,
    properties: {
      vesting_owner: {
        type: "string",
        description:
          "Current record owner per the chain — must be the grantee of a real " +
          "chain_of_title entry. Leave empty if the chain is empty.",
      },
      chain_citations: {
        type: "array",
        description:
          "One entry per relevant chain_of_title row you are reciting. " +
          "The recordable reference is Book/Page; each bookPage MUST be copied " +
          "verbatim from a real chain_of_title entry — do NOT introduce any book/page " +
          "that is not present in the structured chain data.",
        items: {
          type: "object",
          properties: {
            bookPage: {
              type: "string",
              description: "Book/Page exactly as it appears on the chain entry — the primary recordable reference.",
            },
            instrumentNumber: {
              type: "string",
              description:
                "Instrument numbers are frequently ABSENT from GSCCCA name-index " +
                "records; in Georgia name-index practice the recordable reference is " +
                "Book/Page. Populate this ONLY if the source chain_of_title entry has a " +
                "non-null instrumentNumber, copied verbatim. If the source entry's " +
                "instrumentNumber is null or absent, OMIT this field entirely and cite " +
                "Book/Page alone. NEVER substitute the internal 'id' field (e.g. " +
                "'deed-24') — that is an internal array key, not a recordable reference, " +
                "and citing it is malpractice-grade fabrication.",
            },
            role: {
              type: "string",
              description:
                "Why this conveyance matters (e.g. 'current vesting deed', 'root of title').",
            },
          },
          required: ["bookPage", "role"],
        },
      },
      lien_citations: {
        type: "array",
        description:
          "One entry per lien you are reciting as an exception. The recordable " +
          "reference is Book/Page; each bookPage MUST be copied verbatim from a real " +
          "liens entry — do NOT introduce any book/page not present in the structured " +
          "liens data.",
        items: {
          type: "object",
          properties: {
            bookPage: {
              type: "string",
              description: "Book/Page exactly as it appears on the lien entry — the primary recordable reference.",
            },
            instrumentNumber: {
              type: "string",
              description:
                "Instrument numbers are frequently ABSENT from GSCCCA name-index " +
                "records; in Georgia name-index practice the recordable reference is " +
                "Book/Page. Populate this ONLY if the source liens entry has a non-null " +
                "instrumentNumber, copied verbatim. If the source entry's " +
                "instrumentNumber is null or absent, OMIT this field entirely and cite " +
                "Book/Page alone. NEVER substitute the internal 'id' field (e.g. " +
                "'sd-lien-2') — that is an internal array key, not a recordable " +
                "reference, and citing it is malpractice-grade fabrication.",
            },
            type: {
              type: "string",
              description: "Lien type (mortgage, judgment, tax, etc.) per the liens entry.",
            },
          },
          required: ["type"],
        },
      },
      opinion_language: {
        type: "string",
        description:
          "ONLY the attorney opinion / qualification prose: the marketability " +
          "opinion, assumptions, and exceptions narrative. Do NOT restate book/page " +
          "or instrument recitals here — those come from chain_citations / " +
          "lien_citations. This is slotted into the OPINION section of the assembled " +
          "letter, directly below a MARKETABILITY ASSESSMENT section. " +
          "MARKETABILITY FORM (Hard Stop): when any exception, critical/major defect, " +
          "or unresolved index gap exists, the opinion MUST take the qualified form — " +
          "'subject to the curative actions enumerated in Schedule B, title is " +
          "reasonably expected to be marketable upon completion of those actions' — " +
          "and MUST NOT state a flat / categorical 'not marketable' or 'unmarketable'. " +
          "Only a clean chain with zero exceptions may carry an unqualified 'marketable'. " +
          "SUPPORT RULE: every conclusion (ownership, lien priority, marketability) must " +
          "be traceable to a chain_of_title or liens entry you were given. Do NOT assert " +
          "a CHAIN BREAK unless chain_of_title.breaks actually contains one. A GSCCCA " +
          "name-index gap or an 'Unknown' grantor/grantee row is a RECONCILIATION TASK " +
          "(pull deed images), NOT a proven chain break — describe it as such. Before " +
          "flagging an 'Unknown'-party deed as an unresolved gap requiring a quitclaim, " +
          "check whether a later quitclaim in the chain already cures it; if so, note the " +
          "curing instrument, if not, say why it does not. Do NOT contradict the " +
          "MARKETABILITY ASSESSMENT hedge above the opinion.",
      },
      effective_date: { type: "string" },
      opinion_qualified: {
        type: "boolean",
        description:
          "True if a critical defect forced the opinion paragraph to be qualified (not unqualified 'marketable').",
      },
      reasoning_one_line: { type: "string" },
    },
    required: [
      "vesting_owner",
      "chain_citations",
      "lien_citations",
      "opinion_language",
      "effective_date",
      "opinion_qualified",
      "reasoning_one_line",
    ],
  },
};

interface AnthropicTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

const STAGE_TOOLS: Record<PersonaStage, { name: string; tool: AnthropicTool }> = {
  chain_analysis: { name: CHAIN_TOOL.name, tool: CHAIN_TOOL as AnthropicTool },
  lien_analysis: { name: LIEN_TOOL.name, tool: LIEN_TOOL as AnthropicTool },
  defect_review: { name: DEFECT_TOOL.name, tool: DEFECT_TOOL as AnthropicTool },
  aol_lock: { name: AOL_TOOL.name, tool: AOL_TOOL as AnthropicTool },
};

/* ─── Public types ─── */

export interface PersonaPassRunInput {
  stage: PersonaStage;
  reportId: string;
  /** Full serialized report context (chain, liens, defects, parcel, etc.) */
  reportPayload: string;
  /** Stage-specific previous artifact (string/JSON) */
  prevArtifact: string;
  /** Fix bullets emitted by the previous failed step_qc attempt, if any */
  priorFixes?: string[];
}

export interface PersonaPassOutput {
  stage: PersonaStage;
  /** The structured tool-use input, as the model emitted it */
  payload: Record<string, unknown>;
  costCents: number;
  costUsd: number;
  promptTokens: number;
  completionTokens: number;
  model: string;
}

/* ─── Pass runner ─── */

export async function runPersonaPass(input: PersonaPassRunInput): Promise<PersonaPassOutput> {
  const cfg = PERSONA_PASSES[input.stage];
  if (!cfg) throw new Error(`Unknown persona stage: ${input.stage}`);

  const personaText = loadPersonaText(cfg.personaFile);
  const stageTool = STAGE_TOOLS[input.stage];

  const fixesBlock =
    input.priorFixes && input.priorFixes.length > 0
      ? `\n\n## Prior QC failures to address this attempt:\n${input.priorFixes
          .map((f) => `- ${f}`)
          .join("\n")}\n\nFix these specifically in your revision.`
      : "";

  const aolBlock =
    input.stage === "aol_lock"
      ? "\n\n## AOL recital discipline (malpractice-grade):\n" +
        "The AOL letter body is assembled DETERMINISTICALLY from the structured " +
        "chain_of_title and liens arrays in the report context — NOT from any prose " +
        "you write. Your job is to SELECT and ANNOTATE from that structured data:\n" +
        "- vesting_owner MUST be the grantee of a real chain_of_title entry.\n" +
        "- bookPage is the PRIMARY recordable reference. Every bookPage in " +
        "chain_citations MUST be copied verbatim from a real chain_of_title entry, and " +
        "every bookPage in lien_citations from a real liens entry.\n" +
        "- GSCCCA name-index records frequently carry NO instrument number. Include " +
        "instrumentNumber ONLY when the source chain/lien entry actually has a non-null " +
        "instrumentNumber, copied verbatim. If it is null or absent, OMIT the field and " +
        "cite Book/Page alone — that is complete and correct.\n" +
        "- NEVER cite the synthetic internal 'id' field (e.g. 'deed-24', 'sd-lien-2'). " +
        "It is an internal array key, NOT a recordable reference; citing it is " +
        "malpractice-grade fabrication.\n" +
        "- You may NOT introduce any book/page that is not present in the structured " +
        "data. Inventing a citation is a fail-and-retry.\n" +
        "- opinion_language is ONLY the marketability opinion / qualification prose. " +
        "Put NO book/page or instrument recitals there.\n\n" +
        "## Opinion-paragraph discipline (your Hard Stops, malpractice-grade):\n" +
        "- QUALIFIED FORM IS MANDATORY when ANY exception, critical/major defect, or " +
        "unresolved index gap exists. Write: 'Subject to the curative actions enumerated " +
        "in Schedule B, title is reasonably expected to be marketable upon completion of " +
        "those actions.' NEVER write a flat 'title is NOT marketable' / 'unmarketable' — " +
        "that is a Hard Stop violation. Set opinion_qualified=true in that case.\n" +
        "- Only an unqualified 'marketable' is permitted, and ONLY when there are zero " +
        "exceptions and chain_of_title.breaks is empty. Then set opinion_qualified=false.\n" +
        "- DO NOT assert a 'chain break' unless chain_of_title.breaks actually lists one. " +
        "A GSCCCA name-index gap, an orphan cancellation, or an 'Unknown' grantor/grantee " +
        "row is a RECONCILIATION TASK (pull deed images / rebook the index), NOT a proven " +
        "chain break. Describe such items as index gaps requiring confirmation, never as a " +
        "break that renders title unmarketable.\n" +
        "- Before treating an 'Unknown'-party deed as an open gap requiring a quitclaim, " +
        "check the chain for a LATER quitclaim that may already cure it. If a curing " +
        "quitclaim exists, note it against the gap; if it does not cure, state why.\n" +
        "- The opinion MUST NOT contradict the deterministic MARKETABILITY ASSESSMENT " +
        "section that is rendered immediately above your opinion in the letter. That " +
        "assessment hedges ('Curative work likely before closing', 'Index alone is not a " +
        "title opinion'). Your opinion MUST be CONSISTENT with that hedge and MUST NOT " +
        "characterize the assessment as anything stronger than 'curative work likely' — " +
        "do not paraphrase it as 'significant concerns', 'would prevent closing', or " +
        "'fundamental defects'. Open the opinion by expressly aligning with it — e.g. " +
        "'Consistent with the marketability assessment above (curative work likely before " +
        "closing), and subject to the curative actions enumerated in Schedule B, title is " +
        "reasonably expected to be marketable upon completion of those actions.' " +
        "Do NOT write any sentence that flatly declares title unmarketable, that title " +
        "'cannot be conveyed', or that the opinion is withheld/deferred — the qualified " +
        "'reasonably expected to be marketable upon completion' is the ONLY permitted " +
        "conclusion when curative items exist.\n" +
        "- When you recite a chain break, lien, or defect in a qualification, label its " +
        "severity EXACTLY as the upstream defect/chain data labels it (do not upgrade an " +
        "index gap to a critical break, and do not downgrade a critical chain break that " +
        "chain_of_title.breaks actually contains). Cite the curative action and the OCGA " +
        "section, then stop — do not editorialize about whether title 'would prevent " +
        "closing.'\n" +
        "- VESTING IS ALSO QUALIFIED when a critical chain break exists. Do NOT flatly " +
        "assert that record title 'appears vested' or 'is vested as stated'; a critical " +
        "break in chain_of_title.breaks means the vesting recitation is provisional. Phrase " +
        "it as: 'Record title is shown by the indexed chain as vested in [owner], subject to " +
        "confirmation of the curative items below.' Tie BOTH vesting and marketability to " +
        "completion of the enumerated curative actions — never present either as established " +
        "while a critical break is outstanding.\n" +
        "- KEEP THE OPINION TIGHT. The opinion paragraph should be one short consistency " +
        "sentence, a compact numbered list of qualifications (one short clause + OCGA cite + " +
        "cure path each), and the single closing 'subject to the curative actions enumerated " +
        "in Schedule B, title is reasonably expected to be marketable upon completion' " +
        "sentence. Do not restate the full B7-2-06 boilerplate, exclusions, or signature " +
        "matter — the deterministic template supplies those.\n" +
        "- STATUTE PRECISION in your qualifications (malpractice-grade): the closing-attorney " +
        "PAYOFF AFFIDAVIT recordable when a holder fails to cancel a paid security deed within " +
        "60 days of payoff is OCGA §44-14-3 — NEVER §44-14-67. §44-14-3 = cancellation (incl. " +
        "that affidavit); §44-14-67 = reconveyance (a separate cure). Write 'record a payoff " +
        "affidavit under OCGA §44-14-3' and, if offering reconveyance, 'obtain a reconveyance " +
        "under OCGA §44-14-67' — NEVER 'payoff affidavit under §44-14-67'. §44-14-80 is " +
        "reversion keyed to stated MATURITY, not deed age, not a presumption of payment.\n"
      : "";

  const defectBlock =
    input.stage === "defect_review"
      ? "\n\n## Statute discipline (malpractice-grade — overrides the prior artifact):\n" +
        "The prior artifact may contain statute characterizations that are WRONG. Do NOT " +
        "copy them forward. Two specific corrections you MUST apply when describing a " +
        "defect or its cure:\n" +
        "- OCGA §44-2-20 (recorded affidavit / affidavit of possession) gives RECORD " +
        "NOTICE of recited facts only. It is NOT a conveyance and does NOT cure a chain " +
        "break or any title defect. NEVER offer it as a standalone cure or as part of a " +
        "cure path. The cure for a missing-link chain break is a corrective/quitclaim " +
        "conveyance or a quiet-title action under OCGA §23-3-60 et seq.\n" +
        "- OCGA §44-14-80 is a REVERSION statute: title reverts to the grantor 7 years " +
        "after the security deed debt's stated MATURITY (20 years if the note is " +
        "perpetual/indefinite; 7 years from recording if undated). It is keyed to " +
        "MATURITY, not to recording date or deed age, and it is NOT a 'presumption of " +
        "payment.' Maturity is unknown until the recorded image is pulled — so the " +
        "reversion is a maturity-confirmed-on-image caveat, never an automatic clear.\n" +
        "- OCGA §44-14-67 (reconveyance) has NO statutory dollar cap; do not invent one.\n" +
        "- PAYOFF-AFFIDAVIT STATUTE: the closing-attorney payoff affidavit recordable when " +
        "a holder fails to CANCEL a paid security deed within 60 days of payoff is OCGA " +
        "§44-14-3 — NOT §44-14-67. §44-14-3 = cancellation (incl. that affidavit); " +
        "§44-14-67 = reconveyance. NEVER write 'payoff affidavit §44-14-67' or 'affidavit " +
        "of payment §44-14-67'. Cancellation/payoff-affidavit cures cite §44-14-3; only a " +
        "reconveyance cure cites §44-14-67.\n"
      : "";

  const systemPrompt =
    personaText +
    "\n\n---\n\nYou are running as a step in the Cliros title-search pipeline. " +
    `Your job: produce the structured revision via the ${stageTool.name} tool — and ONLY that. ` +
    "Do not write prose; emit the tool call. " +
    "Stay strictly within the rubric described in your persona file. " +
    "Trust the chain/lien data already produced upstream; your job is to clean and annotate, not invent." +
    aolBlock +
    defectBlock +
    fixesBlock;

  const userPrompt =
    `## Previous artifact for ${input.stage}:\n\n${input.prevArtifact.slice(0, 24_000)}\n\n` +
    `## Full report context (chain + liens + defects + parcel):\n\n${input.reportPayload.slice(0, 24_000)}\n\n` +
    `Emit your revision via the ${stageTool.name} tool now.`;

  const resp = await client.messages.create({
    model: PERSONA_MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    tools: [stageTool.tool] as unknown as Anthropic.Messages.Tool[],
    tool_choice: { type: "tool", name: stageTool.name },
    messages: [{ role: "user", content: userPrompt }],
  });

  const toolUse = resp.content.find(
    (c): c is Anthropic.ToolUseBlock => c.type === "tool_use"
  );
  if (!toolUse) {
    throw new Error(`[persona:${input.stage}] no tool_use in response`);
  }
  const payload = toolUse.input as Record<string, unknown>;

  const inTok = resp.usage?.input_tokens || 0;
  const outTok = resp.usage?.output_tokens || 0;
  const costUsd =
    (inTok / 1_000_000) * OPUS_PRICE_PER_M.input +
    (outTok / 1_000_000) * OPUS_PRICE_PER_M.output;
  const costCents = Math.round(costUsd * 100);

  console.log(
    `[persona:${input.stage}] ${cfg.shortName} report=${input.reportId} cost=$${costUsd.toFixed(
      4
    )} in=${inTok} out=${outTok}`
  );

  return {
    stage: input.stage,
    payload,
    costCents,
    costUsd,
    promptTokens: inTok,
    completionTokens: outTok,
    model: PERSONA_MODEL,
  };
}

/* ─── Stage order helpers ─── */

export const STAGE_ORDER: PersonaStage[] = [
  "chain_analysis",
  "lien_analysis",
  "defect_review",
  "aol_lock",
];

export function nextPersonaStage(stage: PersonaStage): PersonaStage | "drafting" {
  const idx = STAGE_ORDER.indexOf(stage);
  if (idx === -1 || idx === STAGE_ORDER.length - 1) return "drafting";
  return STAGE_ORDER[idx + 1];
}
