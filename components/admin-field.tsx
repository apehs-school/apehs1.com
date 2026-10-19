export function AdminField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#0b1f3a]">
      {label}
      {children}
    </label>
  );
}

export const adminSelectClass = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-normal";
