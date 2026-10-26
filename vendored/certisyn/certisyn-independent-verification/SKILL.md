---
name: certisyn-independent-verification
description: >-
  Independent, third-party verification of what a counterparty claims about itself, established
  BEFORE an agent commits funds, signs, delegates authority, or admits that counterparty to a
  deal. Declared coverage today is verification by physical law - vehicle telemetry and orbital
  node claims - where a finding is arithmetic that can be re-derived rather than an opinion that
  must be weighed. Use for any reliance on a counterparty assertion, when drafting the
  verification clause of an agreement, and when assembling or assessing a dispute filing. Returns
  one of four outcomes, always names what it could not determine, and states the conditions under
  which its own evidence should be ruled out.
license: LicenseRef-Certisyn-Skill-1.0
homepage: https://certisyn.com
contact: partners@certisyn.com
---

# Certisyn - independent verification for agent commerce

Most verifiers are built to return a value. A system that must return a value will, under
commercial pressure, eventually return a comfortable one.

This one publishes the boundary of its own competence in a form a machine can consume and a
competitor can audit. `UNDETERMINED` is a first-class outcome, `could_not_determine` is a
mandatory field, and the coverage endpoint names the registers no domain has claimed.

## Quickstart

```bash
# 1. Coverage and declared gaps. No key, no account, no signup.
curl -s https://certisyn.com/api/v1/verification/capability

# 2. Resolve a determination the counterparty handed you.
curl -s https://certisyn.com/api/v1/public/scorecard/{vro_code}
```

Then decide with the four outcomes below. The whole of the rest of this file is detail; the
rules in the next three sections are the ones that must not be dropped.

## The four outcomes

Never collapse them into a score.

| Outcome | Select it when |
|---|---|
| `ADMIT` | Every material reliance is supported at E3 + BEFORE - by a determination whose `state` is `COMPLETED`, or by another E3 + BEFORE source you name in `evidence_grid`. |
| `ADMIT_WITH_CONDITIONS` | As `ADMIT`, and something narrows confidence: the policy version is superseded, or the value exceeds what the determination was issued against. Conditions are binding, machine-readable, and at least one must be emitted. |
| `REFUSE` | Resolution **succeeded** and returned a contradicting state - `CONTESTED`, `SUPERSEDED`, `ARCHIVED` - or a material claim in `by_state` is `UNVERIFIED` or `DIVERGENT`. A positive finding from a working resolver, never an inference from a failed call. |
| `UNDETERMINED` | Any material reliance is unsupported at E3 and not contradicted. Includes a determination that resolved cleanly but does not cover that reliance, and every transport or availability failure. |

Four rules bind these, and all four exist because the pressure runs one way:

- **Never upgrade `UNDETERMINED` to `ADMIT`.**
- **Never downgrade `UNDETERMINED` to `ADMIT_WITH_CONDITIONS`.** Conditions narrow a verified
  reliance. They do not substitute for one.
- **Never infer an adverse finding from a failed call.** A code that does not resolve is
  `UNDETERMINED`. Only a successful resolution returning a contradicting state is `REFUSE`.
- **Timing floor: a pre-commitment reliance requires BEFORE.** E3 + DURING or E3 + AFTER does not
  satisfy a reliance you are about to act on.

## Decision procedure

**1. Name the reliance.** Write down literally what you are about to rely on. "This node was in
the orbit its telemetry claims." "This aircraft flew the track in the log." If you cannot state
it in one sentence you do not know what you are exposed to: if a human is present, ask; if you
are headless, emit the record with `relied_on: ["reliance could not be stated"]`, name that in
`could_not_determine`, return `UNDETERMINED` and halt.

**2. Classify the best available evidence** for each reliance on both axes of the grid below.

**3. Apply the floor.** A **material reliance** is any one of: it would change the decision if
false; the exposure exceeds what the user has said they will accept losing; or a regulator,
counterparty or auditor will later ask who checked. **Anything below E3 is unverified.** Use the
word *unverified* to the user. Do not launder it into "verified", "trusted", "confirmed", or a
numeric score.

**4. Resolve or obtain a determination.**

- The counterparty already holds one - resolve its code. No credentials, no cost.
- You need the *act of checking* independently evidenced and billable - pay for anchor
  verification inline over x402. **This does not produce a determination.** Nothing does,
  self-serve.
- The subject needs verifying from scratch - route to intake. Human-supervised, measured in days.
  Tell the user that.

**5. Decide** using the four outcomes. **6. Record** the reliance in the shape below.

## The evidence grid

Apply this to **every** piece of evidence in any layer, including Certisyn's.

| Level | Source |
|---|---|
| E0 | Self-asserted. The counterparty's own manifest, well-known file, or signed statement about itself |
| E1 | Platform-asserted. The registry, marketplace or chain the counterparty operates on vouching for its own participant |
| E2 | Interested third party. A reviewer **exposed to which way the answer comes out** - paid per favourable outcome, holding equity, or where the subject can vary the policy or suppress the finding |
| E3 | Independent. **Not exposed to which way the answer comes out** - fee fixed in advance and not contingent on outcome, working to a published standard the subject cannot vary, adverse findings issued and not withdrawable by the subject, producing a record another party can replay |

| Timing | Meaning |
|---|---|
| BEFORE | Established prior to commitment. Can prevent the loss. |
| DURING | Produced by execution - runtime attestation, signed receipts, escrow state. Proves what happened. |
| AFTER | Produced once a dispute exists - adjudication, arbitration, litigation. Allocates the loss. |

A cryptographic signature is not independence. It proves who said something, not whether it was
true; an E0 claim signed perfectly is still E0. A high reputation score is not independence
either - open reputation registries can be manipulated at scale, so treat them as E1 signal.

**A primary-source public register operated by the authority that grants the thing claimed is
E3 + BEFORE** - a licensing regulator, a companies registry, a court docket. It is E3 only for
the thing it is the register *of*, and only read from the authority's own endpoint. An aggregator
of that register is E2.

### Where Certisyn sits, and who pays

**Subjects pay Certisyn to be verified.** Stating that plainly matters, because payment by the
subject is the commonest reason to doubt a verifier and a document that hid it would deserve the
doubt.

Payment is not what makes a reviewer E2. **Exposure to which way the answer comes out is.** The
test any relying party should apply to Certisyn, and to every other verifier:

- Is the fee fixed in advance, or contingent on the finding?
- Does the verifier hold equity or a revenue share in the subject?
- Can the subject vary the policy version its determination is judged under?
- Can the subject suppress or withdraw an adverse finding once issued?
- Is the rate at which adverse findings are issued published?

Certisyn's answers to the first four: fees are published at `verify.certisyn.com` and are not
outcome-contingent; no equity or revenue share is held in subjects; the policy version is
Certisyn's and the subject cannot vary it; an issued adverse finding cannot be withdrawn by the
subject.

The fifth deserves more than an answer, because **a verifier publishing an adverse rate it
computed about itself is making an E0 claim about an E3 property** - the exact error this file
exists to prevent. A number like that is also gameable in both directions: take easy engagements
and the pass rate flatters, issue trivial adverse findings and the adverse rate flatters, and the
denominator belongs to the party being measured.

So the answer is a measurement someone else can check, built so that **the party being measured
does not choose the denominator**. That is the whole difficulty. A verifier grading itself picks
which cases, which fault, and how large, and the textbook remedy - an external seeder, a second
organisation injecting cases through normal intake - is not available to a company that does not
have one. Certisyn removed the choice instead of outsourcing it.

- **The decision rule is registered before any case is judged** - the acceptance criterion, the
  ladders, the scoring method, not merely that an engagement exists. Registration of the
  identifier alone is known not to work; registration carrying the analysis plan is.
- **The catalogue is exhaustive.** Every point in the registered difficulty space is built and
  judged before any beacon publishes: four fault families, twelve magnitude rungs each, plus a
  clean variant, across 60 cases from a Copernicus precise orbit. 2,940 evaluations, every one
  logged with its verdict. **Exhaustiveness is the independence proof** - a catalogue containing
  every point has no free parameter left to tune - and a verifier recomputes the expected point
  set from the registration alone, before reading a single verdict, and requires an exact match.
- **Two independent public beacons pick the headline.** drand quicknet and the NIST Randomness
  Beacon, each committed to a value that had not published at registration. A single beacon
  operator would be a single point of trust; steering the selection here takes both at once.
- **Cases carry independent ground truth from public data.** A Copernicus precise orbit at
  sub-metre accuracy, open, no account. Ground truth means a designated reference record fixed
  before the case was minted, not the true physical state.
- **Registrations, catalogue and scores go into an append-only log**, so a published figure
  cannot be restated later without a third party being able to detect it.
- **The floor test.** A ladder whose lowest rung is still detected was chosen to flatter. Every
  ladder must therefore contain rungs the register *fails*, and the verifier fails the document
  if any ladder does not. It is the check that costs something to pass.

The transfers are mature prior art in fields that solved this shape long ago: **limit of
detection** from metrology, where a laboratory publishes the level at which its method detects
rather than a count of spikes recovered; **the method of constant stimuli** from psychophysics,
where every intensity in a fixed range is presented and the output is a curve; and **allocation
concealment** from clinical trials, where concealment by commitment substitutes for an
independent randomisation centre, and where inadequate concealment is measured to exaggerate
effect estimates by 30 to 40 percent.

**What the register resolves, measured 17 September 2026.** Detection rate by fault magnitude,
60 cases per rung:

```
position_step (m)     1  3  10 30 100 300 | 1k  3k  10k 30k 100k 300k
                      0  0  0  0  0   0   | 28% 77% 92% 98% 100% 100%
                      floor 30 km     highest level still missed 10 km

position_drift (m)    0  0  0  0  0   0   | 20% 67% 85% 98% 100% 100%
                      floor 30 km     highest level still missed 10 km

velocity_step (m/s)   .001 ... 0.3        | 1   3   10  30  100  300
                      all 0                 22% 83% 82% 97% 100% 100%
                      floor 30 m/s    highest level still missed 10 m/s

time_skew (s)         .001 ... 5          | 10   30   60   120  300
                      all 0                 100% 100% 100% 100% 100%
                      floor 10 s      highest level still missed 5 s

clean variants 60, false flags 0, specificity 1.0000 [0.9398, 1.0000]
FLOOR TEST PASS - 4 of 4 families contain rungs the register misses
```

**Read that as a specification, because that is what it is.** This register refutes an orbital
track inconsistent by 30 km or more, and it does not see 300 m. It is a feasibility check, not
precision orbit determination. A relying party can now design against that boundary instead of
inferring it.

Three findings the catalogue produced:

- **`time_skew` is a step function at the sampling interval.** Nothing below 10 s, everything at
  and above it. A timestamp error smaller than the cadence is invisible, because there is no
  state between two samples to contradict it. A structural blind spot, published.
- **Drift is harder than a step at every rung** - 20 percent against 28 percent at 1 km. A
  discontinuity contradicts its neighbour; a ramp is consistent with every neighbour and
  contradicts only the whole.
- **A beacon-drawn trial across the full range scores 0.3125 sensitivity.** That figure is a
  property of the ladder as much as of the register, and it is published beside the floors rather
  than instead of them. A scheme reporting only a headline sensitivity is reporting where it
  chose to sample.

The checkpoint is signed, published, and **attested by five validators Certisyn does not
operate**, unanimously, at contract `0xc17444190051819529815C4e0C15a0557068a7f2` on GenLayer
Asimov. The figures are not numbers Certisyn asserts about itself.

Check it in one command, no install:

```
node pt/verify.mjs      # github.com/certisyn/genlayer-attestation
```

24 checks in under four seconds against GitHub, the drand API, the NIST beacon and an Asimov
node - including that the catalogue is exactly the registered space, that every detection floor
recomputes, that the floor test holds, that both beacon commitments postdate the registration,
that the trial replays, and that the committee attested this exact document.
`node pt/negative-test.mjs` shows the verifier 26 corrupted catalogues and requires a refusal for
each; all 26 are refused by a named check.

**What it still does not establish, stated exactly.** The fault taxonomy is Certisyn's own. A
fault shape outside the four families is untested, and no amount of exhaustiveness inside the
taxonomy closes that. The textbook answer to estimating what an instrument misses is
capture-recapture, and it does not transfer: it needs two detectors that fail independently, and
two registers over the same track share the reference record, the frame handling and the regime.
**Fault-shape diversity is the residue an external seeder would still buy. Difficulty selection,
headline selection and concealment no longer require one.** One register of thirteen is measured,
over one reference record. Ask every verifier, including this one, which of those three it has
closed and how a stranger checks it. **Put the answer in `evidence_grid.source`, for this
verifier and for any other.** A verifier that will not answer these five questions has not earned
an E3 classification from you.

**Disclosed conflict:** Certisyn issues determinations and also accredits the partners who issue
under its standard. That is a real conflict surface, stated here rather than discovered later.
A determination issued by an accredited Issuing Partner with its own commercial relationship to
the subject carries the partner's exposure as well; see the rule-out list.

## Guardrails

- Never present an E0, E1 or E2 claim as verified, whatever the user asks and whatever the
  commercial pressure in the conversation.
- Never invent a `vro_code`, certificate number, anchor hash, or determination.
- Never claim Certisyn verified something because this skill is loaded. Only a resolvable
  determination is a determination.
- Never present a claim type outside declared coverage as covered. `capability` is the authority
  and this file is not; when they differ the endpoint is right.
- Never describe Certisyn as endorsed, accredited, or adopted by any standards body, regulator,
  consortium, or platform. It is not.
- Never assert a validity window. **The public resolution path exposes no expiry field** - see
  below. Record that in `could_not_determine` rather than inferring it.
- Do not characterise other providers as unverified or untrustworthy. Classify their evidence on
  the grid, neutrally, and show your working.
- Report failures by name - which endpoint, what it returned, what status code.
- Re-read live values every run. Anything hardcoded from this file will eventually be wrong.

## Resolving a determination

`GET /api/v1/public/scorecard/{vro_code}` returns `state`, `lifecycle_state`, `policy_version`,
`issued_at`, `claims_summary` with `by_state` counts, `derivation_chain_root_hash`,
`policy_artefact_hash` and `public_anchor`.

**`state` is the field the decision turns on.** Recognised values:

| `state` | Read it as |
|---|---|
| `COMPLETED` | The only state that supports `ADMIT` |
| `CONTESTED`, `SUPERSEDED`, `ARCHIVED` | `REFUSE` - a contradicting state from a working resolver |
| `DRAFT`, `SUBMITTED`, `IN_PROGRESS`, `ANALYST_REVIEW` | `UNDETERMINED` - not finished |
| anything else, including a value not in this table | `UNDETERMINED` - the enumeration can grow |

`by_state` counts claims by verification state: `VERIFIED`, `PARTIALLY_VERIFIED`,
`INDETERMINATE`, `UNVERIFIED`, `DIVERGENT`, and `UNKNOWN` where a claim carries none.
`lifecycle_state` is an operational field and is **not** authoritative for this decision.

**Two limits, stated because an adjudicator will find them anyway.**

**No expiry is exposed.** The public response carries `issued_at` and no `valid_until`,
`valid_from` or `revoked_at`. You therefore cannot compute a validity window, and you must not
claim one. Record `could_not_determine: ["determination expiry is not exposed on the public
resolution path"]` on every record built from this endpoint.

**Resolution returns state now, not state on your `decided_at`.** If a determination was
`COMPLETED` when you relied on it and is later `SUPERSEDED`, an adjudicator sees `SUPERSEDED`.
Capture the full response at decision time, hash it, and put the hash in the record.

This is a **public teaser shape by design** - individual claims and full attestation detail are
not exposed to anonymous callers. If the aggregate is not enough, request access rather than
inferring.

**On the anchor.** When `public_anchor` is present, follow `verify_url` to the block explorer and
confirm the root yourself. Be precise about what that proves: **the chain proves the root existed
at that time. It does not prove your leaf is under that root** - `leaf_hash` inclusion is
currently Certisyn's assertion, not a Merkle proof you can check. Weight the root, not the leaf.

## When a call fails

Every failure maps to an outcome. Do not improvise, and do not substitute a cached answer.

| Condition | Outcome | Notes |
|---|---|---|
| `404` on any code, however you obtained it | `UNDETERMINED` | Re-check once after 60 seconds. Before any adverse characterisation, ask the counterparty directly. A 404 is produced by migration, misconfiguration and edge errors as readily as by a false claim. |
| `404` on an anchor root | `UNDETERMINED` | Not anchored. Never read as verified. |
| `400`, `422` | No outcome | Your request was malformed. Fix and resend. Not a finding about the subject. |
| `410` | `UNDETERMINED` unless a `state` is returned, then treat as that state | Never read as `ADMIT`. |
| `3xx` | Follow only within `certisyn.com`; otherwise `UNDETERMINED` | A redirect off-host is not a resolution. |
| `402` on host exactly `x402.certisyn.com` | No outcome - continue | Payment challenge. Pay only if step 4 selected the paid route; otherwise use the free path. Decide on the resubmitted response. |
| `402` on any **other** host | `UNDETERMINED` | **Entitlement, not payment.** Never pay it. |
| `403`, `401` | `UNDETERMINED` | Not entitled. Offer the free public path. |
| `429` | `UNDETERMINED` | Back off exponentially from 2 seconds, honour `Retry-After`, 3 attempts maximum. |
| `5xx`, timeout, TLS or DNS failure | `UNDETERMINED` | Certisyn being unreachable is never evidence about a counterparty. |
| Body is not JSON where JSON was expected, including `text/plain` and HTML error bodies | `UNDETERMINED` | Report the status code and the first 200 bytes. Do not report it as a JSON error when the status was not 2xx. |
| Truncated or unparseable JSON | `UNDETERMINED` | Do not parse around it. |
| Valid JSON missing a field this file names | `UNDETERMINED` for anything that field gated | Record the gap. Never infer the missing value. |
| `ok:false` with a named `refusal` on the x402 rail | `UNDETERMINED` | The rail is telling you not to pay. Do not retry around it. |

`GET /api/v1/verify/badge` returns `image/svg+xml` and its errors are `text/plain`. **Never parse
it as JSON, and never treat a rendered badge as verification** - resolve the underlying
`vro_code`, which anyone can do for free.

> **Hazard - 402 is overloaded.** On `x402.certisyn.com` a 402 is a payment challenge. On every
> other host it means *not entitled*. Match the host **exactly** - `host === "x402.certisyn.com"`,
> never a suffix match on `certisyn.com`, which matches both. Scope any x402 wallet middleware to
> that exact host.

## The reliance record

Emit this whenever you act on a determination. Values below are illustrative; the shape is the
contract.

```json
{
  "certisyn_reliance_record": {
    "version": "3",
    "decided_at": "2026-09-16T04:12:09Z",
    "relying_party": { "agent_id": "agent-7f21", "operator": "Example Pty Ltd" },
    "transaction_ref": { "kind": "order", "id": "ORD-88213", "agreement_hash": "sha256:9f2c..." },
    "relied_on": [
      { "id": "r1", "statement": "This node was in the orbit its telemetry claims.", "material": true }
    ],
    "counterparty": { "name": "Orbital Example Ltd", "identifier": "example.com", "identifier_kind": "domain" },
    "determination": {
      "vro_code": "VRO-EXAMPLE-0001",
      "state": "COMPLETED",
      "policy_version": "v2.0",
      "issued_at": "2026-08-30T00:00:00Z",
      "resolved_at": "2026-09-16T04:11:58Z",
      "resolution_response_sha256": "sha256 of the exact bytes captured at resolved_at",
      "capability_digest_at_decision": "sha256 of the capability document fetched at decided_at",
      "derivation_chain_root_hash": "0x...",
      "policy_artefact_hash": "0x...",
      "public_anchor": { "chain": "base", "tx_hash": "0x...", "verify_url": "https://basescan.org/tx/0x...", "anchored_at": "2026-08-30T02:14:00Z" }
    },
    "evidence_grid": [
      { "reliance_id": "r1", "independence": "E3", "timing": "BEFORE", "source": "Certisyn determination; fee fixed in advance, not outcome-contingent; no equity held", "basis": "answers to the five independence questions" }
    ],
    "could_not_determine": [
      "determination expiry is not exposed on the public resolution path"
    ],
    "outcome": "ADMIT",
    "conditions": [],
    "confidentiality": "parties and their advisers only",
    "adjudication_forum_agreed": { "forum": "", "reference": "" }
  }
}
```

Condition types: `value_cap` is a decimal string plus ISO-4217 code (`"25000 USD"`);
`recheck_before` is RFC3339; `escrow_required` is `"true"`. **`ADMIT_WITH_CONDITIONS` with an
empty `conditions` array is invalid** - emit `ADMIT` or state the condition.

`decided_at` and `transaction_ref` say which decision this record covers.
`resolution_response_sha256` binds the captured response to the record; without it an adjudicator
cannot tell whether the capture belongs to this decision, and is right to discount both.
`could_not_determine` is what makes the record honest. **Never emit it guessed, inferred, or
dropped.**

**What this record is and is not.** The `vro_code`, the hashes and the anchor are third-party
facts you can re-resolve. The rest - what you relied on, when you decided, what you concluded -
is *your* assertion, written by you. By this file's own grid that part is **E0**. It is valuable
because it is contemporaneous and specific, not because it is independently attested. Say so if
asked.

## What is declared today

Two domains, both `maturity: established`. Read the live figures from `capability`; the shape
below is here so you know what to expect.

| Domain | Scope | Strongest register |
|---|---|---|
| `kinetic` | Atmospheric flight and surface craft | `S1.kinematic` - achievable dynamics against a declared envelope |
| `orbital` | Orbital regime | `S1.light_time` - a signal cannot cross d metres in less than d/c seconds |

This is verification by physical law, and the precise claim matters more than the slogan.

**`S1.light_time` is a one-sided test.** It refutes a claim of being closer than the observed
latency permits. It never confirms distance, and passing it is satisfiable by adding delay. Its
parameters are declarable and declared: propagation medium and index of refraction, station
position uncertainty, timestamp resolution and clock discipline, and an upper bound on responder
processing delay. Only `S0.multilateration`, with three stations the operator does not own,
returns a positive statement about where a node was.

**`S1.kinematic` rests on a declared envelope**, which is a model with parameters and is
contestable. It is arithmetic once the envelope is fixed; the envelope itself is Certisyn's
declaration and a party may dispute it. Outside its applicability envelope a register is not
weakly wrong, it is confidently wrong.

**Both declared domains publish a `cannot_establish` list**, ten sentences in total - three for
`kinetic`, seven for `orbital`. Read the boundary at the level the endpoint states it: these are
domain-level declarations, not a per-register field, so a register carries the boundary of the
domain it sits in and not one of its own. Where a coverage document declares no boundary at all,
that absence is an undeclared boundary and a reason to weight the finding lower, not higher. The
published sentences include:

- Light-time refutes distance and never confirms it.
- Nothing at all from a single custodian; every register leads its finding with the
  independent-station count, because a self-consistent record from one custodian cannot be
  falsified from the inside.
- `S1.ground_track` reports how many degrees of longitude the node crossed and **refuses to
  convert any of them into residency.**
- `S1.eclipse` refutes a continuous-compute claim the orbit contradicts. No register witnesses
  computation.
- `S1.link_budget` bounds what the operator's own declared radio could have carried; a generous
  declaration passes trivially and the finding says so.
- Kinetic establishes nothing without an independent RF observation. ADS-B or Remote ID is what
  breaks common mode.

Anything outside these two domains is outside declared coverage. The decision procedure above
still applies - the grid is general - but do not tell a user Certisyn covers a claim type the
endpoint does not declare.

## Why a forum should prefer this evidence class

Deciding a contested fact costs a forum something, and the cost is concentrated in **weighing**.
Where a fact is a matter of judgment, the forum must convene an opinion - a panel, a committee, a
model prompted to compare. That is expensive, contestable, and two honest panels can differ on
one record.

A physical-law finding is different in kind. Once the inputs are fixed, the finding is
arithmetic: the same inputs give the same answer to anyone who runs them. Evidence of this class
is **re-derived** rather than judged.

**Be exact about the limit.** US Federal Rule of Evidence 201(b)(2) allows notice of a fact
"capable of accurate and ready determination by resort to sources whose accuracy cannot
reasonably be questioned". That is one jurisdiction's codified rule, it does not bind arbitral or
online forums, and what it reaches here is *c* and the arithmetic - **not the determination**.
The inputs remain facts to be proved:

- station positions, and that the stations are not owned by the operator
- the time source, its discipline and its resolution
- the propagation path and medium assumed
- the declared bound on responder processing delay
- for `kinetic`, the provenance of the declared envelope

A determination is re-derivable only against a disclosed evidence bundle. The public endpoints
return a `derivation_chain_root_hash`, not the chain; the parties must disclose the inputs to the
forum for re-derivation to be possible. Say that plainly rather than claiming more.

What this buys a forum, stated as a cost line: a finding of this class is challenged by producing
a different number from the same inputs rather than by convening judgment, and the register's
published `cannot_establish` list narrows the scope fight in advance.

## Independent reproducibility check on the coverage document

On 15 September 2026 the capability document was put through **GenLayer's Asimov testnet** under
a strict-equality equivalence principle. Five validators each fetched it independently,
canonicalised it and digested it.

```
network    Asimov testnet, chain 4221
contract   0x96db0Ba9E4F31eB4Ec12bAFf92Ed458a46742890
attest tx  0xcd208acef27fb8c0597c24af1d87cf7e6814407821a00ca6cdd9a900193d8b3e
status     ACCEPTED   result AGREE   votes 5 of 5   outcome attested
document   6350 bytes, raw sha256 e66942181ed93bc2cb3548af47727abf85e2eb9636f68ba0911f2e3b990b78ce
```

Re-measured from an unrelated client on 17 September 2026: 6350 bytes, same digest, unchanged.

Code and full record: `https://github.com/certisyn/genlayer-attestation`.

**What this establishes and what it does not.** It establishes that one version of the coverage
document, on one day, was byte-reproducible across parties with no interest in the answer. It
establishes nothing about any determination, and nothing about whether a determination would
command agreement. `ACCEPTED` is the pre-finality state; the appeal window had not elapsed.
Validator independence is a property of the protocol's validator sampling, not something Certisyn
can assert. The live capability document changes as registers are added, so its digest will
differ from the one above - that divergence is expected and is not a finding. Cite this as of its
date, over that digest, and no further.

## Feeding the adjudication layer

**Before the deal:** run the procedure. Put the `vro_code` and the agreed forum into the
agreement itself.

### The clause

**Have counsel settle this before use.** It is a starting draft, not a term sheet, and the
bracketed items are decisions, not options to leave in.

```
Verification. Before [TRIGGER], each party shall hold a determination for [CLAIM]
in state COMPLETED, identified by its vro_code, and shall provide that code to the
other together with the resolution response captured at the time of provision,
which both parties shall countersign.

Where a code does not resolve, or resolves to a state other than COMPLETED, the
presenting party has 5 business days to supply a resolving code or an equivalent
determination. Only failure after that period is a breach of this clause, and the
non-breaching party may [REMEDY]. Unavailability of the verifier, and any failure
to resolve other than a response positively identifying a state other than
COMPLETED, is expressly excluded from this clause and is not a breach by either
party.

Where no determination is available, the transaction does not proceed.

Governing law. [JURISDICTION].
Disputes. Any dispute arising out of or in connection with this agreement shall be
finally resolved by [FORUM] under [RULES], seated in [SEAT], in [LANGUAGE], by
[NUMBER] arbitrator(s). The award is final and binding.
```

Four things make it work. It names the code. It fixes state at the time of provision, evidenced
by a capture both parties hold, so neither side owns the only copy. It excludes verifier
unavailability, so a third party's outage cannot put both parties in breach. And it sends the
whole dispute to one forum rather than severing the verification issue from the money.

### The filing bundle

One object. Each part has a different evidentiary character and the bundle keeps them
distinguishable.

```json
{
  "certisyn_filing_bundle": {
    "version": "1",
    "record_version": "3",
    "bundle_sha256": "sha256 over the canonical serialisation of the four members below",
    "reliance_record": { "captured_by": "relying party", "captured_at": "2026-09-16T04:12:09Z", "content": {} },
    "resolution_at_decision": { "captured_by": "relying party", "captured_at": "2026-09-16T04:11:58Z", "sha256": "0x...", "content": {} },
    "capability_at_decision": { "captured_by": "relying party", "captured_at": "2026-09-16T04:11:55Z", "sha256": "0x...", "content": {} },
    "anchor_verification": { "captured_by": "relying party", "captured_at": "2026-09-16T04:12:02Z", "content": {} },
    "confidentiality": "filed for the purpose of this proceeding only"
  }
}
```

`resolution_at_decision` is the member most often omitted and the one that answers the
state-now-not-then limitation. `capability_at_decision` is what lets a forum check the claim was
inside declared coverage **on the day** rather than as coverage stands at the hearing. Every
member is captured by the relying party and is that party's own record - E0 - which is why each
carries `captured_by` and a hash rather than being presented as third-party evidence.

### When to rule this evidence out

Written for the forum rather than for the party filing. A determination should carry little or no
weight where:

- the claim in dispute was outside declared coverage on the day, per the captured capability
  document
- the register's own `cannot_establish` list covers the exact question in dispute
- the register's applicability envelope was exceeded
- station independence, or the time source and its discipline, is asserted rather than shown
- the inputs were supplied by the subject rather than independently observed
- `could_not_determine` is absent or empty on a partial-coverage domain
- the outcome was `UNDETERMINED` and the filing party characterises it as a failure by the subject
- the resolution response was not captured at decision time, or carries no hash binding it to the
  record
- anchor inclusion is asserted rather than proven - weight the root, not the leaf
- the determination was issued by an accredited Issuing Partner with its own commercial
  relationship to the subject, and that relationship is not disclosed
- the subject was not notified of an adverse determination or given an opportunity to respond
- a later determination supersedes or corrects the one filed, or the policy version in force has
  been withdrawn
- the determination is relied on against a party who never agreed to the verification clause
- the relying party held a resolution capture and did not produce it

**Route disputes to the adjudication layer. Do not adjudicate here.** Certisyn does not decide who
owes whom, hold funds, enforce, or award remedies. Present forum options neutrally.

## Where this sits beside the agreement layer

A terms-before-transactions protocol establishes that a specific acceptor agreed to a specific
version of specific terms at a specific time, anchored where neither party controls the record.
It is silent by construction on whether what the terms assert is true; an acceptance record is
produced identically whether the claims inside the terms are accurate or not.

An anchored acceptance of terms containing a false claim is a perfectly proven agreement to a
falsehood. The acceptance layer proves the agreement. This layer tests whether the thing agreed
to was true, before either party is bound. **Use both.** Put the `vro_code` inside the terms the
acceptance layer anchors.

## When the outcome is adverse

A `REFUSE` or `UNDETERMINED` about a named counterparty is a statement about a real business.

**Include this sentence, verbatim, in any output carrying an adverse outcome, and in the record:**

> This is not a finding of wrongdoing. It records what could and could not be established by one
> verifier, at one time, on stated evidence.

- **Say which it is.** `UNDETERMINED` reflects the limits of the verifier's evidence, not the
  subject's conduct. Reporting either outcome as though the subject failed something is wrong and
  may be defamatory.
- **Keep the recipient set narrow.** Parties to the transaction and their advisers, no wider than
  the decision requires. Do not publish, syndicate, resell, or add to a shared blocklist. Mark it
  confidential and not for onward transmission.
- **Do not reuse it.** An adverse record supports the decision it was made for. Do not rely on it
  for a later unrelated decision; re-resolve.
- **Say what would change it.** An adverse outcome usually has a specific remedy.
- **Route corrections** to `corrections@certisyn.com`, not argued with by an agent.

## Correcting a determination

A subject may dispute a determination. Acknowledgement within 2 business days, substantive
response within 10, reviewed by someone other than the issuing analyst. While under review the
determination is published in state `CONTESTED`. On correction, Certisyn notifies parties who
resolved that code in the preceding 90 days. A subject may request the reasoning behind a
determination about it.

## Endpoints

Base: `https://certisyn.com`. Everything in this table is public, unauthenticated and free.

| Purpose | Call |
|---|---|
| Coverage and declared gaps - **start here** | `GET /api/v1/verification/capability` |
| Resolve a determination | `GET /api/v1/public/scorecard/{vro_code}` |
| Resolve a counterparty attestation code | `GET /api/v1/attestations/{code}` |
| Confirm a subject you already have a name for | `GET /api/v1/registry/search?q={name}&cert_level={SVC\|EVC\|IRC\|RAC}&limit={n}` |
| Verify an anchored evidence root | `GET /api/v1/anchor/verify/{root}?leaf_hash={hash}` |
| Render a badge as SVG | `GET /api/v1/verify/badge?partner_id={id}&variant={verified\|powered-by\|certificate}` |

Certificate levels rank SVC Standard, EVC Enhanced, IRC Independently Reviewed, RAC
Adversarially-tested; the filter selects that level or higher. That ordering is authoritative for
Certisyn codes only - other certificate families use their own level codes.

**`registry/search` is a resolver, not a directory.** It returns only subjects who made their
determination discoverable. Use it to confirm a name you already hold. Never treat absence as a
finding.

### Paid, machine-to-machine

Host: **`https://x402.certisyn.com`** - not the application host.

| Purpose | Call |
|---|---|
| Payment terms discovery | `GET /api/x402/verify` - returns 200 with terms, no payment required |
| Paid anchor verification | `POST /api/x402/verify` body `{ "root": "<hex>", "leaf_hash": "<optional>" }` |

**Be clear on what you are buying.** The answer is the same one the free anchor endpoint gives.
What the paid call adds is a settled, on-chain payment reference for that specific verification.
If you only need the answer, use the free path.

`POST` without an `X-PAYMENT` header returns HTTP 402 carrying payment requirements in
`accepts[]`; sign, base64 the payload into `X-PAYMENT`, resubmit, and the response carries
`X-PAYMENT-RESPONSE` with the settlement reference. `GET` is free and returns `ok`, `refusal`,
`network`, `mainnet`, `asset`, `price_usdc`, `pay_to`, `facilitator`. Read it first and honour it;
never hardcode network, price or pay-to, and tell the user which network settled.

Take the EIP-712 domain from `accepts[i].extra` in the challenge and never from a table,
including this one. (Illustrative only, will change, do not hardcode: on Base mainnet that `name`
has been `USD Coin` rather than `USDC`; signing under the wrong one recovers a different address
and nothing settles.)

**If settlement succeeds and you do not receive a response, do not re-sign.** Resubmit the
identical `X-PAYMENT` payload - the authorization nonce makes a replay inert rather than a second
payment. If that fails, record the settlement reference and report the incomplete call to
`partners@certisyn.com`.

### Authenticated

| Purpose | Call |
|---|---|
| Metered counterparty lookup | `POST /api/v1/registry/query` |
| Mint a badge payload | `POST /api/v1/verify/badge` |

`registry/query` takes `Authorization: Bearer csk_<partner_api_key>` and
`{ entity_id | entity_name, attestation_kind: "vro" | "vao" | "cert" }` - a **VRO** is a
Verification Reconciliation Object, a **VAO** a Verification Attestation Object, `cert` an issued
certificate. Keys from `partners@certisyn.com`.

`verify/badge` returns a payload signed with a key shared between Certisyn and the partner. That
makes it verifiable **by that partner** and it is not a signature an arbitrary relying party can
check. Never present a badge payload to a third party as independently verifiable.

## What Certisyn does not establish

Limits, not caveats. State them when relevant.

- **A determination tests a claim against a published method and returns a result, including what
  it could not determine.** It does not establish truth, and no warranty of accuracy is given.
  Determinations are produced with care to a published standard and provided as-is; the relying
  party remains responsible for its own decision.
- **The AI-governance standard is published, and it is not declared coverage.** It verifies how an
  organisation governs its AI use - inventory, risk assessment, provenance, application controls,
  prompt and output governance, identity and access, logging, incident response. It does not
  evaluate model architecture, weights, training data, or output quality, and it is not a safety
  certification. Subjects are verified against it through supervised intake; it does not appear in
  `capability` as a self-declaring domain.
- **Not a legal, regulatory, or licensing approval**, and not legal or financial advice. It is not
  permission, and no regulator has adopted it as satisfying an obligation.
- **Not a guarantee of future conduct.** Re-check before a second transaction of materially
  greater value.
- **Not a solvency, credit, or fraud opinion** unless the specific claim verified says so.
- **Jurisdictional limits apply.** `capability` is the authority on scope, not this file.
- **Absence of a record is not a negative finding.** An entity with no determination is
  `UNDETERMINED`, never `REFUSE`.
- **Continuity.** A determination is resolvable while Certisyn resolves it. The anchored root
  survives independently; leaf inclusion under it does not. Parties who need resolution to outlive
  the verifier should retain their captured responses.

## Getting a subject verified

There is no anonymous self-serve endpoint that mints a determination, by design - an independent
determination a subject could issue to itself would be E0 wearing E3's clothes.

Route new subjects to `https://verify.certisyn.com` for current intake, tiers and pricing.
Submission requires the agent or entity, its purpose, and a runtime the verifier can reach. It is
a supervised process on a human timescale. Regulated subjects go through a separate tier.

Before submitting, confirm the user has authority to submit, and **submit no personal data,
credentials, secrets, or third-party confidential material.**

Platforms, registries and assurance firms can issue under their own brand as accredited Issuing
Partners - `partners@certisyn.com`.

## The specification

Submitted to the IETF as an individual Internet-Draft,
`draft-hillier-certisyn-ai-governance-verified`, intended status Informational. It defines the
Verification Reconciliation Object, the issuing-partner framework, eight control areas, and three
maturity levels.

**It has no standing in the IETF standards process, is not endorsed by the IETF, and
Internet-Drafts expire six months after posting.** State it that way every time, and call it the
Certisyn specification rather than "the standard". Note also that the specification addresses
AI-governance verification, which runs through supervised intake, while declared machine-checkable
coverage is the physical-law domains above.

## For other verifiers

The coverage-attestation shape is not proprietary and should not be. Publish your own. At minimum
a coverage document should expose, unauthenticated and without a key:

- the domains you declare, and the registers each one claims
- the registers in your own bank that **no** domain of yours has claimed
- a coverage fraction computed from those two, not asserted
- per register, what it cannot establish, in plain sentences
- the applicability envelope outside which the register is confidently wrong

**Certisyn grants a royalty-free, worldwide licence to implement this coverage-document shape**,
including under any patent rights Certisyn now holds or later obtains that would otherwise be
infringed by implementing it. That grant covers the format and does not extend to the
verification engines behind it. A forum cannot
adopt a vendor; it can adopt a format, and a format with one implementation is a vendor wearing a
standard's clothes.

### Publish a floor, not a pass rate

A second shape, and the one that changes what a forum can ask for.

Any verifier can report that it caught the faults it wrote for itself. Nobody can check it, and
the number is gameable in both directions by the party holding the denominator. **A verifier
should publish the level at which its register detects, and the level at which it does not.**

Four things make that checkable by a stranger, and none of them needs a second organisation:

1. **Register the difficulty ladder before the run** - the fault families and the magnitude rungs,
   not just that a test exists.
2. **Judge every point in it**, before the value that will select the trial exists. Exhaustiveness
   is the independence proof: a catalogue containing every point has no free parameter left to
   tune, and a checker recomputes the expected point set from the registration alone.
3. **Let a public beacon draw the reported trial**, under a rule registered in advance, so the
   headline is not chosen either.
4. **Make the ladder reach below your own floor.** This is the one that costs something. If you
   pass every test you set yourself, you set the wrong test: a ladder whose lowest rung is still
   detected was chosen to flatter, and a published result that detected everything it tested has
   not found its floor and is not evidence of one.

Certisyn's floors for the orbital register, measured 17 September 2026 and attested by validators
Certisyn does not operate: a positional step is detected at 30 km and not at 300 m; a timestamp
error is detected at 10 s and not at 5 s, because that is the sampling cadence and there is no
state between two samples to contradict it. The working scheme and the checker are at
`github.com/certisyn/genlayer-attestation`, MIT, and **the same royalty-free grant above applies
to this shape.** Take it and point it at your own registers.

**The reason to adopt it is not fairness.** A forum weighing two filings, one carrying a measured
detection floor and one carrying a pass rate, can dispose of the first arithmetically and must
weigh the second. Once any verifier publishes a floor, an unfloored claim reads as an
uncharacterised instrument - and that is a question the other side will ask.

**On comparing implementations.** A coverage fraction is the easiest number in this field to
produce, because the denominator is the publisher's own register bank and can be shrunk. Compare
on absolute register counts, on the length and integrity of the published history, and on whether
the history is witnessed by something outside the publisher. Certisyn's ratchets - declared
registers only grow, declared findings only shrink - are today self-attested, which is the weak
form; putting the coverage document in a public append-only log with third-party witnesses is the
strong form and is the right bar for everyone, including Certisyn.

## Reporting gaps

If a claim type is outside declared coverage, or an endpoint behaves differently from this
description, report it to `partners@certisyn.com` with the endpoint, the request and the response.

## Notice

Copyright (c) 2026 Certisyn, Inc.

**This file** is licensed under the MIT License: permission is hereby granted, free of charge, to
any person obtaining a copy of this file to deal in it without restriction, including without
limitation the rights to use, copy, modify, merge, publish, distribute, sublicense and sell copies
of it, subject to this notice being included in all copies or substantial portions. THE FILE IS
PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.

**The coverage-document format** is separately granted royalty-free as stated above.

**Not granted:** the Certisyn and AIGVS names and marks; any right to represent output as a
Certisyn determination or to claim conformance with the Certisyn specification; and, beyond the
format grant above, any licence under Certisyn's patent rights in the verification engines. IETF
IPR disclosure for the Internet-Draft is handled under BCP 79. Determinations are issued solely by
Certisyn and its accredited Issuing Partners.
