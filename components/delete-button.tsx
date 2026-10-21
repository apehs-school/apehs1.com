"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogPopup,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DeleteButton({
  action,
  id,
  name = "id",
  label = "Delete",
  title = "Delete this record?",
  description = "This cannot be undone.",
  confirmVariant = "destructive",
  fields,
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  name?: string;
  label?: string;
  title?: string;
  description?: string;
  confirmVariant?: "default" | "destructive";
  fields?: Record<string, string>;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="outline" />}>{label}</AlertDialogTrigger>
      <AlertDialogPortal>
        <AlertDialogBackdrop />
        <AlertDialogPopup>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
          <div className="mt-6 flex gap-2">
            <form action={action}>
              <input type="hidden" name={name} value={id} />
              {fields ? Object.entries(fields).map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />) : null}
              <Button type="submit" variant={confirmVariant}>{label}</Button>
            </form>
            <AlertDialogClose render={<Button variant="outline" type="button" />}>Cancel</AlertDialogClose>
          </div>
        </AlertDialogPopup>
      </AlertDialogPortal>
    </AlertDialog>
  );
}
