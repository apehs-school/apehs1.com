"use client";

import { useState, type ReactNode } from "react";

const tabs = [
  { id: "records", label: "Saved admission records", tone: "navy" },
  { id: "applications", label: "Online Student Admission Application", tone: "blue" },
  { id: "behaviour", label: "Online Student Behaviour Assessment", tone: "gold" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function AdmissionsPanels({ records, applications, behaviour }: { records: ReactNode; applications: ReactNode; behaviour: ReactNode }) {
  const [tab, setTab] = useState<TabId>("records");
  const panels = { records, applications, behaviour };
  return (
    <div className="admission-panels">
      <div className="admission-subtabs" role="tablist" aria-label="Admissions sections">
        {tabs.map((item) => (
          <button key={item.id} type="button" role="tab" data-tone={item.tone} aria-selected={tab === item.id} onClick={() => setTab(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{panels[tab]}</div>
    </div>
  );
}
