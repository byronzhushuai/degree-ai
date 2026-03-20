import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type PlanType = "basic" | "comprehensive";

type ReportRow = {
  id: string;
  file_name: string;
  created_at: string;
  plan: PlanType | string;
  full_report: string | null;
};

function planLabel(plan: string) {
  if (plan === "basic") return "Basic";
  if (plan === "comprehensive") return "Comprehensive";
  return plan;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function DashboardPage() {
  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const { data: reports, error } = await supabase
    .from("reports")
    .select("id, file_name, created_at, plan, full_report")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (reports ?? []) as ReportRow[];

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {user.email}
          </p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:hover:bg-neutral-900"
          >
            Sign out
          </button>
        </form>
      </header>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          Could not load reports: {error.message}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          No reports yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((report) => (
            <li key={report.id}>
              <details className="group rounded-lg border border-neutral-200 dark:border-neutral-800">
                <summary className="flex cursor-pointer list-none flex-col gap-1 px-4 py-3 marker:hidden [&::-webkit-details-marker]:hidden sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {report.file_name}
                  </span>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                    <time dateTime={report.created_at}>
                      {formatDate(report.created_at)}
                    </time>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                      {planLabel(String(report.plan))}
                    </span>
                  </div>
                </summary>
                <div className="border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
                  <pre className="max-h-[min(70vh,32rem)] overflow-auto whitespace-pre-wrap break-words text-sm text-neutral-800 dark:text-neutral-200">
                    {report.full_report ?? "—"}
                  </pre>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
