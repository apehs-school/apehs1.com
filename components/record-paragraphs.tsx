"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { AdminField } from "@/components/admin-field";
import { PageBody } from "@/components/page-body";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatPublished } from "@/lib/format";

type Paragraph = { id: string; text: string };
type TitleSection = { id: string; title: string; paragraphs: Paragraph[] };
type PreviewState = { title: string; body: string; imageUrl: string | null };

export function RecordParagraphs({
  label,
  titleLabel = "Title",
  defaultBody = "",
  existingImageUrl = null,
}: {
  label: string;
  titleLabel?: string;
  defaultBody?: string;
  existingImageUrl?: string | null;
}) {
  const initial = readBody(defaultBody);
  const [rows, setRows] = useState<Paragraph[]>(initial.paragraphs);
  const [titles, setTitles] = useState<TitleSection[]>(initial.titles);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const body = composeBody(rows, titles);

  function openPreview(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    const data = form ? new FormData(form) : null;
    const title = String(data?.get("title") ?? "");
    const file = data?.get("image");
    const imageUrl = file instanceof File && file.size > 0 ? URL.createObjectURL(file) : existingImageUrl;
    setPreview({ title, body, imageUrl });
  }

  function closePreview() {
    if (preview?.imageUrl?.startsWith("blob:")) URL.revokeObjectURL(preview.imageUrl);
    setPreview(null);
  }

  function removeTitle(id: string) {
    const removed = titles.find((section) => section.id === id);
    const removedIds = new Set(removed?.paragraphs.map((paragraph) => paragraph.id) ?? []);
    setTitles((current) => current.filter((section) => section.id !== id));
    if (removedIds.size > 0) setRows((current) => current.filter((row) => !removedIds.has(row.id)));
    setPreview(null);
  }

  function addDescription() {
    const paragraph = { id: crypto.randomUUID(), text: "" };
    if (titles.length === 0) {
      setRows((current) => [...current, paragraph]);
      return;
    }
    setTitles((current) => current.map((section, index) => (
      index === current.length - 1 ? { ...section, paragraphs: [...section.paragraphs, paragraph] } : section
    )));
  }

  const actions = (
    <div className="flex flex-wrap gap-2 rounded-xl bg-[#f4f7fb] p-2">
      <Button type="button" className="bg-[#0d47a1] text-white hover:bg-[#1565c0]" onClick={addDescription}>
        <Plus />
          Add paragraph
      </Button>
      <Button type="button" className="bg-[#c9a227] text-[#0b1f3a] hover:bg-[#d4b44a]" onClick={openPreview}>
        Preview
      </Button>
      <Button type="button" className="bg-[#1b6b4a] text-white hover:bg-[#218a5c]" onClick={() => setTitles((current) => [...current, { id: crypto.randomUUID(), title: "", paragraphs: [{ id: crypto.randomUUID(), text: "" }] }])}>
        <Plus />
        Add new title
      </Button>
    </div>
  );

  return (
    <div className="grid gap-4">
      <input type="hidden" name="body" value={body} />
      {rows.map((row, index) => (
        <div key={row.id} className="grid grid-cols-[1fr_auto] items-end gap-2">
          <AdminField label={index === 0 ? label : `${label} ${index + 1}`}>
            <Textarea
              className="text-base"
              rows={5}
              required={index === 0}
              value={row.text}
              onChange={(event) => setRows((current) => current.map((item) => (item.id === row.id ? { ...item, text: event.target.value } : item)))}
            />
          </AdminField>
          {index > 0 ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="border-[#f3c3c3] bg-[#fff1f1] text-[#b42318] hover:bg-[#fde2e2]"
              aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
              onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
            >
              <X />
            </Button>
          ) : (
            <span className="w-9" />
          )}
        </div>
      ))}
      {titles.length === 0 ? actions : null}
      {titles.map((section, index) => (
        <div key={section.id} className="grid gap-4 rounded-xl border border-[#d7e3f4] bg-[#f8fbff] p-4">
          <div className="grid grid-cols-[1fr_auto] items-end gap-2">
            <AdminField label={`${titleLabel} ${index + 2}`}>
              <Input
                className="h-11 text-base"
                value={section.title}
                required
                onChange={(event) => setTitles((current) => current.map((item) => (item.id === section.id ? { ...item, title: event.target.value } : item)))}
              />
            </AdminField>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="border-[#f3c3c3] bg-[#fff1f1] text-[#b42318] hover:bg-[#fde2e2]"
              aria-label={`Remove ${titleLabel.toLowerCase()} ${index + 2} and its paragraphs`}
              onClick={() => removeTitle(section.id)}
            >
              <X />
            </Button>
          </div>
          {section.paragraphs.map((row, paragraphIndex) => (
            <div key={row.id} className="grid grid-cols-[1fr_auto] items-end gap-2">
              <AdminField label={paragraphIndex === 0 ? label : `${label} ${paragraphIndex + 1}`}>
                <Textarea
                  className="text-base"
                  rows={5}
                  value={row.text}
                  onChange={(event) => setTitles((current) => current.map((item) => (
                    item.id === section.id
                      ? { ...item, paragraphs: item.paragraphs.map((paragraph) => (paragraph.id === row.id ? { ...paragraph, text: event.target.value } : paragraph)) }
                      : item
                  )))}
                />
              </AdminField>
              {paragraphIndex > 0 ? (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="border-[#f3c3c3] bg-[#fff1f1] text-[#b42318] hover:bg-[#fde2e2]"
                  aria-label={`Remove ${label.toLowerCase()} ${paragraphIndex + 1}`}
                  onClick={() => setTitles((current) => current.map((item) => (
                    item.id === section.id ? { ...item, paragraphs: item.paragraphs.filter((paragraph) => paragraph.id !== row.id) } : item
                  )))}
                >
                  <X />
                </Button>
              ) : (
                <span className="w-9" />
              )}
            </div>
          ))}
        </div>
      ))}
      {titles.length > 0 ? actions : null}
      {preview ? (
        <div className="rounded-xl bg-[#f4f6f8] p-4">
          <p className="mb-3 text-sm font-medium text-[#52627a]">This is how the record appears on the public page.</p>
          <article className="about-panel about-entry bg-white">
            <p className="about-published">
              <time>{formatPublished(new Date())}</time>
            </p>
            {preview.imageUrl ? <img src={preview.imageUrl} alt="" /> : null}
            {preview.title ? <h2>{preview.title}</h2> : null}
            <div className="about-prose">
              {preview.body ? <PageBody body={preview.body} formal /> : <p>The paragraph will appear here.</p>}
            </div>
          </article>
          <Button type="button" className="mt-4 bg-[#0b1f3a] text-white hover:bg-[#16325c]" onClick={closePreview}>
            Close preview
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function composeBody(paragraphs: Paragraph[], titles: TitleSection[]) {
  const main = paragraphs.map((row) => row.text.trim()).filter(Boolean);
  const extras = titles.flatMap((section) => {
    const text = section.paragraphs.map((row) => row.text.trim()).filter(Boolean);
    const title = section.title.trim();
    if (!title && text.length === 0) return [];
    const [first, ...rest] = text;
    const heading = [title ? `## ${title}` : "", first ?? ""].filter(Boolean).join("\n");
    return [heading, ...rest].filter(Boolean);
  });
  return [...main, ...extras].join("\n\n");
}

function readBody(body: string) {
  const parts = body
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  const paragraphs: Paragraph[] = [];
  const titles: TitleSection[] = [];
  for (const part of parts) {
    if (part.startsWith("## ")) {
      const [heading, ...rest] = part.split("\n");
      titles.push({
        id: crypto.randomUUID(),
        title: heading.slice(3).trim(),
        paragraphs: [{ id: crypto.randomUUID(), text: rest.join("\n").trim() }],
      });
    } else if (titles.length > 0) {
      titles[titles.length - 1].paragraphs.push({ id: crypto.randomUUID(), text: part });
    } else {
      paragraphs.push({ id: crypto.randomUUID(), text: part });
    }
  }
  if (paragraphs.length === 0) paragraphs.push({ id: crypto.randomUUID(), text: "" });
  return { paragraphs, titles };
}
