"use client";

import { Dialog, DialogBackdrop, DialogClose, DialogPopup, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useState } from "react";

export type StaffCardMember = {
  id: string;
  name: string;
  title: string;
  note: string;
  detail: string;
  imageUrl: string | null;
};

export function StaffCards({ members }: { members: StaffCardMember[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [shown, setShown] = useState(0);
  const member = members[shown];
  const note = member?.note.trim() ?? "";

  return (
    <>
      <div className="about-staff">
        {members.map((item, index) => {
          const hasNote = item.note.trim().length > 0;
          return (
            <article
              key={item.id}
              className="about-card"
              data-tone={index % 6}
              data-note={hasNote ? "true" : undefined}
              style={{ animationDelay: `${index * 70}ms` }}
              onDoubleClick={() => {
                if (!hasNote) return;
                setShown(index);
                setActive(index);
              }}
            >
              <Portrait name={item.name} imageUrl={item.imageUrl} className="about-avatar" />
              <h2>{item.name}</h2>
              <p className="about-role">{item.title}</p>
              {item.detail ? <p className="about-note">{item.detail}</p> : null}
            </article>
          );
        })}
      </div>
      <Dialog open={active !== null} onOpenChange={(open) => { if (!open) setActive(null); }}>
        {member && note ? (
          <DialogPortal>
            <DialogBackdrop />
            <DialogPopup className="staff-note" data-tone={shown % 6}>
              <div className="staff-note-banner">
                <Portrait name={member.name} imageUrl={member.imageUrl} className="staff-note-avatar" />
              </div>
              <DialogClose className="staff-note-close" aria-label="Close">
                <X />
              </DialogClose>
              <div className="staff-note-sheet">
                <DialogTitle>{member.name}</DialogTitle>
                <p className="staff-note-role">{member.title}</p>
                <p className="staff-note-copy">{note}</p>
              </div>
            </DialogPopup>
          </DialogPortal>
        ) : null}
      </Dialog>
    </>
  );
}

function Portrait({ name, imageUrl, className }: { name: string; imageUrl: string | null; className: string }) {
  return (
    <div className={className}>
      {imageUrl ? (
        <img src={imageUrl} alt="" className="about-portrait" />
      ) : (
        <span className="about-initials" aria-hidden="true">{initials(name)}</span>
      )}
    </div>
  );
}

function initials(name: string) {
  const skip = new Set(["mr", "mrs", "ms", "miss", "dr"]);
  const parts = name
    .split(/\s+/)
    .map((part) => part.replace(/\./g, ""))
    .filter((part) => part && !skip.has(part.toLowerCase()));
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}
