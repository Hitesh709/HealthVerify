const demoRecords = {
  'HV-DEMO-2026': {
    insurer: 'HealthVerify Demo Insurer',
    status: 'Active (demo)',
    coverage: '₹5,00,000',
    plan: 'Family Floater Plus',
    startDate: '01 Apr 2026',
    endDate: '31 Mar 2027',
    cashless: 'Subject to hospital and pre-authorisation',
    claim: 'No live claim data — demo record'
  },
  'HV-EXPIRED-2024': {
    insurer: 'HealthVerify Demo Insurer',
    status: 'Expired (demo)',
    coverage: '₹3,00,000',
    plan: 'Individual Secure',
    startDate: '01 Apr 2023',
    endDate: '31 Mar 2024',
    cashless: 'Not eligible on this demo record',
    claim: 'No live claim data — demo record'
  }
};

function normaliseProviderResponse(body, requestedNumber) {
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

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST to verify a policy.' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const policyNumber = typeof body.policyNumber === 'string' ? body.policyNumber.trim() : '';
  const insurer = typeof body.insurer === 'string' ? body.insurer.slice(0, 100) : 'Auto-detect insurer';
  const mode = body.mode === 'live' ? 'live' : 'demo';

  if (policyNumber.length < 5 || policyNumber.length > 80 || !/^[a-zA-Z0-9\-/_. ]+$/.test(policyNumber)) {
    return res.status(400).json({ error: 'Enter a valid policy number (5–80 letters, numbers or common separators).' });
  }
  if (body.consent !== true) {
    return res.status(400).json({ error: 'Please confirm that you are authorised to check this policy.' });
  }

  if (mode === 'live') {
    if (!process.env.LIVE_VERIFICATION_URL || !process.env.LIVE_VERIFICATION_API_KEY) {
      return res.status(503).json({
        error: 'Live verification is not connected yet. Add credentials for an authorised insurer or TPA API in Vercel Project Settings → Environment Variables. Demo mode only uses fictional sample records.'
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
        return res.status(502).json({
          error: 'The configured insurer/TPA provider could not verify this request. Contact the insurer or TPA for confirmation.'
        });
      }

      const providerBody = await response.json();
      return res.status(200).json(normaliseProviderResponse(providerBody, policyNumber));
    } catch {
      return res.status(502).json({
        error: 'The verification provider could not be reached or returned an unreadable response. Please try again later or contact the insurer.'
      });
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

  return res.status(200).json({
    mode: 'demo',
    source: 'Fictional HealthVerify sample data',
    checkedAt: new Date().toISOString(),
    message: sample
      ? 'This is a fictional sample record, not an actual insurer lookup.'
      : 'No matching demo record. This does not indicate whether a real policy is valid.',
    policy
  });
}
