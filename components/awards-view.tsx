import { awardsAverage, isPublished, type AwardsDocument } from "@/lib/awards";

export function AwardsView({ document, preview = false }: { document: AwardsDocument; preview?: boolean }) {
  const pepResults = document.pepResults.filter(isPublished);
  const assessments = document.assessments.filter(isPublished);
  const awards = document.awards.filter(isPublished);
  const average = awardsAverage(pepResults.map((row) => row.result));
  return (
    <article className="awards-page">
      {preview ? <p className="awards-kicker">Public page preview</p> : null}
      <h1>{document.title || "Awards and Achievements"}</h1>
      {document.introduction ? <p className="awards-intro">{document.introduction}</p> : null}
      {pepResults.length > 0 ? (
        <section className="awards-panel">
          <header className="awards-band">
            <h2>Preparatory Division – PEP Results</h2>
          </header>
          <ul className="awards-results">
            {pepResults.map((row, index) => (
              <li key={row.id} style={{ animationDelay: `${index * 60}ms` }}>
                <span>PEP Results {row.year}</span>
                <strong>{row.result}%</strong>
              </li>
            ))}
          </ul>
          {average ? (
            <p className="awards-average">
              Average across {average.count} listed {average.count === 1 ? "year" : "years"}
              <strong>{average.percent}%</strong>
            </p>
          ) : null}
        </section>
      ) : null}
      {assessments.length > 0 ? (
        <section className="awards-panel">
          <header className="awards-band">
            <h2>Grade Diagnostic and Performance Tasks</h2>
          </header>
          <div className="awards-tasks">
            {assessments.map((row, index) => (
              <article key={row.id} style={{ animationDelay: `${index * 70}ms` }}>
                <div>
                  <h3>
                    {row.grade}
                    {row.academicYear ? <span>{row.academicYear}</span> : null}
                  </h3>
                  <p>
                    {row.name}
                    {row.subjects ? ` — ${row.subjects}` : ""}
                  </p>
                </div>
                <strong>{row.result}%</strong>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {awards.length > 0 ? (
        <section className="awards-panel">
          <header className="awards-band">
            <h2>Awards and Recognition</h2>
          </header>
          <div className="awards-honours">
            {awards.map((row, index) => (
              <article key={row.id} style={{ animationDelay: `${index * 70}ms` }}>
                <p>{row.category}<span>{row.year}</span></p>
                <h3>{row.title}</h3>
                {row.details ? <p>{row.details}</p> : null}
                {row.body ? <p className="awards-body">{row.body}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
