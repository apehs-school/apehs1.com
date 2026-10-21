"use client";

import { useEffect, useRef, useState } from "react";
import { createNews, deleteNews, setNewsPublished, updateNews } from "@/actions/admin";
import { DeleteButton } from "@/components/delete-button";
import { bulletinAudiences, bulletinCategories, bulletinDate, type BulletinItem } from "@/components/news-bulletin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { jamaicaDate } from "@/lib/format";

type BulletinImage = { key: string; url: string };

type BulletinRow = Omit<BulletinItem, "images"> & {
  showFrom: string;
  pinned: boolean;
  published: boolean;
  images: BulletinImage[];
};

const empty: BulletinRow = {
  id: "",
  title: "",
  body: "",
  details: "",
  category: "Announcement",
  audience: "Everyone",
  eventDate: "",
  showFrom: "",
  endsOn: "",
  pinned: false,
  published: false,
  images: [],
};

export function NewsAdmin({ rows }: { rows: BulletinRow[] }) {
  const [editing, setEditing] = useState<BulletinRow | null>({ ...empty });
  const form = editing ?? empty;
  const today = jamaicaDate();
  const sourceId = editing?.id ?? "new";
  const [loadedId, setLoadedId] = useState(sourceId);
  const [kept, setKept] = useState<BulletinImage[]>([]);
  const [pending, setPending] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [imageNote, setImageNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  if (loadedId !== sourceId) {
    previews.forEach((url) => URL.revokeObjectURL(url));
    setLoadedId(sourceId);
    setKept(editing?.images ?? []);
    setPending([]);
    setPreviews([]);
    setImageNote("");
  }

  useEffect(() => {
    const input = fileRef.current;
    if (!input) return;
    const transfer = new DataTransfer();
    pending.forEach((file) => transfer.items.add(file));
    input.files = transfer.files;
  }, [pending]);

  function addImages(list: FileList | null) {
    const room = 4 - kept.length - pending.length;
    const picked = Array.from(list ?? []);
    const next = picked.filter((file) => ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type) && file.size <= 2 * 1024 * 1024).slice(0, Math.max(room, 0));
    setImageNote(next.length === picked.length ? "" : "Add up to 4 images, 2 MB each, in JPG, PNG, GIF, or WebP.");
    setPending((current) => [...current, ...next]);
    setPreviews((current) => [...current, ...next.map((file) => URL.createObjectURL(file))]);
  }

  function removePending(index: number) {
    setPreviews((current) => {
      const url = current[index];
      if (url) URL.revokeObjectURL(url);
      return current.filter((_, item) => item !== index);
    });
    setPending((current) => current.filter((_, item) => item !== index));
  }

  return (
    <div className="bulletin-admin">
      <div className="bulletin-admin-head">
        <div>
          <h1>News bulletin</h1>
          <p>Keep your school community informed.</p>
        </div>
        <Button type="button" onClick={() => setEditing({ ...empty })}>
          + Create bulletin
        </Button>
      </div>

      {editing ? (
        <form className="bulletin-editor" action={form.id ? updateNews : createNews}>
          <div className="bulletin-editor-head">
            <h2>{form.id ? "Edit bulletin" : "Create bulletin"}</h2>
            <span>Draft editor</span>
          </div>
          {form.id ? <input type="hidden" name="id" value={form.id} /> : null}
          <label>
            Headline <span>*</span>
            <Input name="title" required value={form.title} placeholder="A clear headline for parents and students" onChange={(event) => setEditing({ ...form, title: event.target.value })} />
          </label>
          <div className="bulletin-editor-row">
            <label>
              Category
              <select name="category" value={form.category} onChange={(event) => setEditing({ ...form, category: event.target.value })}>
                {bulletinCategories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <label>
              Intended audience
              <select name="audience" value={form.audience} onChange={(event) => setEditing({ ...form, audience: event.target.value })}>
                {bulletinAudiences.map((audience) => <option key={audience}>{audience}</option>)}
              </select>
            </label>
          </div>
          <label>
            Short summary <span>*</span>
            <Textarea name="body" required rows={2} value={form.body} placeholder="A short explanation for the bulletin card" onChange={(event) => setEditing({ ...form, body: event.target.value })} />
          </label>
          <label>
            Full details (optional)
            <Textarea name="details" rows={3} value={form.details} placeholder="Add further information visitors can expand to read" onChange={(event) => setEditing({ ...form, details: event.target.value })} />
          </label>
          <div className="bulletin-editor-row bulletin-editor-dates">
            <label>
              News / event date <span>*</span>
              <Input name="eventDate" type="date" required value={form.eventDate} onChange={(event) => setEditing({ ...form, eventDate: event.target.value })} />
            </label>
            <label>
              Show from <span>*</span>
              <Input name="showFrom" type="date" required value={form.showFrom} onChange={(event) => setEditing({ ...form, showFrom: event.target.value })} />
            </label>
            <label className="bulletin-end-date">
              Last display date (optional)
              <Input name="endsOn" type="date" value={form.endsOn ?? ""} onChange={(event) => setEditing({ ...form, endsOn: event.target.value })} />
              <small>Leave blank to keep it visible.</small>
            </label>
          </div>
          <label className="bulletin-pin">
            <input type="checkbox" name="pinned" checked={form.pinned} onChange={(event) => setEditing({ ...form, pinned: event.target.checked })} />
            Pin to the top of the bulletin
          </label>
          <div className="bulletin-images">
            <span>Images</span>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={kept.length + pending.length >= 4}>Add images</button>
            <input ref={fileRef} type="file" name="images" accept="image/jpeg,image/png,image/gif,image/webp" multiple hidden onChange={(event) => { addImages(event.target.files); event.target.value = ""; }} />
            <small>Up to 4 images, 2 MB each. JPG, PNG, GIF, or WebP.</small>
            {imageNote ? <small className="bulletin-image-note">{imageNote}</small> : null}
            {kept.length + pending.length > 0 ? (
              <div className="bulletin-image-picks">
                {kept.map((image) => (
                  <figure key={image.key}>
                    <img src={image.url} alt="" />
                    <button type="button" onClick={() => setKept((current) => current.filter((item) => item.key !== image.key))}>Remove</button>
                    <input type="hidden" name="keepImages" value={image.key} />
                  </figure>
                ))}
                {previews.map((url, index) => (
                  <figure key={url}>
                    <img src={url} alt="" />
                    <button type="button" onClick={() => removePending(index)}>Remove</button>
                  </figure>
                ))}
              </div>
            ) : null}
          </div>
          <div className="bulletin-editor-actions">
            <Button type="submit">{form.id ? "Save changes" : "Save Draft"}</Button>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </form>
      ) : null}

      <section className="bulletin-manage" aria-labelledby="manage-bulletins">
        <div className="bulletin-manage-head">
          <h2 id="manage-bulletins">Manage bulletins</h2>
          <p>Sample content · Preview date: {bulletinDate(today)}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Bulletin</th>
              <th>Display period</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4}>No bulletins yet.</td>
              </tr>
            ) : rows.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.title}</strong>
                  <span>{item.category} · {item.audience}</span>
                </td>
                <td>
                  {bulletinDate(item.eventDate)}
                  <span>to {item.endsOn ? bulletinDate(item.endsOn) : "No end date"}</span>
                </td>
                <td><span className={item.published ? "is-published" : "is-draft"}>{item.published ? "Published" : "Draft"}</span></td>
                <td>
                  <button type="button" onClick={() => setEditing(item)}>Edit</button>
                  <form action={setNewsPublished}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="published" value={item.published ? "false" : "true"} />
                    <button type="submit">{item.published ? "Unpublish" : "Publish"}</button>
                  </form>
                  <DeleteButton action={deleteNews} id={item.id} label="Delete" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
