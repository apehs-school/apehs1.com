"use client";

import { Children, Suspense, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Table, TableBody } from "@/components/ui/table";

export const adminPageSize = 8;

export function TablePager({
  page,
  pages,
  total,
  from,
  to,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  from: number;
  to: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="user-pager">
      <p>{total === 0 ? "0 records" : `${from}–${to} of ${total}`}</p>
      <div>
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
        <span>{page} / {pages}</span>
        <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}

export function useTablePage(total: number, pageKey = "page", pageSize = adminPageSize) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, Number(params.get(pageKey)) || 1), pages);
  const start = (page - 1) * pageSize;

  function go(next: number) {
    const query = new URLSearchParams(params.toString());
    if (next <= 1) query.delete(pageKey);
    else query.set(pageKey, String(next));
    const text = query.toString();
    router.replace(text ? `${pathname}?${text}` : pathname, { scroll: false });
  }

  return {
    page,
    pages,
    start,
    end: start + pageSize,
    total,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, total),
    go,
  };
}

export function PagedTable({
  header,
  rows,
  pageKey = "page",
  pageSize = adminPageSize,
  tableClassName,
}: {
  header: ReactNode;
  rows: ReactNode;
  pageKey?: string;
  pageSize?: number;
  tableClassName?: string;
}) {
  const list = Children.toArray(rows);
  return (
    <Suspense fallback={<PagedFrame header={header} rows={list.slice(0, pageSize)} tableClassName={tableClassName} total={list.length} page={1} pageSize={pageSize} onPage={() => {}} />}>
      <PagedFromUrl header={header} rows={list} pageKey={pageKey} pageSize={pageSize} tableClassName={tableClassName} />
    </Suspense>
  );
}

function PagedFromUrl({
  header,
  rows,
  pageKey,
  pageSize,
  tableClassName,
}: {
  header: ReactNode;
  rows: ReactNode[];
  pageKey: string;
  pageSize: number;
  tableClassName?: string;
}) {
  const paging = useTablePage(rows.length, pageKey, pageSize);
  return (
    <PagedFrame
      header={header}
      rows={rows.slice(paging.start, paging.end)}
      tableClassName={tableClassName}
      total={paging.total}
      page={paging.page}
      pageSize={pageSize}
      onPage={paging.go}
    />
  );
}

function PagedFrame({
  header,
  rows,
  tableClassName,
  total,
  page,
  pageSize,
  onPage,
}: {
  header: ReactNode;
  rows: ReactNode;
  tableClassName?: string;
  total: number;
  page: number;
  pageSize: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  return (
    <div className="admin-paged">
      <Table className={tableClassName}>
        {header}
        <TableBody>{rows}</TableBody>
      </Table>
      <TablePager
        page={page}
        pages={pages}
        total={total}
        from={total === 0 ? 0 : start + 1}
        to={Math.min(start + pageSize, total)}
        onPage={onPage}
      />
    </div>
  );
}
