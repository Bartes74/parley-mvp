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
  const [testEmail, setTestEmail] = useState("");

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

      toast.success(t("saved"));
    } catch (error) {
      console.error("Error saving email settings:", error);
      toast.error("Nie udało się zapisać ustawień");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!settings.enabled) {
      toast.info(t("testEmailDisabled"));
      return;
    }

    if (!testEmail.trim()) {
      toast.error(t("testEmailRequired"));
      return;
    }

    setIsSendingTest(true);
    try {
      const response = await fetch("/api/admin/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmail.trim() }),
      });

      if (!response.ok) {
        console.error("Test email error:", await response.json().catch(() => ({})));
        throw new Error("Failed to send test email");
      }

      toast.success(t("testEmailSuccess"));
    } catch (error) {
      console.error("Error sending test email:", error);
      toast.error(t("testEmailError"));
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
                <SelectItem value="true">{t("enabledTrue")}</SelectItem>
                <SelectItem value="false">{t("enabledFalse")}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {t("enabledHelp")}
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
              {t("senderNameHelp")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="test_email">{t("testEmailLabel")}</Label>
            <Input
              id="test_email"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder={t("testEmailPlaceholder")}
            />
            <p className="text-sm text-muted-foreground">{t("testEmailHelp")}</p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("saving") : tCommon("save")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSendTestEmail}
              disabled={isSendingTest || !settings.enabled || !testEmail.trim()}
            >
              {isSendingTest ? t("testEmailSending") : t("testEmail")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
