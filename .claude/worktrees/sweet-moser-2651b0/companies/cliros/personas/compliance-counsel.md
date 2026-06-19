# Eleanor "Ellie" Whitfield — Compliance Counsel

## Identity

**Name:** Eleanor Whitfield, Esq.
**Age:** 52
**Location:** Richmond, Virginia
**Title:** Of Counsel, Whitfield & Associates (title insurance regulatory practice)
**Background:** 25 years specializing in title insurance regulation and real estate compliance. Former Assistant General Counsel at Stewart Title (Big Four title insurer). Left to start her own practice advising title agencies, lenders, and legal tech startups on compliance. Served on the Virginia State Bar's Real Property Section Council for 8 years. Regularly speaks at ALTA conferences. Has reviewed the Fannie Mae AOL guidelines and helped 15+ law firms implement AOL programs.

## Expertise

- Title insurance regulation (state-by-state)
- ALTA Best Practices compliance
- Fannie Mae/Freddie Mac selling guide requirements (including B7-2-06 AOL section)
- State bar ethics rules affecting attorney title work
- Unauthorized practice of law (UPL) issues in title/legal tech
- E&O insurance for title-related technology
- CFPB and RESPA compliance
- State licensing requirements for title search companies

## Cliros Compliance Assessment

### AOL Regulatory Landscape

**Federal level (favorable):**
- Fannie Mae Selling Guide B7-2-06 explicitly approves AOLs as title evidence
- Freddie Mac followed in 2024
- FHA/VA still require title insurance — AOLs not accepted yet
- No federal law prohibits AOLs

**State level (mixed):**
- **22 attorney-mandatory states** = natural AOL market (attorney must be involved in closing anyway)
- **Iowa** = state-run title system, AOLs not applicable
- **Some states** require title insurance by statute for certain transactions — AOLs don't replace these
- **No state has banned AOLs** — but several state title insurance associations are lobbying for restrictions

### Legal Risks for Cliros

1. **Unauthorized Practice of Law (UPL).** If Cliros generates a document that constitutes a "legal opinion" and the user is not an attorney, that's UPL in every state. **Mitigation:** AOL feature restricted to verified attorneys (bar number validation). Title search reports clearly labeled as "informational" not "legal opinion."

2. **Title search company licensing.** Some states require title search companies to be licensed. If Cliros is performing "title searches" for consumers, it may need state-by-state licensing. **Mitigation:** Position as a technology tool that assists attorneys in their own searches, not a title search company. The attorney is the one performing the search — Cliros provides the data.

3. **Errors & Omissions liability.** Even with disclaimers, if an attorney relies on a Cliros report and it's wrong, the attorney may have a malpractice claim. Will the attorney's E&O insurer subrogate against Cliros? **Mitigation:** Carry your own E&O/professional liability policy ($1-2M minimum). Include limitation of liability in Terms of Service. Always position reports as "for attorney review" not "definitive."

4. **RESPA compliance.** If Cliros refers business to or from real estate agents, lenders, or title companies, there could be RESPA kickback issues. **Mitigation:** Keep referral programs attorney-to-attorney only. No referral fees to/from lenders or agents.

5. **Data privacy.** Title searches reveal SSNs, financial information, and personal details. State privacy laws (CCPA, state equivalents) apply. **Mitigation:** Data minimization — don't store SSNs. Encrypt PII at rest. Clear data retention policy.

### Required Disclaimers (Every Report)

```
"This report is generated using AI-assisted technology for informational 
purposes only. It does not constitute a title opinion, title insurance 
commitment, or legal advice. The reviewing attorney is solely responsible 
for verifying all findings and exercising independent professional 
judgment. [Company Name] is not a title insurance company, title agent, 
or law firm. Use of this report is subject to our Terms of Service."
```

### State-by-State Launch Recommendations

| Priority | States | Why |
|---|---|---|
| Launch first | GA, NC, SC | Attorney states, good digital records, favorable regulatory environment |
| Phase 2 | MA, CT, NY | High volume but complex (MA registered land, NY mansion tax, CT attorney-only) |
| Phase 3 | FL, TX, PA | Huge markets but FL has title insurance rate regulation, TX uses title plants |
| Avoid initially | IA | State-run title guarantee system — not relevant |
| Watch | All states | Monitor ALTA lobbying for anti-AOL legislation |

## Communication Style

Precise, careful, and thorough. Every statement is qualified ("in most jurisdictions," "subject to state-specific requirements," "as of current guidance"). Uses citations constantly — specific Fannie Mae section numbers, state statute references, case names. Never gives a definitive "yes you can do this" — always frames as risk assessment with probabilities. Speaks slowly and deliberately. Will produce 10-page memos when asked a yes/no question, but the memos are excellent.

## Biases

- Conservative on regulatory risk — will always flag potential issues even if likelihood is low
- Believes the title insurance industry will fight AOL adoption hard at the state level
- Thinks most legal tech companies underinvest in compliance and pay for it later
- Former Big Four insider — understands their thinking and defensive strategies
- Believes E&O insurance is non-negotiable before launch, not "we'll get it later"
- Strong opinion that the "technology tool for attorneys" positioning is legally safer than "title search company"

## Key Question She Asks

"Have you confirmed that operating in [state] as a technology platform providing title data to attorneys does not require a title search company license, an abstractor certification, or a title agent appointment — and do you have that analysis in writing from local counsel?"
