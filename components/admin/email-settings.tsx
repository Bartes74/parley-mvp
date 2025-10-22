"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface EmailSettingsProps {
  initialSettings: {
    enabled: boolean;
    sender_name: string;
  };
}

export function EmailSettings({ initialSettings }: EmailSettingsProps) {
  const t = useTranslations("admin.settings.email");
  const tCommon = useTranslations("common");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [settings, setSettings] = useState(initialSettings);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "email",
          value: settings,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      toast.success("Ustawienia email zapisane");
    } catch (error) {
      console.error("Error saving email settings:", error);
      toast.error("Nie udało się zapisać ustawień");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendTestEmail = async () => {
    setIsSendingTest(true);
    try {
      // TODO: Implement test email endpoint
      toast.info("Funkcja wysyłania testowego e-maila będzie dostępna wkrótce");
    } catch (error) {
      console.error("Error sending test email:", error);
      toast.error("Nie udało się wysłać testowego e-maila");
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="enabled">{t("enabled")}</Label>
            <Select
              value={settings.enabled.toString()}
              onValueChange={(value) =>
                setSettings({ ...settings, enabled: value === "true" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Włączone</SelectItem>
                <SelectItem value="false">Wyłączone</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Włącz lub wyłącz powiadomienia e-mail dla użytkowników
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sender_name">{t("senderName")}</Label>
            <Input
              id="sender_name"
              value={settings.sender_name}
              onChange={(e) =>
                setSettings({ ...settings, sender_name: e.target.value })
              }
              required
            />
            <p className="text-sm text-muted-foreground">
              Nazwa która będzie widoczna jako nadawca e-maili
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Zapisywanie..." : tCommon("save")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSendTestEmail}
              disabled={isSendingTest || !settings.enabled}
            >
              {isSendingTest ? "Wysyłanie..." : t("testEmail")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
