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
    short_description: string;
    difficulty: string;
    language: string;
    tags: string[];
    eleven_agent_id: string;
    is_active: boolean;
    display_order: number;
  };
}

export function AgentForm({ agent }: AgentFormProps) {
  const router = useRouter();
  const t = useTranslations("admin.agents.form");
  const tCommon = useTranslations("common");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: agent?.title || "",
    shortDescription: agent?.short_description || "",
    difficulty: agent?.difficulty || "beginner",
    language: agent?.language || "pl",
    tags: agent?.tags?.join(", ") || "",
    elevenAgentId: agent?.eleven_agent_id || "",
    isActive: agent?.is_active ?? true,
    displayOrder: agent?.display_order || 0,
    thumbnailPath: agent?.thumbnail_path || "",
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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
          throw new Error("Failed to upload thumbnail");
        }

        const uploadData = await uploadResponse.json();
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
          difficulty: formData.difficulty,
          language: formData.language,
          tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
          elevenAgentId: formData.elevenAgentId,
          isActive: formData.isActive,
          displayOrder: formData.displayOrder,
          thumbnailPath,
        }),
      });

      if (!response.ok) throw new Error("Failed to save agent");

      toast.success(agent ? "Agent zaktualizowany" : "Agent dodany");
      router.push("/admin/agents");
      router.refresh();
    } catch {
      toast.error("Nie udało się zapisać agenta");
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
              required
              rows={3}
            />
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
              Miniatura (zalecany rozmiar: 800x450px, proporcje 16:9)
            </Label>
            <Input
              id="thumbnail"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setThumbnailFile(file);
                }
              }}
              disabled={isSubmitting || isUploadingImage}
            />
            {isUploadingImage && (
              <p className="text-xs text-muted-foreground">
                Przesyłanie i przetwarzanie obrazu...
              </p>
            )}
            {thumbnailFile && (
              <p className="text-xs text-emerald-600">
                Wybrany plik: {thumbnailFile.name}
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
