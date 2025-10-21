import { getTranslations } from "next-intl/server"
import { createClient } from "@/lib/supabase/server"
import { AgentCard } from "@/components/agent-card"

export default async function AgentsPage() {
  const t = await getTranslations("agents")
  const tAgent = await getTranslations("agent")
  const supabase = await createClient()

  // Fetch active agents, ordered by display_order
  const { data: agents, error } = await supabase
    .from("agents")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })

  if (error) {
    console.error("Error fetching agents:", error)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Agents Grid */}
      {!agents || agents.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-muted">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold">{t("noAgents")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("noAgentsDescription")}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={{
                id: agent.id,
                title: agent.title,
                shortDescription: agent.short_description,
                difficulty: agent.difficulty,
                language: agent.language,
                tags: agent.tags || [],
                thumbnailPath: agent.thumbnail_path,
              }}
              difficultyLabel={
                tAgent(`difficulty.${agent.difficulty}`)
              }
              languageLabel={tAgent(`language.${agent.language}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
