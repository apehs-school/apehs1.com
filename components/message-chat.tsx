"use client";

import { getChatThread, markContactRead, replyToContact } from "@/actions/contact";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBackdrop, DialogPopup, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatChatTime } from "@/lib/format";
import { ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type ChatTurn = {
  id: string;
  authorRole: string;
  body: string;
  imageUrl?: string | null;
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
  opener: { name: string; body: string; createdAt: string };
  turns: ChatTurn[];
  closeHref: string;
  viewer: "admin" | "user";
}) {
  const [preview, setPreview] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [live, setLive] = useState({ opener, turns });
  const listRef = useRef<HTMLDivElement>(null);
  const seenRef = useRef(new Set(turns.map((turn) => turn.id)));

  useEffect(() => {
    turns.forEach((turn) => seenRef.current.add(turn.id));
    setLive({ opener, turns });
  }, [opener, turns]);

  useEffect(() => {
    void markContactRead(messageId).catch(() => undefined);
  }, [messageId]);

  useEffect(() => {
    let stopped = false;
    let pending = false;
    async function pull() {
      if (pending || document.hidden) return;
      pending = true;
      try {
        const next = await getChatThread(messageId);
        if (stopped || !next) return;
        const other = viewer === "admin" ? "user" : "admin";
        const incoming = next.turns.some((turn) => !seenRef.current.has(turn.id) && turn.authorRole === other);
        next.turns.forEach((turn) => seenRef.current.add(turn.id));
        setLive(next);
        if (incoming) void markContactRead(messageId).catch(() => undefined);
      } catch {
        // A refresh can drop this request while the chat is still open.
      } finally {
        pending = false;
      }
    }
    void pull();
    const timer = window.setInterval(() => void pull(), 3000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [messageId, viewer]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [live.turns.length]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  return (
    <Dialog defaultOpen>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          <DialogTitle className="mb-4">{title}</DialogTitle>
          <div ref={listRef} className="mb-4 grid max-h-80 gap-3 overflow-y-auto pr-1">
            <div className="max-w-[85%] rounded-xl bg-[#eef3f9] px-4 py-3">
              <p className="text-xs font-medium text-[#52627a]">{live.opener.name}</p>
              <p className="whitespace-pre-line">{live.opener.body}</p>
              <time className="mt-2 block text-xs text-[#52627a]" dateTime={live.opener.createdAt}>{formatChatTime(live.opener.createdAt)}</time>
            </div>
            {live.turns.map((turn) => {
              const fromSchool = turn.authorRole === "admin";
              const label = fromSchool ? "School" : viewer === "admin" ? opener.name : "You";
              return (
                <div key={turn.id} className={`max-w-[85%] rounded-xl px-4 py-3 ${fromSchool ? "ml-auto bg-[#0d47a1] text-white" : "bg-[#eef3f9]"}`}>
                  <p className={`text-xs font-medium ${fromSchool ? "text-white/80" : "text-[#52627a]"}`}>{label}</p>
                  {turn.body ? <p className="whitespace-pre-line">{turn.body}</p> : null}
                  {turn.imageUrl ? <a href={turn.imageUrl} target="_blank" rel="noreferrer"><img src={turn.imageUrl} alt="" className="mt-2 max-h-52 w-full rounded-lg object-contain" /></a> : null}
                  <time className={`mt-2 block text-xs ${fromSchool ? "text-white/75" : "text-[#52627a]"}`} dateTime={turn.createdAt}>{formatChatTime(turn.createdAt)}</time>
                </div>
              );
            })}
          </div>
          <form
            className="grid gap-3"
            encType="multipart/form-data"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              setSending(true);
              setError("");
              void replyToContact(new FormData(form)).then((result) => {
                setSending(false);
                if (!result || result.error) {
                  setError(result?.error || "The reply could not be sent.");
                  return;
                }
                if (result.thread) setLive(result.thread);
                form.reset();
                setPreview((current) => {
                  if (current) URL.revokeObjectURL(current);
                  return "";
                });
              }).catch(() => {
                setSending(false);
                setError("The reply could not be sent. Try again.");
              });
            }}
          >
            <input type="hidden" name="messageId" value={messageId} />
            <Textarea name="body" rows={4} className="text-base" placeholder="Write a reply" required={!preview} />
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-medium text-[#0b1f3a]">
                <ImagePlus size={16} aria-hidden="true" />
                Image
                <input
                  className="sr-only"
                  name="image"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    setPreview((current) => {
                      if (current) URL.revokeObjectURL(current);
                      return file ? URL.createObjectURL(file) : "";
                    });
                  }}
                />
              </label>
              {preview ? (
                <span className="inline-flex items-center gap-2">
                  <img src={preview} alt="" className="h-12 w-12 rounded-md object-cover" />
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border"
                    aria-label="Remove image"
                    onClick={(event) => {
                      const input = event.currentTarget.form?.elements.namedItem("image");
                      if (input instanceof HTMLInputElement) input.value = "";
                      setPreview((current) => {
                        if (current) URL.revokeObjectURL(current);
                        return "";
                      });
                    }}
                  >
                    <X size={14} />
                  </button>
                </span>
              ) : null}
              {error ? <p className="w-full text-sm text-destructive">{error}</p> : null}
              <Button type="submit" size="lg" disabled={sending}>{sending ? "Sending..." : "Send"}</Button>
              <a href={closeHref} className="inline-flex h-9 items-center rounded-lg border px-3">Close</a>
            </div>
          </form>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
