"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { useParams, useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Loader2 } from "lucide-react";

interface Session {
  id: string;
  user_id: string;
  agent_id: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  title_override: string | null;
  created_at: string;
  profiles: {
    id: string;
    email: string;
  };
  agents: {
    id: string;
    title: string;
    difficulty: string;
    language: string;
  };
}

interface Agent {
  id: string;
  title: string;
}

interface User {
  id: string;
  email: string;
}

interface SessionsListProps {
  initialSessions: Session[];
  agents: Agent[];
  users: User[];
}

export function SessionsList({
  initialSessions,
  agents,
  users,
}: SessionsListProps) {
  const t = useTranslations("admin.sessions");
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const dateLocale = locale === "pl" ? pl : enUS;

  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [userFilter, setUserFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    fetchSessions();
  }, [userFilter, agentFilter, statusFilter]);

  const fetchSessions = async () => {
    setIsLoading(true);

    const params = new URLSearchParams();
    if (userFilter !== "all") params.append("userId", userFilter);
    if (agentFilter !== "all") params.append("agentId", agentFilter);
    if (statusFilter !== "all") params.append("status", statusFilter);

    try {
      const response = await fetch(`/api/admin/sessions?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch sessions");

      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter sessions by search query (title or email)
  const filteredSessions = sessions.filter((session) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const title =
      session.title_override || session.agents.title || "";
    const email = Array.isArray(session.profiles)
      ? session.profiles[0]?.email || ""
      : session.profiles?.email || "";
    return title.toLowerCase().includes(query) || email.toLowerCase().includes(query);
  });

  const handleViewSession = (sessionId: string) => {
    router.push(`/${locale}/sessions/${sessionId}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">{t("statusCompleted")}</Badge>;
      case "pending":
        return <Badge variant="secondary">{t("statusPending")}</Badge>;
      case "error":
        return <Badge variant="destructive">{t("statusError")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t("filterByUser")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allUsers")}</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t("filterByAgent")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allAgents")}</SelectItem>
            {agents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t("filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatuses")}</SelectItem>
            <SelectItem value="pending">{t("statusPending")}</SelectItem>
            <SelectItem value="completed">{t("statusCompleted")}</SelectItem>
            <SelectItem value="error">{t("statusError")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            {t("loading")}
          </div>
        ) : (
          t("resultsCount", { count: filteredSessions.length })
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("title")}</TableHead>
              <TableHead>{t("user")}</TableHead>
              <TableHead>{t("agent")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("started")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {t("noSessions")}
                </TableCell>
              </TableRow>
            ) : (
              filteredSessions.map((session) => {
                const profile = Array.isArray(session.profiles)
                  ? session.profiles[0]
                  : session.profiles;
                const agent = Array.isArray(session.agents)
                  ? session.agents[0]
                  : session.agents;

                return (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      {session.title_override || agent?.title || t("untitled")}
                    </TableCell>
                    <TableCell>{profile?.email}</TableCell>
                    <TableCell>{agent?.title}</TableCell>
                    <TableCell>{getStatusBadge(session.status)}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(session.started_at), {
                        addSuffix: true,
                        locale: dateLocale,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewSession(session.id)}
                      >
                        <Eye className="size-4 mr-2" />
                        {t("view")}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
