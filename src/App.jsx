import { useMemo, useState } from 'react';

const insurers = [
  'Auto-detect insurer', 'Star Health', 'HDFC ERGO', 'ICICI Lombard',
  'Niva Bupa', 'Care Health Insurance', 'Aditya Birla Health', 'New India Assurance', 'Other / Not listed'
];

const demoPolicies = {
  'HV-DEMO-2026': {
    insurer: 'HealthVerify Demo Insurer',
    status: 'Active (demo)',
    coverage: '₹5,00,000',
    plan: 'Family Floater Plus',
    startDate: '01 Apr 2026',
    endDate: '31 Mar 2027',
    cashless: 'Subject to hospital and pre-authorisation',
    claim: 'No live claim data — demo record',
    member: 'Demo Member',
  },
  'HV-EXPIRED-2024': {
    insurer: 'HealthVerify Demo Insurer',
    status: 'Expired (demo)',
    coverage: '₹3,00,000',
    plan: 'Individual Secure',
    startDate: '01 Apr 2023',
    endDate: '31 Mar 2024',
    cashless: 'Not eligible on this demo record',
    claim: 'No live claim data — demo record',
    member: 'Demo Member',
  }
};

function Icon({ name, size = 20 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    heart: <><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></>,
    arrow: <><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    building: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 21V9h6v12M7 7h.01M17 7h.01M7 12h.01M17 12h.01"/></>,
    arrowUp: <><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></>
  };
  return <svg {...common}>{paths[name] || paths.shield}</svg>;
}

function Brand() {
  return <a className="brand" href="#" aria-label="HealthVerify home"><span className="brand-mark"><Icon name="shield" size={23}/></span><span>Health<span className="brand-light">Verify</span><small>HEALTH COVER, MADE CLEAR</small></span></a>;
}

function StatusPill({ status }) {
  const active = /active/i.test(status);
  const expired = /expired/i.test(status);
  return <span className={`status-pill ${active ? 'is-active' : expired ? 'is-expired' : 'is-unknown'}`}><span className="status-dot"/>{status}</span>;
}

export default function App() {
  const [policyNumber, setPolicyNumber] = useState('');
  const [insurer, setInsurer] = useState(insurers[0]);
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('demo');
  const [activeTab, setActiveTab] = useState('overview');

  const canSubmit = policyNumber.trim().length >= 5 && consent && !loading;
  const resultIsDemo = result?.mode !== 'live';

  async function verifyPolicy(event) {
    event.preventDefault();
    if (!canSubmit) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyNumber: policyNumber.trim(), insurer, consent, mode })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to process this request.');
      setResult(data);
      setActiveTab('overview');
    } catch (err) {
      setError(err.message || 'Could not reach the verification service. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function useSample(value) {
    setPolicyNumber(value);
    setMode('demo');
    setResult(null);
    setError('');
    document.getElementById('policy-number')?.focus();
  }

  const resultStatus = useMemo(() => result?.policy?.status || 'Unable to verify', [result]);

  return <div className="app-shell">
    <div className="announcement"><span className="announcement-dot"/> Policy checks, made simpler <span className="announcement-divider">·</span> <span>Demo mode is clearly labelled</span></div>
    <header className="topbar">
      <Brand/>
      <nav className="nav-links" aria-label="Main navigation">
        <a href="#how-it-works">How it works</a><a href="#privacy">Privacy</a><a className="nav-cta" href="#verify">Verify a policy <Icon name="arrow" size={16}/></a>
      </nav>
    </header>

    <main>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line"/> HEALTH INSURANCE CLARITY</div>
          <h1>Your health cover.<br/><span>Clear as it should be.</span></h1>
          <p className="hero-text">Check a mediclaim policy number, understand the coverage, and see what still needs confirmation — all in one calm, secure place.</p>
          <div className="hero-proof"><span className="proof-icon"><Icon name="shield" size={18}/></span><span><strong>Privacy-first by design</strong><small>We only send the details needed for the check.</small></span></div>
          <div className="hero-stats">
            <div><strong>01</strong><span>Enter policy</span></div><i/><div><strong>02</strong><span>Check details</span></div><i/><div><strong>03</strong><span>Know next steps</span></div>
          </div>
        </div>
        <div className="hero-art" aria-label="Illustration of a secure health insurance record">
          <div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/>
          <div className="art-spark spark-one">✳</div><div className="art-spark spark-two">✦</div>
          <div className="art-card card-back"><div className="back-lines"><i/><i/><i/></div><span className="back-stamp"><Icon name="check" size={15}/> VERIFIED FLOW</span></div>
          <div className="art-card main-art-card">
            <div className="art-card-top"><span className="mini-shield"><Icon name="heart" size={20}/></span><span className="art-tag">HEALTH COVER</span><span className="art-menu">•••</span></div>
            <div className="art-title">Policy overview</div><div className="art-subtitle">Your information, at a glance</div>
            <div className="art-coverage"><span>Sum insured</span><strong>₹5,00,000</strong><div className="coverage-track"><i/></div><small>Illustrative sample only</small></div>
            <div className="art-row"><span><i className="tiny-check"><Icon name="check" size={11}/></i> Policy details</span><b>Ready to review</b></div>
            <div className="art-row"><span><i className="tiny-check"><Icon name="check" size={11}/></i> Coverage summary</span><b>At a glance</b></div>
          </div>
          <div className="floating-note"><span className="floating-icon"><Icon name="lock" size={18}/></span><span><strong>Secure by design</strong><small>Demo data stays demo data</small></span></div>
          <div className="art-caption">A clearer view of your cover <span>✳</span></div>
        </div>
      </section>

      <section className="verification-section" id="verify">
        <div className="section-heading">
          <div><div className="eyebrow"><span className="eyebrow-line"/> POLICY LOOKUP</div><h2>Let’s check your policy.</h2><p>Start with the policy number. We’ll show what can be verified.</p></div>
          <div className="secure-label"><Icon name="lock" size={16}/> Protected lookup</div>
        </div>
        <div className="lookup-layout">
          <form className="lookup-card" onSubmit={verifyPolicy}>
            <div className="card-step"><span>01</span><span>POLICY DETAILS</span></div>
            <label htmlFor="policy-number">Policy number</label>
            <div className="input-wrap"><Icon name="file" size={19}/><input id="policy-number" value={policyNumber} onChange={e => setPolicyNumber(e.target.value)} placeholder="Enter policy number" autoComplete="off" minLength={5} maxLength={80} required/><button type="button" className="clear-input" aria-label="Clear policy number" onClick={() => setPolicyNumber('')} disabled={!policyNumber}>×</button></div>
            <p className="field-hint">Enter the number exactly as shown on your policy document.</p>
            <label htmlFor="insurer">Insurance company <span className="optional">(if known)</span></label>
            <div className="select-wrap"><Icon name="building" size={19}/><select id="insurer" value={insurer} onChange={e => setInsurer(e.target.value)}>{insurers.map(item => <option key={item}>{item}</option>)}</select><span className="select-chevron">⌄</span></div>
            <div className="mode-control">
              <div><strong>Verification mode</strong><small>Live results require an authorised insurer / TPA connection.</small></div>
              <div className="mode-toggle" role="group" aria-label="Verification mode"><button type="button" className={mode === 'demo' ? 'selected' : ''} onClick={() => {setMode('demo');setResult(null);}}>Demo</button><button type="button" className={mode === 'live' ? 'selected' : ''} onClick={() => {setMode('live');setResult(null);}}>Live</button></div>
            </div>
            <label className="consent-row"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}/><span>I’m authorised to check this policy and consent to the submitted details being processed for verification.</span></label>
            {error && <div className="error-message" role="alert">{error}</div>}
            <button className="primary-button" type="submit" disabled={!canSubmit}>{loading ? <><span className="spinner"/> Checking policy…</> : <>Check policy <Icon name="arrow" size={18}/></>}</button>
            <div className="form-footer"><Icon name="lock" size={14}/> Your policy number is sent securely to this service.</div>
          </form>
          <aside className="lookup-aside">
            <div className="aside-top"><span className="aside-icon"><Icon name="shield" size={21}/></span><div><strong>What can you check?</strong><p>Get a clearer view of the details that matter.</p></div></div>
            <ul className="feature-list"><li><span><Icon name="check" size={15}/></span><div><strong>Policy status</strong><small>Active, expired or not confirmed</small></div></li><li><span><Icon name="check" size={15}/></span><div><strong>Coverage & benefits</strong><small>Sum insured and plan overview</small></div></li><li><span><Icon name="check" size={15}/></span><div><strong>Cashless eligibility</strong><small>Subject to insurer and hospital approval</small></div></li><li><span><Icon name="check" size={15}/></span><div><strong>Claims information</strong><small>Only when the connected source provides it</small></div></li></ul>
            <div className="sample-box"><div className="sample-heading"><span>TRY A SAMPLE</span><span className="demo-badge">DEMO ONLY</span></div><p>Explore the interface with fictional records. No insurer is contacted.</p><button type="button" onClick={() => useSample('HV-DEMO-2026')}>Active sample <Icon name="arrow" size={15}/></button><button type="button" className="sample-secondary" onClick={() => useSample('HV-EXPIRED-2024')}>Expired sample <Icon name="arrow" size={15}/></button></div>
          </aside>
        </div>
      </section>

      {result && <section className="result-section" aria-live="polite">
        <div className="result-header"><div><div className="eyebrow"><span className="eyebrow-line"/> LOOKUP RESULT</div><h2>Policy overview</h2></div><span className={`result-mode ${resultIsDemo ? 'demo' : 'live'}`}>{resultIsDemo ? 'DEMO RESULT · NOT LIVE' : 'LIVE SOURCE RESPONSE'}</span></div>
        {resultIsDemo && <div className="demo-warning"><Icon name="shield" size={18}/><span><strong>Illustrative result only.</strong> This is not confirmation of real insurance coverage, cashless eligibility or claim status.</span></div>}
        {result.mode === 'live' && <div className="live-warning"><Icon name="check" size={18}/><span>Response received from the configured provider. Confirm benefit wording with the insurer before treatment.</span></div>}
        <div className="result-card">
          <div className="result-summary"><div className="result-insurer-icon"><Icon name="building" size={25}/></div><div className="result-insurer"><small>INSURANCE PROVIDER</small><h3>{result.policy.insurer || 'Not identified'}</h3><span>Policy number · {result.policy.policyNumber || policyNumber}</span></div><StatusPill status={resultStatus}/></div>
          <div className="result-tabs" role="tablist"><button role="tab" aria-selected={activeTab === 'overview'} className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Overview</button><button role="tab" aria-selected={activeTab === 'cashless'} className={activeTab === 'cashless' ? 'active' : ''} onClick={() => setActiveTab('cashless')}>Cashless</button><button role="tab" aria-selected={activeTab === 'claims'} className={activeTab === 'claims' ? 'active' : ''} onClick={() => setActiveTab('claims')}>Claims</button></div>
          {activeTab === 'overview' && <div className="result-grid"><div><small>SUM INSURED</small><strong>{result.policy.coverage || 'Not provided'}</strong></div><div><small>PLAN NAME</small><strong>{result.policy.plan || 'Not provided'}</strong></div><div><small>POLICY START</small><strong>{result.policy.startDate || 'Not provided'}</strong></div><div><small>POLICY END</small><strong>{result.policy.endDate || 'Not provided'}</strong></div></div>}
          {activeTab === 'cashless' && <div className="tab-content"><span className="tab-icon"><Icon name="heart" size={20}/></span><div><strong>Cashless eligibility</strong><p>{result.policy.cashless || 'Not provided by the connected source.'}</p><small>Cashless admission is always subject to network hospital status, policy terms and pre-authorisation.</small></div></div>}
          {activeTab === 'claims' && <div className="tab-content"><span className="tab-icon"><Icon name="file" size={20}/></span><div><strong>Claims information</strong><p>{result.policy.claim || 'No claim status was provided by the connected source.'}</p><small>For definitive claim updates, contact the insurer or TPA using the official reference number.</small></div></div>}
          {result.message && <p className="provider-message">{result.message}</p>}
          <div className="result-foot"><Icon name="clock" size={15}/> Checked {new Date(result.checkedAt).toLocaleString('en-IN')} <span>•</span> Source: {result.source || 'HealthVerify'}</div>
        </div>
      </section>}

      <section className="how-section" id="how-it-works">
        <div className="how-intro"><div className="eyebrow"><span className="eyebrow-line"/> SIMPLE BY DESIGN</div><h2>Less uncertainty.<br/><span>More understanding.</span></h2><p>Health insurance can be complicated. Your first step shouldn’t be.</p></div>
        <div className="steps"><article className="step-card"><span className="step-number">01</span><div className="step-icon"><Icon name="file" size={23}/></div><h3>Enter your details</h3><p>Use your policy number and select the insurer if you know it.</p></article><article className="step-card"><span className="step-number">02</span><div className="step-icon"><Icon name="search" size={23}/></div><h3>Check the record</h3><p>Review demo information or a response from an authorised live connection.</p></article><article className="step-card"><span className="step-number">03</span><div className="step-icon"><Icon name="heart" size={23}/></div><h3>Know what’s next</h3><p>Understand what’s available and what needs insurer confirmation.</p></article></div>
      </section>

      <section className="privacy-section" id="privacy"><div className="privacy-icon"><Icon name="lock" size={25}/></div><div><div className="eyebrow"><span className="eyebrow-line"/> YOUR INFORMATION MATTERS</div><h2>Trust starts with transparency.</h2><p>HealthVerify never presents sample data as a real insurer response. Live verification is only possible after a secure, authorised provider connection is configured. Avoid sharing Aadhaar, OTPs or medical documents unless the official verification process specifically requires them.</p></div><div className="privacy-stamp"><Icon name="shield" size={21}/><span>Privacy<br/>by design</span></div></section>
      <section className="bottom-cta"><div><span className="bottom-cta-icon"><Icon name="heart" size={23}/></span><div><h2>Make your next step a confident one.</h2><p>Start with your policy number. Confirm important details with your insurer.</p></div></div><a href="#verify" className="primary-button">Verify a policy <Icon name="arrow" size={18}/></a></section>
    </main>

    <footer className="footer"><Brand/><div className="footer-note">HealthVerify is a policy information interface, not an insurer or TPA. <br/>Policy terms, hospital network and final claim decisions are determined by the insurer.</div><div className="footer-bottom"><span>© {new Date().getFullYear()} HealthVerify</span><span>Built for clarity. Designed for trust.</span><a href="#privacy">Privacy & limitations ↑</a></div></footer>
  </div>;
}
