# HealthVerify

HealthVerify is a responsive mediclaim policy verification interface for India. It provides a clear policy lookup flow, a demo mode using fictional sample records, and a server-side adapter point for an authorised insurer/TPA verification API.

## Features

- Responsive, animated healthcare-focused interface
- Policy number lookup with insurer selection
- Clearly labelled demo and live modes
- Fictional active/expired demo records (never presented as real insurer data)
- Policy status, coverage, plan dates, cashless information and claims panels
- Consent confirmation, server-side validation, rate limiting and security headers
- Live API credentials remain on the server, never in frontend code
- Provider adapter maps a connected insurer/TPA response into a stable UI response shape

## Run locally

Requires Node.js 20 or later.

```bash
npm install
cp .env.example .env
npm run dev
```

The Vite frontend runs on port 5173 and the API server on port 3000. For a production-style local build:

```bash
npm run build
npm start
```

## Demo mode

Use the sample buttons in the app:
- `HV-DEMO-2026` — fictional active sample
- `HV-EXPIRED-2024` — fictional expired sample

Any other number returns an explicitly labelled “Unable to verify (demo)” result. This is not a real policy lookup and does not indicate whether a real policy is valid.

## Configure live verification

Live mode is intentionally disabled until you have a legitimate, authorised insurer or TPA integration. There is no single public universal API that can validate every Indian health policy from only a policy number.

Set the following environment variables on the **server only**:

```env
LIVE_VERIFICATION_URL=https://your-authorised-provider.example/verification
LIVE_VERIFICATION_API_KEY=replace-with-secret
PORT=3000
```

The server sends a POST request with `policyNumber`, `insurer`, and `consent` to the configured endpoint using a Bearer token. Adapt `normaliseProviderResponse()` in `server.js` to the exact schema and authentication method provided by your insurer/TPA/NHCX implementation. Never commit real API keys or expose them through `VITE_*` variables. Do not enable live mode until access, consent, data-processing obligations and provider response semantics have been validated.

Cashless eligibility depends on insurer/TPA rules, network-hospital status, policy terms and pre-authorisation. Claim data is shown only if the configured source returns it.

## API

- `GET /api/health` — service health and configured mode (does not reveal secrets)
- `POST /api/verify` — body: `{ "policyNumber": "...", "insurer": "...", "consent": true, "mode": "demo" | "live" }`

## Important limitations

HealthVerify is not an insurer, TPA, broker or government service. Demo results are fictional. A response from a configured provider is not a guarantee of claim approval or cashless admission. Confirm coverage, exclusions, waiting periods, network status and claim decisions with the insurer. Do not submit Aadhaar numbers, OTPs or medical records to the demo app.

## Deployment

Deploy the Node server and built frontend to a host that supports a persistent Node.js process and environment secrets. Configure the provider URL and secret in the host's secret manager. Static-only hosting is not enough for the live verification API.
