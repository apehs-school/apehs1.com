import { admissionDepartments, departmentLabel, type AdmissionDraft, type AdmissionRecord } from "@/lib/admissions";

type PublishedAdmission = AdmissionDraft & { id: string };

export function AdmissionsView({ records, pageTitle }: { records: AdmissionRecord[]; pageTitle: string }) {
  const published: PublishedAdmission[] = records.flatMap((record) =>
    record.published && record.publishedSnapshot ? [{ id: record.id, ...record.publishedSnapshot }] : [],
  );
  if (published.length === 0) {
    return <h1 className="text-3xl font-semibold text-primary">{pageTitle}</h1>;
  }
  return (
    <div className="admission-page">
      {published.length > 1 ? <h1>{pageTitle}</h1> : null}
      {admissionDepartments.map(([id, label]) => {
        const group = published.filter((record) => record.department === id);
        if (group.length === 0) return null;
        return (
          <div key={id} className="admission-group">
            {published.length > 1 ? <h2 className="admission-group-title">{label}</h2> : null}
            {group.map((record) => (
              <article key={record.id} className="awards-panel">
                <header className="awards-band">
                  <h2>{record.title}</h2>
                </header>
                <div className="admission-copy">
                  <p className="admission-department">{departmentLabel(record.department)}</p>
                  <p>{record.introduction}</p>
                  <Eligibility draft={record} />
                  {record.documents.length > 0 ? (
                    <>
                      <h3>Required documents</h3>
                      <ul>
                        {record.documents.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </>
                  ) : null}
                  {record.steps.length > 0 ? (
                    <>
                      <h3>Enrollment steps</h3>
                      <ol>
                        {record.steps.map((step) => (
                          <li key={step.id}>
                            <strong>{step.title}</strong>
                            {step.description ? <span>{step.description}</span> : null}
                          </li>
                        ))}
                      </ol>
                    </>
                  ) : null}
                  {record.additional ? (
                    <>
                      <h3>Additional information</h3>
                      <p>{record.additional}</p>
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function Eligibility({ draft }: { draft: AdmissionDraft }) {
  const ages = draft.minAge !== null && draft.maxAge !== null
    ? `Ages ${draft.minAge} to ${draft.maxAge}`
    : draft.minAge !== null
      ? `Minimum age ${draft.minAge}`
      : draft.maxAge !== null
        ? `Maximum age ${draft.maxAge}`
        : "";
  if (!ages && !draft.gradeRange && !draft.eligibilityNote) return null;
  return (
    <>
      <h3>Eligibility</h3>
      {ages ? <p>{ages}</p> : null}
      {draft.gradeRange ? <p>{draft.gradeRange}</p> : null}
      {draft.eligibilityNote ? <p>{draft.eligibilityNote}</p> : null}
    </>
  );
}
