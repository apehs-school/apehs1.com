"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogBackdrop, DialogClose, DialogPopup, DialogPortal, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function RecordDialog({
  trigger,
  title,
  action,
  children,
}: {
  trigger: string;
  title: string;
  action: (formData: FormData) => void | Promise<void>;
  children: React.ReactNode;
}) {
  const editing = trigger === "Edit" || trigger.startsWith("Edit ");

  return (
    <Dialog>
      <DialogTrigger render={<Button variant={editing ? "outline" : "default"} size="lg" />}>{trigger}</DialogTrigger>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          <DialogTitle className="mb-6">{title}</DialogTitle>
          <form className="grid gap-5 text-base" action={action}>
            {children}
            <div className="flex gap-3 pt-2">
              <Button type="submit" size="lg">{editing ? "Save changes" : trigger}</Button>
              <DialogClose render={<Button variant="outline" size="lg" type="button" />}>Cancel</DialogClose>
            </div>
          </form>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
