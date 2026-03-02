import ClientImage from "@/components/ClientImage";

export default function LeaderHero() {
  return (
    <div className="mx-auto mb-8 max-w-3xl rounded-3xl border bg-white p-6 text-center shadow-sm">
      <div className="mx-auto relative h-24 w-24 overflow-hidden rounded-full border bg-gray-50">
        <ClientImage
          src="/images/placeholder-avatar.svg"
          alt="Narendra Modi"
          fill
          className="object-cover"
          sizes="96px"
          fallbackSrc="/images/placeholder-avatar.svg"
        />
      </div>
      <h2 className="mt-4 text-2xl font-bold text-gray-900">Narendra Modi</h2>
      <div className="text-sm text-gray-600">Prime Minister of India</div>
    </div>
  );
}
