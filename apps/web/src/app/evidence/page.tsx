import Link from 'next/link';
import '../glasshouse/glasshouse.css';

export const metadata = { title: 'Capabilities and evidence | Hourglass Command' };
const capabilities = [
  [
    'Decision integrity',
    'One deterministic transition kernel; explicit posture, treatments, scope, authority and action lifecycle.',
    'Automated semantic tests, full-state replay tests and 1,000-seed branch sweep.',
  ],
  [
    'Evidence',
    'Source, observation and receipt times, corrections, authorized actor knowledge and immutable decision snapshots.',
    'Known-then and correction fixtures. Interpretive reasoning remains for human review.',
  ],
  [
    'Recovery',
    'Transactional local journal, writer lease, explicit takeover, validated backups and corruption quarantine.',
    'Automated IndexedDB tests including aborted writes, stale saves and two tabs. Legacy records are preserved as read-only evidence.',
  ],
  [
    'Review',
    'Eight observable dimensions, complete event trace, same-seed alternative, HTML, JSON and text PDF.',
    'Process and modeled outcomes are separate. No global leadership grade. PDF tagging is not claimed; HTML is the accessible alternative.',
  ],
  [
    'Access',
    'Account-free local play, pausable time, transcripts, keyboard controls, complete schematic and optional 3D.',
    'Automated browser checks supplement pending manual NVDA, VoiceOver/Safari, device and accessibility reviews.',
  ],
  [
    'Learning impact',
    'A repeatable exercise and reflection mechanism.',
    'Independent rubric calibration, formative studies and learning transfer have not been established.',
  ],
];
export default function EvidencePage(): JSX.Element {
  return (
    <main className="gh-app">
      <div style={{ maxWidth: 980, margin: 'auto', padding: '3rem 1.25rem' }}>
        <Link className="gh-text-button" href="/">
          ← Back to Hourglass
        </Link>
        <p className="gh-eyebrow" style={{ marginTop: '2rem' }}>
          Capabilities and evidence
        </p>
        <h1 style={{ fontSize: 'clamp(2rem,5vw,3.6rem)', margin: '1rem 0' }}>
          Practice you can inspect.
        </h1>
        <p className="gh-lede">
          Glasshouse is a synthetic educational exercise. This engineering candidate has not passed
          independent public-release qualification.
        </p>
        <p style={{ margin: '1.5rem 0' }}>
          Shannon Brown directs the product. Implementation and automated review are AI-assisted. No
          employer deployment, agency endorsement, certification, real loss savings or improved
          professional performance is claimed.
        </p>
        <div className="gh-table-scroll">
          <table>
            <caption>Current capability and evidence boundaries</caption>
            <thead>
              <tr>
                <th>Area</th>
                <th>Implemented mechanism</th>
                <th>Evidence and limitation</th>
              </tr>
            </thead>
            <tbody>
              {capabilities.map(([area, mechanism, evidence]) => (
                <tr key={area}>
                  <th>{area}</th>
                  <td>{mechanism}</td>
                  <td>{evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <section className="gh-panel" style={{ marginTop: '2rem' }}>
          <h2>How to interpret feedback</h2>
          <p>
            Structured rules can check whether evidence existed, approval was recorded, a control
            completed and a review condition was retained. They cannot establish the quality of
            free-form reasoning. “Not observed” is different from an observed omission. A good
            outcome cannot make a weak process sound.
          </p>
          <p>
            The monetary ledger uses one synthetic exposure and one declared horizon. Avoided loss
            minus incremental treatment cost equals net modeled benefit. Zero-cost ROI is not
            applicable. Neither money nor completed practice establishes competence.
          </p>
        </section>
        <section className="gh-panel" style={{ marginTop: '1rem' }}>
          <h2>Local data and synthetic boundaries</h2>
          <p>
            The flagship sends no decisions or microphone data to a service. It needs no account,
            analytics, cloud model, microphone or paid backend. Settings provide backup and deletion
            of Glasshouse data only. Shared-origin browser storage is not isolation from neighboring
            portfolio applications; use fictional, minimal notes.
          </p>
          <p>
            Client-side world data and unsigned records can be inspected or changed. Import replay
            checks and digests help detect accidents; they are not proof of authorship or tamper
            resistance.
          </p>
        </section>
        <section className="gh-panel" style={{ marginTop: '1rem' }}>
          <h2>Qualification still required</h2>
          <p>
            Three independent domain and exercise reviewers must calibrate the content and rubric.
            Ten formative participants must test entry, comprehension, replay and accessible
            completion. Named physical devices, assistive technologies, motion/audio states, offline
            failure recovery and a public rollback rehearsal require recorded evidence before G2
            promotion.
          </p>
          <p>
            Additional cases, facilitated sessions, networking, enterprise controls and AI expansion
            remain gated by the PRD. A later learning study would need separate consent and
            authorization.
          </p>
        </section>
        <p style={{ marginTop: '2rem' }}>
          <a href="https://github.com/swb2019/gsoc-decision-ops">Source and release history</a> ·{' '}
          <Link href="/legacy">Preserved legacy scenarios</Link> ·{' '}
          <a href="https://swb2019.github.io/shannon-brown-career/">Shannon Brown</a>
        </p>
      </div>
    </main>
  );
}
