"use client";

import { createMenuItem, updateMenuItem } from "@/actions/admin";
import { AdminField, adminSelectClass } from "@/components/admin-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBackdrop, DialogClose, DialogPopup, DialogPortal, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { mealCategories } from "@/lib/menu";

export type MealDraft = {
  id: string;
  startsOn: string;
  endsOn: string;
  category: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string | null;
};

export function MealDialog({ meal, category }: { meal?: MealDraft; category: string }) {
  const editing = Boolean(meal);

  return (
    <Dialog>
      <DialogTrigger render={<Button variant={editing ? "outline" : "default"} />}>
        {editing ? "Edit" : "Add meal"}
      </DialogTrigger>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          <DialogTitle className="mb-4">{editing ? "Edit a meal" : "Add a meal"}</DialogTitle>
          <form className="grid gap-3" action={editing ? updateMenuItem : createMenuItem}>
            {meal ? <input type="hidden" name="id" value={meal.id} /> : null}
            <AdminField label="Start date">
              <Input name="startsOn" type="date" defaultValue={meal?.startsOn} required />
            </AdminField>
            <AdminField label="End date">
              <Input name="endsOn" type="date" defaultValue={meal?.endsOn} required />
            </AdminField>
            <AdminField label="Category">
              <select className={adminSelectClass} name="category" defaultValue={meal?.category || category} required>
                {mealCategories.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </AdminField>
            <AdminField label="Name">
              <Input name="name" defaultValue={meal?.name} required />
            </AdminField>
            <AdminField label="Description">
              <Textarea name="description" rows={3} defaultValue={meal?.description} />
            </AdminField>
            <AdminField label="Price (JMD)">
              <Input name="price" type="number" min="0" step="0.01" defaultValue={meal?.price} required />
            </AdminField>
            <AdminField label="Image">
              <Input name="image" type="file" accept="image/*" />
            </AdminField>
            {meal?.imageUrl ? <img src={meal.imageUrl} alt="" className="h-24 w-24 rounded-md object-cover" /> : null}
            <div className="flex gap-2">
              <Button type="submit">{editing ? "Save changes" : "Add meal"}</Button>
              <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
            </div>
          </form>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
