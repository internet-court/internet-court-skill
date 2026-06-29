# Shared: IPFS Upload Guidance
<!-- Source: curate-v1/curate-light-skill.md §5, curate-v1/pgtcr-stake-curate-skill.md §6, curate-v1-scout/scout-skills.md §9, kleros-ipfs-upload/SKILL.md, CLAUDE.md -->
<!-- Applies to: LGTCR, PGTCR, Scout — no flavor subsections; upload procedure is identical -->

## Durability rationale

Third-party pins can vanish — service changes, token expiry, account cancellation break the pin without notice.

Once a CID is recorded in a MetaEvidence or item event onchain, the artifact must remain retrievable for the full dispute lifecycle. Disputes run for weeks or months after submission; a missing artifact means jurors cannot evaluate evidence.

## Recommended path: kleros-ipfs-upload skill

Use the `kleros-ipfs-upload` skill for Kleros-ecosystem artifacts. The gateway is operated by the Kleros team; the team has a strong incentive to keep pins live because the protocol depends on these artifacts.

This is the recommended path for durability — not required. Agents may use any IPFS mechanism (see agent autonomy note below).

## Manual upload (Pinata UI)

1. Create a free account at [app.pinata.cloud](https://app.pinata.cloud)
2. Go to **Files** and click **Add** to upload your file or paste JSON
3. Copy the returned **CID**

## Programmatic upload (Pinata API)

Generate a JWT from **Developers → API Keys** (grant `pinFileToIPFS` scope), then:

```bash
curl -X POST https://uploads.pinata.cloud/v3/files \
  -H "Authorization: Bearer $PINATA_JWT" \
  -F file=@./your-file.json \
  -F network=public
```

## The Graph IPFS node

POST to the hosted node with `wrap-with-directory=false`:

```bash
curl -sS -X POST \
  -F "file=@/absolute/path/to/file.json;filename=file.json;type=application/json" \
  "https://api.thegraph.com/ipfs/api/v0/add?wrap-with-directory=false"
```

Use the returned `Hash` as the CID.

WHY `wrap-with-directory=false`: passing `true` creates a directory CID; the file is at `/CID/filename`, not at `/CID` directly. Direct `ipfs.io/ipfs/<CID>` access breaks, and the filename is not always predictable from the CID alone.

## Submission format rule

Use `/ipfs/<CID>` in all onchain fields — `_evidence` parameter, MetaEvidence JSON, item.json values:

```text
/ipfs/<CID>
```

Never use a full gateway URL (`https://cdn.kleros.link/ipfs/...`, `https://ipfs.io/ipfs/...`).

WHY: gateway URLs are mutable — the domain can change or the service can go offline. The CID is the permanent, content-addressed identifier; gateways are interchangeable.

## Double-slash trap

`cids[]` from the Kleros gateway already includes the `/ipfs/` prefix (e.g. `/ipfs/QmXXX...`). Build CDN display URLs as:

```text
"https://cdn.kleros.link" + cid      ✓
"https://cdn.kleros.link/ipfs/" + cid  ✗  (double-slash)
```

Alternatively, use the `urls[]` field from the API response directly — it contains fully-formed URLs with no construction needed.

## Image guidance

- Prefer PNG
- Token logos: at least 128×128 pixels, ideally square
- CDN visual proof: screenshot must show the exact domain/subdomain page with address context visible — not just the image in isolation

## Agent autonomy note

Agents may use any IPFS mechanism. The `kleros-ipfs-upload` skill is the recommended path for Kleros-ecosystem artifacts where long-term availability matters — but it is not required. Use Pinata, The Graph node, or any other pinning provider when appropriate.
