import { PageEditors } from "@/components/admin-page-forms";
import { listSitePages } from "@/lib/queries";

export default async function AcademicsAdminPage() {
  const pages = await listSitePages("academics");
  return (
    <>
      <h1>Academics</h1>
      <p>These pages are the Academics menu and its sub-tabs: the programme, awards, admissions, and scholarships.</p>
      <PageEditors pages={pages} />
    </>
  );
}
