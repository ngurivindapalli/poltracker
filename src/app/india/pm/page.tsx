import NewsFeedWithQuery from "@/components/news/NewsFeedWithQuery"
import BackButton from "@/components/BackButton"

export default function PMPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <BackButton />
      <h1 className="text-4xl font-bold mb-4">
        Narendra Modi
      </h1>
      <p className="text-gray-600 mb-8">
        Prime Minister of India
      </p>
      <NewsFeedWithQuery query="Narendra Modi India politics" />
    </div>
  )
}
