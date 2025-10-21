"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  sessionCount: number;
}

interface UsersListProps {
  users: User[];
  currentUserId: string;
}

export function UsersList({ users: initialUsers, currentUserId }: UsersListProps) {
  const [users, setUsers] = useState(initialUsers);
  const t = useTranslations("admin.users");
  const locale = useLocale();
  const dateLocale = locale === "pl" ? pl : enUS;

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) throw new Error("Failed to update role");

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success(t("roleChanged"));
    } catch {
      toast.error("Nie udało się zmienić roli");
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("email")}</TableHead>
          <TableHead>{t("role")}</TableHead>
          <TableHead>{t("sessions")}</TableHead>
          <TableHead>{t("created")}</TableHead>
          <TableHead className="text-right">{t("changeRole")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => {
          const isCurrentUser = user.id === currentUserId;
          return (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.email}
                {isCurrentUser && (
                  <Badge variant="outline" className="ml-2">
                    You
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                  {t(`roles.${user.role}`)}
                </Badge>
              </TableCell>
              <TableCell>{user.sessionCount}</TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(user.created_at), {
                  addSuffix: true,
                  locale: dateLocale,
                })}
              </TableCell>
              <TableCell className="text-right">
                <Select
                  value={user.role}
                  onValueChange={(value) => handleRoleChange(user.id, value)}
                  disabled={isCurrentUser}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">{t("roles.user")}</SelectItem>
                    <SelectItem value="admin">{t("roles.admin")}</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
