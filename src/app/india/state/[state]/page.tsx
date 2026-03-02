import { CMS } from "@/lib/chiefMinisters"
import NewsFeedWithQuery from "@/components/news/NewsFeedWithQuery"
import BackButton from "@/components/BackButton"

export default function StatePage({ params }: { params: { state: string } }) {
  const state = decodeURIComponent(params.state)
  const cm = CMS[state as keyof typeof CMS]

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <BackButton />
      <h1 className="text-4xl font-bold mb-4">
        {state}
      </h1>
      {cm && (
        <div className="bg-white shadow rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-2">
            Chief Minister
          </h2>
          <p className="text-lg mb-1">
            {cm.name}
          </p>
          <p className="text-gray-600">
            {cm.party}
          </p>
        </div>
      )}
      <NewsFeedWithQuery query={`${state} India politics`} />
    </div>
  )
}
