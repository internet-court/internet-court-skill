# Risk Domain Detection

`onchainos security dapp-scan` — DApp / URL phishing and security detection. Chain-agnostic.

## Parameters

| Parameter | Required | Description |
|---|---|---|
| `--domain` | Yes | Full URL or domain name |

## Usage

```bash
onchainos security dapp-scan --domain "https://some-dapp.xyz"
```

## Return Fields

| Field | Type | Description |
|---|---|---|
| `isMalicious` | Boolean | Whether the URL/domain is malicious |

## Result Interpretation

| Field | Value | Agent Behavior |
|---|---|---|
| `isMalicious` | `false` | Safe. User can proceed with DApp interaction. |
| `isMalicious` | `true` | Do NOT access. Return risk warning immediately. |

## Suggest Next Steps

| Result | Suggest |
|---|---|
| Safe (`isMalicious: false`) | Safe to proceed with DApp interaction. |
| Risky (`isMalicious: true`) | Warn user. Do NOT access the site. |

## Examples

**User says:** "Check if this DApp URL is safe"

```bash
onchainos security dapp-scan --domain "https://suspicious-defi.xyz"
# -> Display:
#   URL: https://suspicious-defi.xyz
#   Result: MALICIOUS
#   Recommendation: Do NOT access this site. It has been flagged as a phishing/scam domain.
```

## Workflow: DApp Safety Check

> User: "Is this DApp safe to use?"

```
1. onchainos security dapp-scan --domain "https://some-dapp.xyz"
       -> check phishing / blacklisted
2. Display safety assessment
```
