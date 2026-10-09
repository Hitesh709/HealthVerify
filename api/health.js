export default function handler(_req, res) {
  const providerConfigured = Boolean(
    process.env.LIVE_VERIFICATION_URL && process.env.LIVE_VERIFICATION_API_KEY
  );

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    status: 'ok',
    service: 'HealthVerify',
    mode: providerConfigured ? 'provider-configured' : 'demo-only'
  });
}
