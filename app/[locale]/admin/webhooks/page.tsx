import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type WebhookEvent = {
  id: string;
  provider: string | null;
  event_type: string | null;
  status: string | null;
  payload: unknown;
  error: string | null;
  created_at: string;
};

export default async function AdminWebhooksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("admin.webhooks");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/agents");
  }

  // Fetch recent webhook events
  const { data: events } = await supabase
    .from("webhook_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  const dateLocale = locale === "pl" ? pl : enUS;
  const webhookEvents = (events ?? []) as WebhookEvent[];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("provider")}</TableHead>
            <TableHead>{t("event")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("created")}</TableHead>
            <TableHead>{t("details")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {webhookEvents.length > 0 ? (
            webhookEvents.map((event) => {
              const formattedCreatedAt = formatDistanceToNow(new Date(event.created_at), {
                addSuffix: true,
                locale: dateLocale,
              });
              const payloadString = safeStringify(event.payload);
              const payloadObject = (event.payload ?? {}) as Record<string, unknown>;
              const errorMessage = event.error || (payloadObject?.error as string | undefined);
              const dynamicVariables = extractDynamicVariables(payloadObject);

              return (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.provider ?? "—"}</TableCell>
                <TableCell className="text-sm">{event.event_type ?? "—"}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      event.status === "processed"
                        ? "default"
                        : event.status === "failed"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {event.status ?? "unknown"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{formattedCreatedAt}</TableCell>
                <TableCell className="max-w-[280px] whitespace-normal text-sm">
                  <details>
                    <summary className="cursor-pointer text-sm text-muted-foreground">
                      {errorMessage ? t("detailsSummaryError") : t("detailsSummary")}
                    </summary>
                    <div className="mt-3 space-y-2">
                      {errorMessage ? (
                        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                          {errorMessage}
                        </div>
                      ) : null}
                      {dynamicVariables ? (
                        <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs">
                          <span className="font-semibold">{t("dynamicVars")}:</span>{" "}
                          <span className="font-mono">
                            {dynamicVariables.session_id ?? "—"}
                          </span>
                        </div>
                      ) : null}
                      <pre className="max-h-64 overflow-auto rounded-md bg-muted/60 p-3 text-xs leading-relaxed">
                        {payloadString}
                      </pre>
                    </div>
                  </details>
                </TableCell>
              </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Brak zdarzeń webhook
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function safeStringify(payload: unknown): string {
  try {
    return JSON.stringify(payload ?? {}, null, 2);
  } catch {
    return "[Unable to display payload]";
  }
}

function extractDynamicVariables(payload: Record<string, unknown>) {
  const dynamicVars = payload?.conversation_initiation_client_data as
    | { dynamic_variables?: Record<string, string> }
    | undefined;

  if (dynamicVars?.dynamic_variables) {
    return dynamicVars.dynamic_variables;
  }

  return null;
}
