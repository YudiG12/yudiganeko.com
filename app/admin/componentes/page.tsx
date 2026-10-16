import AdminBar from "@/components/journal/admin/admin-bar";
import ComponentLibrary from "@/components/journal/admin/component-library-loader";
import { adminApi } from "@/lib/journal/admin";
import { isAdmin } from "@/lib/journal/auth";

export default async function ComponentsPage() {
  if (!(await isAdmin())) return null;
  const components = await adminApi.listComponents();
  return (
    <>
      <AdminBar />
      <ComponentLibrary initial={components} />
    </>
  );
}
