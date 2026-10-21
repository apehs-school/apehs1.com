import { FileText, GraduationCap, ListOrdered } from "lucide-react";
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
                  <p className="admission-lead">{record.introduction}</p>
                  <Eligibility draft={record} />
                  {record.documents.length > 0 ? (
                    <section className="admission-section">
                      <h3><FileText aria-hidden="true" /> Required documents</h3>
                      <ul className="admission-docs">
                        {record.documents.map((item, index) => (
                          <li key={item} style={{ animationDelay: `${index * 70}ms` }}>
                            <FileText aria-hidden="true" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                  {record.steps.length > 0 ? (
                    <section className="admission-section">
                      <h3><ListOrdered aria-hidden="true" /> Enrollment steps</h3>
                      <ol className="admission-steps">
                        {record.steps.map((step, index) => (
                          <li key={step.id} style={{ animationDelay: `${index * 90}ms` }}>
                            <span className="admission-step-mark" aria-hidden="true">{index + 1}</span>
                            <div>
                              <strong>{step.title}</strong>
                              {step.description ? <span>{step.description}</span> : null}
                            </div>
                          </li>
                        ))}
                      </ol>
                    </section>
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
  const ageValue = draft.minAge !== null && draft.maxAge !== null
    ? `${draft.minAge} to ${draft.maxAge}`
    : draft.minAge !== null
      ? `${draft.minAge} and older`
      : draft.maxAge !== null
        ? `Up to ${draft.maxAge}`
        : "";
  if (!ageValue && !draft.gradeRange && !draft.eligibilityNote) return null;
  return (
    <section className="admission-section">
      <h3><GraduationCap aria-hidden="true" /> Eligibility</h3>
      {ageValue || draft.gradeRange ? (
        <div className="admission-facts">
          {ageValue ? <p style={{ animationDelay: "40ms" }}><span>Ages</span><strong>{ageValue}</strong></p> : null}
          {draft.gradeRange ? <p style={{ animationDelay: "120ms" }}><span>Grades</span><strong>{draft.gradeRange}</strong></p> : null}
        </div>
      ) : null}
      {draft.eligibilityNote ? <p className="admission-note">{draft.eligibilityNote}</p> : null}
    </section>
  );
}
