"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
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

interface Agent {
  id: string;
  title: string;
  short_description: string;
  difficulty: string;
  language: string;
  is_active: boolean;
  eleven_agent_id: string;
}

interface AgentsListProps {
  agents: Agent[];
}

export function AgentsList({ agents: initialAgents }: AgentsListProps) {
  const [agents, setAgents] = useState(initialAgents);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const t = useTranslations("admin.agents");

  const handleDelete = async () => {
    if (!agentToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/agents/${agentToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      setAgents((prev) => prev.filter((a) => a.id !== agentToDelete));
      toast.success("Agent usunięty");
      setDeleteDialogOpen(false);
    } catch {
      toast.error("Nie udało się usunąć agenta");
    } finally {
      setIsDeleting(false);
      setAgentToDelete(null);
    }
  };

  if (agents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("noAgents")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{agent.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {agent.short_description}
                  </p>
                </div>
                <Badge
                  variant={agent.is_active ? "default" : "secondary"}
                  className="ml-2"
                >
                  {agent.is_active ? t("status.active") : t("status.inactive")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <span className="capitalize">{agent.difficulty}</span>
                <span>•</span>
                <span>{agent.language.toUpperCase()}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/admin/agents/${agent.id}`)}
                >
                  <Pencil className="mr-2 h-3 w-3" />
                  {t("edit")}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setAgentToDelete(agent.id);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="mr-2 h-3 w-3" />
                  {t("delete")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              Ta akcja jest nieodwracalna. Agent zostanie trwale usunięty.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
