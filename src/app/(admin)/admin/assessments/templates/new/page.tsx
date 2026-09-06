import { redirect } from "next/navigation";
import { createBlankTemplate } from "@/app/(admin)/admin/assessments/actions";

export const dynamic = "force-dynamic";

export default async function NewTemplateRedirectPage() {
  const res = await createBlankTemplate();
  if (res.success && res.id) {
    redirect(`/admin/assessments/templates/${res.id}?isNew=true`);
  }
  redirect("/admin/assessments");
}
