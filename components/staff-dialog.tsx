"use client";

import { createStaffMember, updateStaffMember } from "@/actions/admin";
import { AdminField, adminSelectClass } from "@/components/admin-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBackdrop, DialogClose, DialogPopup, DialogPortal, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { staffRoles, type StaffAssignment } from "@/lib/staff";
import { Plus, X } from "lucide-react";
import { useState } from "react";

export type StaffDraft = {
  id: string;
  name: string;
  role: string;
  title: string;
  assignments: StaffAssignment[];
  note: string;
  imageUrl: string | null;
};

export function StaffDialog({ staff }: { staff?: StaffDraft }) {
  const editing = Boolean(staff);
  const [role, setRole] = useState(staff?.role || "Principal");
  const [rows, setRows] = useState<StaffAssignment[]>(staff?.assignments.length ? staff.assignments : [{ grade: "", subject: "" }]);

  function updateRow(index: number, key: keyof StaffAssignment, value: string) {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant={editing ? "outline" : "default"} size="lg" />}>
        {editing ? "Edit" : "Add staff"}
      </DialogTrigger>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          <DialogTitle className="mb-6">{editing ? "Edit staff" : "Add staff"}</DialogTitle>
          <form className="grid gap-5 text-base" action={editing ? updateStaffMember : createStaffMember}>
            {staff ? <input type="hidden" name="id" value={staff.id} /> : null}
            <AdminField label="Staff name">
              <Input name="name" className="h-11 text-base" defaultValue={staff?.name} required />
            </AdminField>
            <AdminField label="Title">
              <select
                className={`${adminSelectClass} h-11 text-base`}
                name="role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                required
              >
                {staffRoles.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
                <option value="custom">Enter a title</option>
              </select>
            </AdminField>
            {role === "custom" ? (
              <AdminField label="Enter title">
                <Input name="customTitle" className="h-11 text-base" defaultValue={staff?.role === "custom" ? staff.title : ""} required />
              </AdminField>
            ) : null}
            {role === "Teacher" ? (
              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-[#0b1f3a]">Grade and subject</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label="Add grade and subject"
                    onClick={() => setRows((current) => [...current, { grade: "", subject: "" }])}
                  >
                    <Plus />
                  </Button>
                </div>
                {rows.map((row, index) => (
                  <div key={index} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
                    <AdminField label={index === 0 ? "Grade" : `Grade ${index + 1}`}>
                      <Input name="grade" className="h-11 text-base" value={row.grade} onChange={(event) => updateRow(index, "grade", event.target.value)} />
                    </AdminField>
                    <AdminField label={index === 0 ? "Subject" : `Subject ${index + 1}`}>
                      <Input name="subject" className="h-11 text-base" value={row.subject} onChange={(event) => updateRow(index, "subject", event.target.value)} />
                    </AdminField>
                    {rows.length > 1 ? (
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        aria-label="Remove grade and subject"
                        onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                      >
                        <X />
                      </Button>
                    ) : (
                      <span className="hidden sm:block" />
                    )}
                  </div>
                ))}
              </div>
            ) : null}
            <AdminField label="Description">
              <Textarea name="note" className="text-base" rows={4} defaultValue={staff?.note} />
            </AdminField>
            <AdminField label="Image">
              <Input name="image" type="file" accept="image/*" className="h-11 text-base" />
            </AdminField>
            {staff?.imageUrl ? <img src={staff.imageUrl} alt="" className="h-28 w-28 rounded-md object-cover" /> : null}
            <div className="flex gap-3 pt-2">
              <Button type="submit" size="lg">{editing ? "Save changes" : "Add staff"}</Button>
              <DialogClose render={<Button variant="outline" size="lg" type="button" />}>Cancel</DialogClose>
            </div>
          </form>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
