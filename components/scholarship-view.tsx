import { departmentLabel, type ScholarshipRecord } from "@/lib/scholarships";

export function ScholarshipView({ records, preview = false }: { records: ScholarshipRecord[]; preview?: boolean }) {
  const published = records.filter((record) => record.published).sort((left, right) => right.year - left.year || left.studentName.localeCompare(right.studentName));
  return (
    <article className="scholarship-page">
      {preview ? null : <h1>Scholarship Awarded</h1>}
      {published.length === 0 ? <p className="scholarship-empty">No scholarships have been published yet.</p> : (
        published.map((record, index) => (
          <section className="awards-panel" key={record.id} style={{ animationDelay: `${index * 60}ms` }}>
            <header className="awards-band scholarship-band">
              <p>{record.year}</p>
              <h2>{record.studentName}</h2>
              <p>{record.awardName}</p>
            </header>
            <div className="scholarship-copy">
              <p>
                {departmentLabel(record.department)}
                {record.grade ? ` · ${record.grade}` : ""}
                {record.organization ? ` · ${record.organization}` : ""}
              </p>
              {record.details ? <p>{record.details}</p> : null}
            </div>
          </section>
        ))
      )}
    </article>
  );
}
