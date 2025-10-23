"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface AgentFormProps {
  agent?: {
    id: string;
    title: string;
    shortDescription: string;
    instructions: string;
    difficulty: string;
    language: string;
    tags: string[];
    elevenAgentId: string;
    elevenWebhookSecret: string;
    isActive: boolean;
    displayOrder: number;
    thumbnailPath: string;
  };
}

export function AgentForm({ agent }: AgentFormProps) {
  const router = useRouter();
  const t = useTranslations("admin.agents.form");
  const tCommon = useTranslations("common");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: agent?.title || "",
    shortDescription: agent?.shortDescription || "",
    instructions: agent?.instructions || "",
    difficulty: agent?.difficulty || "beginner",
    language: agent?.language || "pl",
    tags: agent?.tags?.join(", ") || "",
    elevenAgentId: agent?.elevenAgentId || "",
    elevenWebhookSecret: agent?.elevenWebhookSecret || "",
    isActive: agent?.isActive ?? true,
    displayOrder: agent?.displayOrder || 0,
    thumbnailPath: agent?.thumbnailPath || "",
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Set custom validation messages in Polish
  const handleInvalid = (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    target.setCustomValidity("Proszę wypełnić to pole.");
  };

  const handleInput = (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.setCustomValidity("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let thumbnailPath = formData.thumbnailPath;

      // Upload thumbnail if new file selected
      if (thumbnailFile) {
        setIsUploadingImage(true);
        const uploadFormData = new FormData();
        uploadFormData.append("file", thumbnailFile);

        const uploadResponse = await fetch("/api/upload/agent-thumbnail", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          console.error("Upload Error:", uploadResponse.status, errorData);
          throw new Error(`Failed to upload thumbnail: ${uploadResponse.status}`);
        }

        const uploadData = await uploadResponse.json();
        console.log("Upload successful:", uploadData);
        thumbnailPath = uploadData.path;
        setIsUploadingImage(false);
      }

      const url = agent
        ? `/api/admin/agents/${agent.id}`
        : "/api/admin/agents";
      const method = agent ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          shortDescription: formData.shortDescription,
          instructions: formData.instructions,
          difficulty: formData.difficulty,
          language: formData.language,
          tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
          elevenAgentId: formData.elevenAgentId,
          elevenWebhookSecret: formData.elevenWebhookSecret,
          isActive: formData.isActive,
          displayOrder: formData.displayOrder,
          thumbnailPath,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", response.status, errorData);
        throw new Error(`Failed to save agent: ${response.status}`);
      }

      toast.success(agent ? "Agent zaktualizowany" : "Agent dodany");
      router.push("/admin/agents");
      router.refresh();
    } catch (error) {
      console.error("Save agent error:", error);
      toast.error(`Nie udało się zapisać agenta: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
      setIsUploadingImage(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{agent ? "Edytuj agenta" : "Nowy agent"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("title")}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              onInvalid={handleInvalid}
              onInput={handleInput}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription">{t("shortDescription")}</Label>
            <Textarea
              id="shortDescription"
              value={formData.shortDescription}
              onChange={(e) =>
                setFormData({ ...formData, shortDescription: e.target.value })
              }
              onInvalid={handleInvalid}
              onInput={handleInput}
              required
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">{t("instructions")}</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) =>
                setFormData({ ...formData, instructions: e.target.value })
              }
              placeholder={t("instructionsPlaceholder")}
              rows={5}
            />
            <p className="text-sm text-muted-foreground">
              {t("instructionsHelp")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="elevenWebhookSecret">{t("elevenWebhookSecret")}</Label>
            <Input
              id="elevenWebhookSecret"
              value={formData.elevenWebhookSecret}
              onChange={(e) =>
                setFormData({ ...formData, elevenWebhookSecret: e.target.value })
              }
              placeholder="wsec_..."
            />
            <p className="text-sm text-muted-foreground">
              {t("elevenWebhookSecretHelp")}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="difficulty">{t("difficulty")}</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) =>
                  setFormData({ ...formData, difficulty: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Początkujący</SelectItem>
                  <SelectItem value="intermediate">Średniozaawansowany</SelectItem>
                  <SelectItem value="advanced">Zaawansowany</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">{t("language")}</Label>
              <Select
                value={formData.language}
                onValueChange={(value) =>
                  setFormData({ ...formData, language: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pl">Polski</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="elevenAgentId">{t("elevenAgentId")}</Label>
            <Input
              id="elevenAgentId"
              value={formData.elevenAgentId}
              onChange={(e) =>
                setFormData({ ...formData, elevenAgentId: e.target.value })
              }
              onInvalid={handleInvalid}
              onInput={handleInput}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">{t("tags")}</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              placeholder="tag1, tag2, tag3"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail">
              Miniatura (zalecany rozmiar: 800x450px, proporcje 16:9, max 4MB)
            </Label>
            <div className="flex items-center gap-4">
              <label
                htmlFor="thumbnail"
                className="inline-flex cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
              >
                {t("chooseFile")}
              </label>
              <input
                id="thumbnail"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Check file size (4MB limit)
                    const MAX_SIZE = 4 * 1024 * 1024; // 4MB
                    if (file.size > MAX_SIZE) {
                      toast.error(`Plik jest za duży (${(file.size / 1024 / 1024).toFixed(2)}MB). Maksymalny rozmiar to 4MB.`);
                      e.target.value = ''; // Clear input
                      return;
                    }
                    setThumbnailFile(file);
                  }
                }}
                disabled={isSubmitting || isUploadingImage}
                className="hidden"
              />
              <span className="text-sm text-muted-foreground">
                {thumbnailFile ? thumbnailFile.name : t("noFileChosen")}
              </span>
            </div>
            {isUploadingImage && (
              <p className="text-xs text-muted-foreground">
                Przesyłanie i przetwarzanie obrazu...
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="displayOrder">{t("displayOrder")}</Label>
              <Input
                id="displayOrder"
                type="number"
                value={formData.displayOrder}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    displayOrder: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="isActive">{t("isActive")}</Label>
              <Select
                value={formData.isActive.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, isActive: value === "true" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Aktywny</SelectItem>
                  <SelectItem value="false">Nieaktywny</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Zapisywanie..."
                : agent
                  ? tCommon("save")
                  : "Dodaj agenta"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/agents")}
              disabled={isSubmitting}
            >
              {tCommon("cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
