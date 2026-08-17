import { EuropePoliticsHub } from "@/components/international/EuropePoliticsHub"
import { InternationalNewsFeed } from "@/components/international/InternationalNewsFeed"
import { CommentSection } from "@/components/comments/CommentSection"

export const metadata = {
  title: "Europe Politics | Politeia",
  description: "EU institutions, member states, and European governments.",
}

export default function EuropePage() {
  return (
    <div className="section space-y-12">
      <div className="space-y-2 pb-6 border-b border-border">
        <h1 className="text-3xl font-bold text-foreground">Europe Politics</h1>
        <p className="text-muted-foreground text-base">
          EU member states, NATO allies, and European governments.
        </p>
      </div>

      <EuropePoliticsHub />

      <div className="border-t border-border pt-10">
        <InternationalNewsFeed
          query="European Union politics OR European Parliament OR NATO Europe OR Ukraine politics"
          title="Europe Headlines"
        />
      </div>

      <div className="border-t border-border pt-10">
        <CommentSection entityType="europe" entityId="hub" />
      </div>
    </div>
  )
}
