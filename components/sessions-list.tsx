"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  Eye,
  Loader2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Session {
  id: string;
  status: "pending" | "completed" | "error";
  started_at: string;
  ended_at: string | null;
  title_override: string | null;
  created_at: string;
  agents: {
    id: string;
    title: string;
    difficulty: string;
    language: string;
  } | null;
}

interface SessionsListProps {
  sessions: Session[];
}

export function SessionsList({ sessions: initialSessions }: SessionsListProps) {
  const t = useTranslations("sessions");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [sessions, setSessions] = useState(initialSessions);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const dateLocale = locale === "pl" ? pl : enUS;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
            {t("statusCompleted")}
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            {t("statusPending")}
          </Badge>
        );
      case "error":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            {t("statusError")}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleDelete = async () => {
    if (!sessionToDelete) return;

    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("id", sessionToDelete);

      if (error) throw error;

      // Remove from local state
      setSessions((prev) => prev.filter((s) => s.id !== sessionToDelete));
      toast.success(t("deleteSuccess"));
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(t("deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="mb-4 rounded-full bg-muted p-3">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">{t("noSessions")}</h3>
          <p className="mb-4 text-center text-sm text-muted-foreground">
            {t("noSessionsDescription")}
          </p>
          <Link href="/agents">
            <Button>{t("browseAgents")}</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {sessions.map((session) => {
          const title =
            session.title_override || session.agents?.title || t("untitled");
          const timeAgo = formatDistanceToNow(new Date(session.created_at), {
            addSuffix: true,
            locale: dateLocale,
          });

          return (
            <Card key={session.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(session.status)}
                    <div>
                      <CardTitle className="text-xl">{title}</CardTitle>
                      <CardDescription className="mt-1">
                        {session.agents?.title && session.title_override && (
                          <span className="text-sm">
                            {t("agent")}: {session.agents.title}
                            {" • "}
                          </span>
                        )}
                        <time className="text-sm">{timeAgo}</time>
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(session.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Link href={`/sessions/${session.id}`}>
                      <Button variant="default" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        {session.status === "completed"
                          ? t("viewDetails")
                          : t("viewStatus")}
                      </Button>
                    </Link>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSessionToDelete(session.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("deleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
