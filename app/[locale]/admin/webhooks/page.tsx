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

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("provider")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("created")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events && events.length > 0 ? (
            events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.provider}</TableCell>
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
                    {event.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(event.created_at), {
                    addSuffix: true,
                    locale: dateLocale,
                  })}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                Brak zdarzeń webhook
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
