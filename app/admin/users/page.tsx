import { grantAdminPrivilege, removeAdminPrivilege, setAccountStatus, setUserBan } from "@/actions/user-admin";
import { DeleteButton } from "@/components/delete-button";
import { UserRecordButton } from "@/components/user-record";
import { AdminField, adminSelectClass } from "@/components/admin-field";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { accountStatuses, adminPrivileges, canAssignPrivilege, canRemovePrivilege, ensureCurrentUser } from "@/lib/auth";
import { formatPublished } from "@/lib/format";
import { accountLabel, listDirectory, listPrivilegeRows, listUserHistory, syncClerkAccounts } from "@/lib/user-admin";

const pageSize = 8;

const tabs = [
  ["accounts", "All users"],
  ["privileges", "Admin privileges"],
  ["history", "User history"],
] as const;

const statusLabel: Record<string, string> = {
  student: "Student",
  teacher: "Teacher",
  parent: "Parent",
  staff: "Staff",
};

const privilegeLabel: Record<string, string> = {
  superadmin: "Super admin",
  admin: "Admin",
  "co-admin": "Co-admin",
};

const actionLabel: Record<string, string> = {
  banned: "Banned",
  unbanned: "Unbanned",
  privilege_granted: "Privilege assigned",
  privilege_removed: "Privilege removed",
  status_changed: "Status changed",
};

type View = {
  tab: (typeof tabs)[number][0];
  q: string;
  filter: string;
  sort: string;
  dir: "asc" | "desc";
  page: number;
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; filter?: string; sort?: string; dir?: string; page?: string }>;
}) {
  const params = await searchParams;
  const view = readView(params);
  const actor = await ensureCurrentUser();
  if (view.tab === "accounts") await syncClerkAccounts();
  const accounts = await listDirectory();
  const grants = view.tab === "privileges" ? await listPrivilegeRows() : [];
  const history = view.tab === "history" ? await listUserHistory() : [];
  const assignable = actor ? adminPrivileges.filter((item) => canAssignPrivilege(actor, item)) : [];

  return (
    <div className="user-desk">
      <header className="user-hero">
        <p>School office</p>
        <h1>User management</h1>
      </header>
      <div className="user-tabs">
        {tabs.map(([id, label]) => (
          <a key={id} href={`/admin/users?tab=${id}`} aria-current={id === view.tab ? "page" : undefined}>
            {label}
          </a>
        ))}
      </div>
      {view.tab === "accounts" ? <AccountTable accounts={accounts} actorId={actor?.id ?? ""} view={view} /> : null}
      {view.tab === "privileges" && actor ? (
        <PrivilegeTable accounts={accounts} grants={grants} actor={actor} assignable={assignable} view={view} />
      ) : null}
      {view.tab === "history" ? <HistoryTable rows={history} view={view} /> : null}
    </div>
  );
}

function AccountTable({
  accounts,
  actorId,
  view,
}: {
  accounts: Awaited<ReturnType<typeof listDirectory>>;
  actorId: string;
  view: View;
}) {
  const filtered = accounts.filter((account) => {
    if (view.filter === "banned" && !account.banned) return false;
    if (view.filter === "active" && account.banned) return false;
    if (["student", "teacher", "parent", "staff"].includes(view.filter) && account.accountStatus !== view.filter) return false;
    return includesQuery([accountLabel(account), account.email, account.accountStatus], view.q);
  });
  const sorted = filtered.sort((left, right) => {
    const value = {
      created: (account: (typeof accounts)[number]) => new Date(account.clerkCreatedAt ?? account.createdAt).getTime(),
      name: (account: (typeof accounts)[number]) => accountLabel(account),
      email: (account: (typeof accounts)[number]) => account.email,
      status: (account: (typeof accounts)[number]) => statusLabel[account.accountStatus] ?? account.accountStatus,
    }[view.sort] ?? ((account: (typeof accounts)[number]) => new Date(account.clerkCreatedAt ?? account.createdAt).getTime());
    return compare(value(left), value(right), view.dir);
  });
  const window = pageOf(sorted, view.page);

  return (
    <section className="user-panel">
      <DirectoryTools
        view={view}
        placeholder="Search name or email"
        filters={[
          ["all", "All statuses"],
          ["student", "Student"],
          ["teacher", "Teacher"],
          ["parent", "Parent"],
          ["staff", "Staff"],
          ["active", "Active"],
          ["banned", "Banned"],
        ]}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <SortHead label="Created" column="created" view={view} />
            <SortHead label="Name" column="name" view={view} />
            <SortHead label="Email" column="email" view={view} />
            <SortHead label="Status" column="status" view={view} />
            <TableHead>Access</TableHead>
            <TableHead>Record</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {window.rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6}>No accounts match this view.</TableCell>
            </TableRow>
          ) : (
            window.rows.map((account) => (
              <TableRow key={account.id}>
                <TableCell>{formatPublished(account.clerkCreatedAt ?? account.createdAt)}</TableCell>
                <TableCell className="font-medium">{accountLabel(account)}</TableCell>
                <TableCell>{account.email}</TableCell>
                <TableCell>
                  <form className="user-inline" action={setAccountStatus}>
                    <input type="hidden" name="id" value={account.id} />
                    <ReturnFields view={view} />
                    <select className={adminSelectClass} name="status" defaultValue={account.accountStatus} aria-label={`Status for ${accountLabel(account)}`}>
                      {accountStatuses.map((status) => (
                        <option key={status} value={status}>{statusLabel[status]}</option>
                      ))}
                    </select>
                    <Button type="submit" size="sm">Save</Button>
                    <Badge tone={account.accountStatus}>{statusLabel[account.accountStatus] ?? account.accountStatus}</Badge>
                  </form>
                </TableCell>
                <TableCell>
                  {account.banned ? <Badge tone="banned">Banned</Badge> : <Badge tone="active">Active</Badge>}
                  {account.id === actorId ? null : (
                    <span className={account.banned ? "user-restore" : "user-ban"}>
                      <DeleteButton
                        action={setUserBan}
                        id={account.id}
                        label={account.banned ? "Unban" : "Ban"}
                        title={account.banned ? "Unban this user?" : "Ban this user?"}
                        description={account.banned ? "This person will be able to sign in again." : "This person will not be able to sign in."}
                        fields={{ banned: account.banned ? "false" : "true", ...returnFields(view) }}
                      />
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <UserRecordButton
                    record={{
                      id: account.id,
                      name: accountLabel(account),
                      email: account.email,
                      phone: account.phone,
                      street: account.street,
                      apt: account.apt,
                      town: account.town,
                      parish: account.parish,
                      status: account.accountStatus,
                      banned: account.banned,
                      question: account.securityQuestion,
                      questionTwo: account.securityQuestionTwo,
                    }}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Pager view={view} total={window.total} from={window.from} to={window.to} />
    </section>
  );
}

function PrivilegeTable({
  accounts,
  grants,
  actor,
  assignable,
  view,
}: {
  accounts: Awaited<ReturnType<typeof listDirectory>>;
  grants: Awaited<ReturnType<typeof listPrivilegeRows>>;
  actor: NonNullable<Awaited<ReturnType<typeof ensureCurrentUser>>>;
  assignable: string[];
  view: View;
}) {
  const choices = accounts.filter((account) => !account.banned);
  const filtered = grants.filter((grant) => {
    if (view.filter !== "all" && grant.privilege !== view.filter) return false;
    return includesQuery([grant.name, grant.email, grant.assignedBy, grant.privilege], view.q);
  });
  const sorted = filtered.sort((left, right) => {
    const value = {
      name: (grant: (typeof grants)[number]) => grant.name,
      role: (grant: (typeof grants)[number]) => privilegeLabel[grant.privilege] ?? grant.privilege,
      assignedBy: (grant: (typeof grants)[number]) => grant.assignedBy,
      assigned: (grant: (typeof grants)[number]) => new Date(grant.assignedAt).getTime(),
    }[view.sort] ?? ((grant: (typeof grants)[number]) => new Date(grant.assignedAt).getTime());
    return compare(value(left), value(right), view.dir);
  });
  const window = pageOf(sorted, view.page);

  return (
    <section className="user-panel">
      {assignable.length > 0 ? (
        <form className="user-grant" action={grantAdminPrivilege}>
          <ReturnFields view={view} />
          <AdminField label="User">
            <select className={adminSelectClass} name="id" required>
              {choices.map((account) => (
                <option key={account.id} value={account.id}>
                  {accountLabel(account)}{account.email ? ` (${account.email})` : ""}
                </option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Role">
            <select className={adminSelectClass} name="privilege" defaultValue={assignable[0]}>
              {assignable.map((item) => (
                <option key={item} value={item}>{privilegeLabel[item]}</option>
              ))}
            </select>
          </AdminField>
          <Button type="submit">Assign privilege</Button>
        </form>
      ) : (
        <p className="user-note">Your role can review privileges. A super admin or admin assigns them.</p>
      )}
      <DirectoryTools
        view={view}
        placeholder="Search name, email, or assigner"
        filters={[
          ["all", "All roles"],
          ["superadmin", "Super admin"],
          ["admin", "Admin"],
          ["co-admin", "Co-admin"],
        ]}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <SortHead label="Name" column="name" view={view} />
            <SortHead label="Role" column="role" view={view} />
            <SortHead label="Assigned by" column="assignedBy" view={view} />
            <SortHead label="Assigned" column="assigned" view={view} />
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {window.rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5}>No privileges match this view.</TableCell>
            </TableRow>
          ) : (
            window.rows.map((grant) => (
              <TableRow key={grant.id}>
                <TableCell>
                  <div className="font-medium">{grant.name}</div>
                  <div className="text-sm text-[#52627a]">{grant.email}</div>
                </TableCell>
                <TableCell><Badge tone={grant.privilege}>{privilegeLabel[grant.privilege] ?? grant.privilege}</Badge></TableCell>
                <TableCell>{grant.assignedBy}</TableCell>
                <TableCell>{formatPublished(grant.assignedAt)}</TableCell>
                <TableCell>
                  {grant.userId !== actor.id && canRemovePrivilege(actor, grant.privilege) ? (
                    <DeleteButton
                      action={removeAdminPrivilege}
                      id={grant.userId}
                      label="Remove"
                      title="Remove this privilege?"
                      description="This person will no longer open the admin dashboard."
                      fields={returnFields(view)}
                    />
                  ) : null}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Pager view={view} total={window.total} from={window.from} to={window.to} />
    </section>
  );
}

function HistoryTable({ rows, view }: { rows: Awaited<ReturnType<typeof listUserHistory>>; view: View }) {
  const filtered = rows.filter((row) => {
    if (view.filter !== "all" && row.action !== view.filter) return false;
    return includesQuery([row.targetName, row.actorName, row.action, row.detail, actionLabel[row.action] ?? ""], view.q);
  });
  const sorted = filtered.sort((left, right) => {
    const value = {
      when: (row: (typeof rows)[number]) => new Date(row.createdAt).getTime(),
      action: (row: (typeof rows)[number]) => actionLabel[row.action] ?? row.action,
      account: (row: (typeof rows)[number]) => row.targetName,
      by: (row: (typeof rows)[number]) => row.actorName,
    }[view.sort] ?? ((row: (typeof rows)[number]) => new Date(row.createdAt).getTime());
    return compare(value(left), value(right), view.dir);
  });
  const window = pageOf(sorted, view.page);

  return (
    <section className="user-panel">
      <DirectoryTools
        view={view}
        placeholder="Search account, person, or action"
        filters={[
          ["all", "All actions"],
          ["banned", "Banned"],
          ["unbanned", "Unbanned"],
          ["privilege_granted", "Privilege assigned"],
          ["privilege_removed", "Privilege removed"],
          ["status_changed", "Status changed"],
        ]}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <SortHead label="When" column="when" view={view} />
            <SortHead label="Action" column="action" view={view} />
            <SortHead label="Account" column="account" view={view} />
            <SortHead label="By" column="by" view={view} />
            <TableHead>Detail</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {window.rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5}>No history matches this view.</TableCell>
            </TableRow>
          ) : (
            window.rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{formatPublished(row.createdAt)}</TableCell>
                <TableCell><Badge tone={row.action}>{actionLabel[row.action] ?? row.action}</Badge></TableCell>
                <TableCell className="font-medium">{row.targetName}</TableCell>
                <TableCell>{row.actorName}</TableCell>
                <TableCell>{historyDetail(row.action, row.detail)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Pager view={view} total={window.total} from={window.from} to={window.to} />
    </section>
  );
}

function DirectoryTools({
  view,
  placeholder,
  filters,
}: {
  view: View;
  placeholder: string;
  filters: [string, string][];
}) {
  return (
    <form className="user-tools" action="/admin/users">
      <input type="hidden" name="tab" value={view.tab} />
      <input type="hidden" name="sort" value={view.sort} />
      <input type="hidden" name="dir" value={view.dir} />
      <label>
        Search
        <input name="q" defaultValue={view.q} placeholder={placeholder} />
      </label>
      <label>
        Filter
        <select name="filter" defaultValue={view.filter}>
          {filters.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <button type="submit">Apply</button>
      {view.q || view.filter !== "all" ? <a href={hrefFor({ ...view, q: "", filter: "all", page: 1 })}>Clear</a> : null}
    </form>
  );
}

function SortHead({ label, column, view }: { label: string; column: string; view: View }) {
  const active = view.sort === column;
  const first = ["created", "assigned", "when"].includes(column) ? "desc" : "asc";
  const dir = !active ? first : view.dir === "asc" ? "desc" : "asc";
  return (
    <TableHead>
      <a className={active ? "is-sorted" : ""} href={hrefFor({ ...view, sort: column, dir, page: 1 })}>
        {label}
        <span aria-hidden="true">{active ? (view.dir === "asc" ? "↑" : "↓") : "↕"}</span>
      </a>
    </TableHead>
  );
}

function Pager({ view, total, from, to }: { view: View; total: number; from: number; to: number }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(view.page, pages);
  return (
    <div className="user-pager">
      <p>{total === 0 ? "0 records" : `${from}–${to} of ${total}`}</p>
      <div>
        <a aria-disabled={current <= 1} href={current <= 1 ? undefined : hrefFor({ ...view, page: current - 1 })}>Previous</a>
        <span>{current} / {pages}</span>
        <a aria-disabled={current >= pages} href={current >= pages ? undefined : hrefFor({ ...view, page: current + 1 })}>Next</a>
      </div>
    </div>
  );
}

function Badge({ tone, children }: { tone: string; children: string }) {
  return <span className="user-badge" data-tone={tone}>{children}</span>;
}

function ReturnFields({ view }: { view: View }) {
  const fields = returnFields(view);
  return (
    <>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
    </>
  );
}

function returnFields(view: View) {
  return {
    returnQ: view.q,
    returnFilter: view.filter,
    returnSort: view.sort,
    returnDir: view.dir,
    returnPage: String(view.page),
  };
}

function readView(params: { tab?: string; q?: string; filter?: string; sort?: string; dir?: string; page?: string }): View {
  const tab = tabs.some(([id]) => id === params.tab) ? (params.tab as View["tab"]) : "accounts";
  const defaults = { accounts: "created", privileges: "assigned", history: "when" } as const;
  const allowed = {
    accounts: ["created", "name", "email", "status"],
    privileges: ["name", "role", "assignedBy", "assigned"],
    history: ["when", "action", "account", "by"],
  }[tab];
  const sort = allowed.includes(params.sort ?? "") ? params.sort! : defaults[tab];
  const page = Math.max(1, Number(params.page) || 1);
  return {
    tab,
    q: (params.q ?? "").trim(),
    filter: params.filter || "all",
    sort,
    dir: params.dir === "asc" ? "asc" : "desc",
    page,
  };
}

function hrefFor(view: View) {
  const params = new URLSearchParams({ tab: view.tab, sort: view.sort, dir: view.dir });
  if (view.q) params.set("q", view.q);
  if (view.filter !== "all") params.set("filter", view.filter);
  if (view.page > 1) params.set("page", String(view.page));
  return `/admin/users?${params.toString()}`;
}

function includesQuery(values: string[], query: string) {
  if (!query) return true;
  const needle = query.toLowerCase();
  return values.some((value) => value.toLowerCase().includes(needle));
}

function compare(left: string | number, right: string | number, dir: "asc" | "desc") {
  const result = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), undefined, { sensitivity: "base" });
  return dir === "asc" ? result : -result;
}

function pageOf<T>(rows: T[], page: number) {
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages);
  const start = (current - 1) * pageSize;
  return {
    rows: rows.slice(start, start + pageSize),
    total: rows.length,
    from: rows.length === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, rows.length),
  };
}

function historyDetail(action: string, detail: string) {
  if (!detail) return "";
  if (action === "privilege_granted" || action === "privilege_removed") return privilegeLabel[detail] ?? detail;
  if (action === "status_changed") {
    return detail.replace(/\b(student|teacher|parent|staff)\b/g, (word) => statusLabel[word] ?? word);
  }
  return detail;
}
