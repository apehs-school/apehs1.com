"use client";

import { markContactRead, replyToContact } from "@/actions/contact";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBackdrop, DialogPopup, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useEffect } from "react";

export type ChatTurn = {
  id: string;
  authorRole: string;
  body: string;
  createdAt: string;
};

export function MessageChat({
  messageId,
  title,
  opener,
  turns,
  closeHref,
  viewer,
}: {
  messageId: string;
  title: string;
  opener: { name: string; body: string };
  turns: ChatTurn[];
  closeHref: string;
  viewer: "admin" | "user";
}) {
  useEffect(() => {
    void markContactRead(messageId);
  }, [messageId]);

  return (
    <Dialog defaultOpen>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          <DialogTitle className="mb-4">{title}</DialogTitle>
          <div className="mb-4 grid max-h-80 gap-3 overflow-y-auto pr-1">
            <div className="max-w-[85%] rounded-xl bg-[#eef3f9] px-4 py-3">
              <p className="text-xs font-medium text-[#52627a]">{opener.name}</p>
              <p className="whitespace-pre-line">{opener.body}</p>
            </div>
            {turns.map((turn) => {
              const fromSchool = turn.authorRole === "admin";
              const label = fromSchool ? "School" : viewer === "admin" ? opener.name : "You";
              return (
                <div key={turn.id} className={`max-w-[85%] rounded-xl px-4 py-3 ${fromSchool ? "ml-auto bg-[#0d47a1] text-white" : "bg-[#eef3f9]"}`}>
                  <p className={`text-xs font-medium ${fromSchool ? "text-white/80" : "text-[#52627a]"}`}>{label}</p>
                  <p className="whitespace-pre-line">{turn.body}</p>
                </div>
              );
            })}
          </div>
          <form className="grid gap-3" action={replyToContact}>
            <input type="hidden" name="messageId" value={messageId} />
            <Textarea name="body" rows={4} className="text-base" placeholder="Write a reply" required />
            <div className="flex gap-3">
              <Button type="submit" size="lg">Send</Button>
              <a href={closeHref} className="inline-flex h-9 items-center rounded-lg border px-3">Close</a>
            </div>
          </form>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
