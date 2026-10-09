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
  const root = body?.result || body?.response || body;
  const policy = root?.policy || root?.data?.policy || root?.data || root;
  const rawStatus = policy?.policy_status || policy?.policyStatus || policy?.status || root?.policy_status || root?.policyStatus || root?.status;
  const statusText = typeof rawStatus === 'string' ? rawStatus.trim() : '';
  const verifiedFlag = typeof root?.verified === 'boolean'
    ? root.verified
    : typeof root?.is_valid === 'boolean'
      ? root.is_valid
      : typeof policy?.verified === 'boolean'
        ? policy.verified
        : typeof policy?.is_valid === 'boolean'
          ? policy.is_valid
          : null;

  const recognizedStatuses = new Set([
    'active', 'in force', 'expired', 'lapsed', 'cancelled', 'canceled',
    'inactive', 'terminated', 'suspended', 'pending', 'not found',
    'invalid', 'not verified', 'verified', 'unable to verify'
  ]);
  const hasRecognizedStatus = statusText && recognizedStatuses.has(statusText.toLowerCase());
  if (verifiedFlag === null && !hasRecognizedStatus) {
    return null;
  }

  const returnedPolicyNumber = policy?.policyNumber || policy?.policy_number || policy?.policyNo || null;
  const verified = verifiedFlag === true || (hasRecognizedStatus && ['active', 'in force', 'verified'].includes(statusText.toLowerCase()));
  const normalizedStatus = statusText || (verifiedFlag === true
    ? 'Verified — policy status not provided'
    : 'Not verified by provider');

  return {
    mode: 'live',
    verificationOutcome: verifiedFlag === false || ['not found', 'invalid', 'not verified'].includes(normalizedStatus.toLowerCase())
      ? 'not_verified'
      : (hasRecognizedStatus || verifiedFlag !== null ? 'provider_response' : 'inconclusive'),
    source: root?.source || root?.provider || process.env.LIVE_VERIFICATION_PROVIDER_NAME || 'Configured verification provider',
    checkedAt: new Date().toISOString(),
    message: root?.message || undefined,
    policy: {
      // Never substitute the user's input as if the provider matched it.
      policyNumber: returnedPolicyNumber ? String(returnedPolicyNumber) : null,
      insurer: policy?.insurer || policy?.insurerName || policy?.insurance_company || policy?.payerName || null,
      status: normalizedStatus,
      coverage: policy?.coverage || policy?.sumInsured || policy?.sum_insured || policy?.sum_insured_amount || null,
      plan: policy?.plan || policy?.planName || policy?.product_name || null,
      startDate: policy?.startDate || policy?.policyStartDate || policy?.policy_start_date || null,
      endDate: policy?.endDate || policy?.policyEndDate || policy?.policy_end_date || null,
      cashless: policy?.cashless || policy?.cashlessEligibility || policy?.cashless_eligibility || 'Not provided by the connected source.',
      claim: policy?.claim || policy?.claimStatus || policy?.claim_status || 'Not provided by the connected source.'
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
    // Intentionally fail closed while provider access and the production API contract are pending.
    // Do not send policyholder data to an assumed endpoint or infer a status from an undocumented schema.
    return res.status(503).json({
      error: 'Live verification is not enabled yet. HealthVerify is awaiting the provider’s approved production API documentation and credentials. No policy data was sent to an external provider. Please use Demo mode for sample records or contact the insurer directly for live confirmation.',
      code: 'LIVE_PROVIDER_ONBOARDING_PENDING',
      mode: 'live'
    });
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
