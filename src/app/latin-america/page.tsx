import { LatinAmericaHub } from "@/components/international/LatinAmericaHub"
import { InternationalNewsFeed } from "@/components/international/InternationalNewsFeed"
import { CommentSection } from "@/components/comments/CommentSection"

export const metadata = {
  title: "Latin America Politics | Politeia",
  description: "Politics across Mexico, Brazil, Argentina, and Latin America.",
}

export default function LatinAmericaPage() {
  return (
    <div className="section space-y-12">
      <div className="space-y-2 pb-6 border-b border-border">
        <h1 className="text-3xl font-bold text-foreground">Latin America</h1>
        <p className="text-muted-foreground text-base">
          Central America, South America, and the Caribbean.
        </p>
      </div>

      <LatinAmericaHub />

      <div className="border-t border-border pt-10">
        <InternationalNewsFeed
          query="Latin America politics Mexico Brazil Argentina Colombia"
          title="Latin America News"
        />
      </div>

      <div className="border-t border-border pt-10">
        <CommentSection entityType="latin-america" entityId="hub" />
      </div>
    </div>
  )
}
