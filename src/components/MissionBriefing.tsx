import reidWisemanPhoto from '../assets/crew/reid-wiseman.jpg'
import victorGloverPhoto from '../assets/crew/victor-glover.jpg'
import christinaKochPhoto from '../assets/crew/christina-koch.jpg'
import jeremyHansenPhoto from '../assets/crew/jeremy-hansen.jpg'

const CREW = [
  {
    name: 'Reid Wiseman',
    role: 'Commander',
    agency: 'NASA',
    photo: reidWisemanPhoto,
    note: 'Leads the crew and Orion operations for this test flight.',
    links: [
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/reid-wiseman-1a353819' },
      { label: 'NASA bio', href: 'https://www.nasa.gov/people/reid-wiseman/' },
    ],
  },
  {
    name: 'Victor Glover',
    role: 'Pilot',
    agency: 'NASA',
    photo: victorGloverPhoto,
    note: 'Spacecraft systems and flight operations from the cabin.',
    links: [
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/vicglover' },
      { label: 'NASA bio', href: 'https://www.nasa.gov/people/victor-j-glover/' },
    ],
  },
  {
    name: 'Christina Koch',
    role: 'Mission Specialist',
    agency: 'NASA',
    photo: christinaKochPhoto,
    note: 'Science, robotics, and exploration tasks during the lunar voyage.',
    links: [
      { label: 'NASA bio', href: 'https://www.nasa.gov/people/christina-hammock-koch/' },
    ],
  },
  {
    name: 'Jeremy Hansen',
    role: 'Mission Specialist',
    agency: 'CSA',
    photo: jeremyHansenPhoto,
    note: 'Canadian Space Agency astronaut; lunar campaign partner on Artemis.',
    links: [
      { label: 'CSA bio', href: 'https://www.asc-csa.gc.ca/eng/astronauts/canadian/active/jeremy-hansen.asp' },
    ],
  },
] as const

export function MissionBriefing() {
  return (
    <section className="panel mcc-panel briefing-panel mcc-interactive-panel">
      <div className="panel-title-row briefing-title">
        <span className="mcc-deco" aria-hidden />
        <h2>Mission briefing · Artemis II</h2>
      </div>

      <div className="briefing-grid">
        <article className="briefing-block briefing-block-interactive">
          <h3>Purpose</h3>
          <p>
            Artemis II is the first <strong>crewed</strong> flight of the Artemis program: a shakedown
            of Orion, life support, and mission operations with humans aboard in deep space, on a path
            that loops around the Moon and returns to Earth. It proves the stack that will carry
            astronauts on later landings.
          </p>
        </article>
        <article className="briefing-block briefing-block-interactive">
          <h3>Why go</h3>
          <p>
            To validate spacecraft and ground systems with crew in the cislunar environment, close the
            gap between uncrewed Artemis I and surface missions, and demonstrate international
            partnership (NASA + CSA) on the road to sustained lunar exploration and, eventually, Mars.
          </p>
        </article>
        <article className="briefing-block briefing-block-interactive">
          <h3>Duration &amp; flight profile</h3>
          <p>
            Roughly <strong>10 days</strong> from launch to splashdown: Earth orbit operations,
            translunar injection, outbound coast, lunar flyby / free-return geometry, and high-speed
            re-entry — without landing on the surface. Use{' '}
            <a href="https://www.nasa.gov/trackartemis" target="_blank" rel="noreferrer">
              AROW
            </a>{' '}
            for official mission timing and distances.
          </p>
        </article>
      </div>

      <h3 className="crew-heading">Crew · Orion</h3>
      <p className="crew-links-note muted small">
        Direct <strong>LinkedIn</strong> links are included where astronauts maintain a public profile;
        Christina Koch and Jeremy Hansen are linked to official NASA / CSA biographies.
      </p>
      <ul className="crew-list">
        {CREW.map((c) => (
          <li key={c.name} className="crew-card">
            <img className="crew-photo" src={c.photo} alt={`${c.name} official portrait`} loading="lazy" />
            <div className="crew-name">{c.name}</div>
            <div className="crew-role mono">
              {c.role} · {c.agency}
            </div>
            <p className="crew-note">{c.note}</p>
            <div className="crew-link-row">
              {c.links.map((lnk) => (
                <a
                  key={lnk.href}
                  className="crew-social-link"
                  href={lnk.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {lnk.label}
                </a>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <p className="briefing-foot muted">
        Summaries for context only — see{' '}
        <a href="https://www.nasa.gov/missions/artemis-ii/" target="_blank" rel="noreferrer">
          nasa.gov/missions/artemis-ii
        </a>{' '}
        for authoritative mission facts.
      </p>
    </section>
  )
}
