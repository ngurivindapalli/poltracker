import { CanadaPoliticsHub } from "@/components/international/CanadaPoliticsHub"
import { InternationalNewsFeed } from "@/components/international/InternationalNewsFeed"
import { CommentSection } from "@/components/comments/CommentSection"

export const metadata = {
  title: "Canada Politics | Politeia",
  description: "Canadian federal and provincial politics: leaders, parties, and news.",
}

export default function CanadaPage() {
  return (
    <div className="section space-y-12">
      <div className="flex items-start gap-4 pb-6 border-b border-border">
        <span className="text-5xl" aria-hidden="true">🇨🇦</span>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Canada</h1>
          <p className="text-muted-foreground mt-1">
            Federal and provincial politics: parties, leaders, Parliament, and elections.
          </p>
        </div>
      </div>

      <CanadaPoliticsHub />

      <div className="border-t border-border pt-10">
        <InternationalNewsFeed
          query="Canada politics Parliament Carney federal"
          title="Canada Politics News"
        />
      </div>

      <div className="border-t border-border pt-10">
        <CommentSection entityType="canada" entityId="hub" />
      </div>
    </div>
  )
}
