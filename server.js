import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isLiveConfigured = Boolean(process.env.LIVE_VERIFICATION_URL && process.env.LIVE_VERIFICATION_API_KEY);

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '12kb' }));
app.use('/api/', rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false }));

const demoRecords = {
  'HV-DEMO-2026': {
    insurer: 'HealthVerify Demo Insurer', status: 'Active (demo)', coverage: '₹5,00,000',
    plan: 'Family Floater Plus', startDate: '01 Apr 2026', endDate: '31 Mar 2027',
    cashless: 'Subject to hospital and pre-authorisation', claim: 'No live claim data — demo record'
  },
  'HV-EXPIRED-2024': {
    insurer: 'HealthVerify Demo Insurer', status: 'Expired (demo)', coverage: '₹3,00,000',
    plan: 'Individual Secure', startDate: '01 Apr 2023', endDate: '31 Mar 2024',
    cashless: 'Not eligible on this demo record', claim: 'No live claim data — demo record'
  }
};

function normaliseProviderResponse(body, requestedNumber) {
  // Provider-specific field mapping belongs here after the insurer/TPA contract is known.
  // Do not infer eligibility or claims data when the provider has not returned it.
  const policy = body?.policy || body?.data?.policy || body?.data || body;
  return {
    mode: 'live',
    source: body?.source || body?.provider || 'Configured verification provider',
    checkedAt: new Date().toISOString(),
    message: body?.message || undefined,
    policy: {
      policyNumber: String(policy?.policyNumber || policy?.policy_number || requestedNumber),
      insurer: policy?.insurer || policy?.insurerName || policy?.payerName || null,
      status: policy?.status || policy?.policyStatus || 'Unable to verify',
      coverage: policy?.coverage || policy?.sumInsured || policy?.sum_insured || null,
      plan: policy?.plan || policy?.planName || null,
      startDate: policy?.startDate || policy?.policyStartDate || null,
      endDate: policy?.endDate || policy?.policyEndDate || null,
      cashless: policy?.cashless || policy?.cashlessEligibility || 'Not provided by the connected source.',
      claim: policy?.claim || policy?.claimStatus || 'Not provided by the connected source.'
    }
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'HealthVerify', mode: isLiveConfigured ? 'provider-configured' : 'demo-only' });
});

app.post('/api/verify', async (req, res) => {
  const policyNumber = typeof req.body?.policyNumber === 'string' ? req.body.policyNumber.trim() : '';
  const insurer = typeof req.body?.insurer === 'string' ? req.body.insurer.slice(0, 100) : 'Auto-detect insurer';
  const mode = req.body?.mode === 'live' ? 'live' : 'demo';

  if (policyNumber.length < 5 || policyNumber.length > 80 || !/^[a-zA-Z0-9\-/_. ]+$/.test(policyNumber)) {
    return res.status(400).json({ error: 'Enter a valid policy number (5–80 letters, numbers or common separators).' });
  }
  if (req.body?.consent !== true) {
    return res.status(400).json({ error: 'Please confirm that you are authorised to check this policy.' });
  }

  if (mode === 'live') {
    if (!isLiveConfigured) {
      return res.status(503).json({
        error: 'Live verification is not connected yet. Configure an authorised insurer / TPA API in the server environment. Use Demo mode to explore sample records.'
      });
    }
    try {
      const response = await fetch(process.env.LIVE_VERIFICATION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LIVE_VERIFICATION_API_KEY}`
        },
        body: JSON.stringify({ policyNumber, insurer, consent: true }),
        signal: AbortSignal.timeout(12_000)
      });
      if (!response.ok) {
        const status = response.status === 401 || response.status === 403 ? 502 : 502;
        return res.status(status).json({ error: 'The configured provider could not verify this request. Contact the insurer or TPA for confirmation.' });
      }
      const providerBody = await response.json();
      return res.json(normaliseProviderResponse(providerBody, policyNumber));
    } catch {
      return res.status(502).json({ error: 'The verification provider could not be reached. Please try again later or contact the insurer.' });
    }
  }

  const sample = demoRecords[policyNumber.toUpperCase()];
  const policy = sample
    ? { ...sample, policyNumber: policyNumber.toUpperCase() }
    : {
        insurer: insurer === 'Auto-detect insurer' ? 'Not identified in demo mode' : insurer,
        status: 'Unable to verify (demo)',
        coverage: 'Not available',
        plan: 'No matching sample record',
        startDate: 'Not available',
        endDate: 'Not available',
        cashless: 'Cannot be confirmed in demo mode',
        claim: 'No live claim data available'
      };
  return res.json({
    mode: 'demo',
    source: 'Fictional HealthVerify sample data',
    checkedAt: new Date().toISOString(),
    message: sample ? 'This is a fictional sample record, not an actual insurer lookup.' : 'No matching demo record. This does not indicate whether a real policy is valid.',
    policy
  });
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`HealthVerify server listening on port ${PORT} (${isLiveConfigured ? 'provider configured' : 'demo-only'})`);
});
