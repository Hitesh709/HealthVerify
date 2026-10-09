# Meon production API onboarding

**Current integration status: BLOCKED — awaiting provider access and the approved production contract.**

HealthVerify must not represent a policy as active, expired, or valid based on a fabricated sample or an undocumented API. The live endpoint intentionally returns HTTP 503 while onboarding is pending and sends no policyholder data to an external provider.

## Provider being evaluated

- Product page: https://meon.co.in/insurance-verification-api
- Developer documentation: https://developer.meon.co.in/new/products/Insurance%20Fetch
- Contact: sales@meon.co.in
- Phone published by Meon: +91-9205969093

Meon publicly advertises an Insurance Verification API. Its separate Insurance Policy Fetch documentation describes a consent-based flow involving access tokens, a consent link, and fetching policy data. These are different workflows. Do not assume policy-number-only verification, supported insurers, API paths, authentication, request method, or response fields until Meon confirms them in the production documentation for our account.

## Email/request checklist

Ask Meon to confirm in writing:

1. Does its production product verify **Indian health/mediclaim policies**, rather than motor policies, agent identities, document OCR, or policy-number formatting?
2. Can it query authoritative insurer/TPA records from policy number alone? If not, what minimum fields and customer-authorisation flow are required?
3. Which insurers and TPAs are supported today, and how is an unsupported insurer represented?
4. What exactly do the returned states mean: verified, active, expired, cancelled, not found, unavailable, or inconclusive?
5. Provide production API reference and sandbox docs, including base URL, HTTP method, endpoint, authentication, headers, request/response JSON, error codes, rate limits, timeout guidance, and versioning.
6. Provide sandbox credentials and test cases for active, expired, not-found, insurer-unsupported, timeout, and ambiguous records.
7. Explain consent capture, permitted purpose, data retention/deletion, audit logs, subprocessors, security controls, contractual terms, and any required customer notices.
8. Confirm price per check, minimum commitment, rate limits, SLA, support/escalation, and production activation requirements.

## Email draft

**Subject:** HealthVerify — request for production Indian health policy verification API

Hello Meon Team,

We are building HealthVerify, an Indian health-insurance policy verification application. We would like to evaluate your Insurance Verification API for production use.

Could you confirm whether the product can verify real Indian health/mediclaim policy status against authoritative insurer or TPA records using a policy number? Please share the current supported insurer list, required inputs and consent flow, production API documentation, sandbox access, sample responses and error codes, commercial terms, security/data-protection requirements, and onboarding steps.

Please distinguish policy status verification from document extraction, policy-number format validation, and consent-based policy retrieval. We will not enable production checks until the API contract, supported coverage, data permissions, and response semantics are documented and tested.

Our app is deployed on Vercel and uses server-side API functions. We will keep credentials in server environment variables and will not expose them in client code.

Regards,  
HealthVerify Development Team

## Implementation gate

Only implement the provider adapter after receiving the approved API contract and test credentials. Then:

1. Store credentials as Vercel server-side environment variables only.
2. Implement the exact documented request and authentication flow; do not guess a generic Bearer-token POST.
3. Map only documented provider fields and statuses. An unknown or malformed response must become **Unable to verify**, never Active.
4. Test documented sandbox cases, including timeouts, HTTP errors, invalid credentials, unsupported insurers, and no-match responses.
5. Confirm customer consent and permitted purpose before sending any policy data.
6. Deploy to preview, run tests, and enable production only after provider approval.

## Vercel environment variables

Do not add any production endpoint or key yet. After access is approved, add the exact variables required by the documented adapter in Vercel Project Settings → Environment Variables. Never commit real secrets, place them in `VITE_*` variables, or paste them into issues or chat.

## Current behavior

- Demo mode uses fictional records and is explicitly labelled.
- Live mode returns `503 LIVE_PROVIDER_ONBOARDING_PENDING`.
- No live policy lookup is attempted until a documented adapter replaces this guard.
