import { generateFakeTweets } from "@/lib/fakeTweets";
import { Card } from "@/components/ui/Card";

type FakeTweetsProps = {
  name: string;
};

export default function FakeTweets({ name }: FakeTweetsProps) {
  const tweets = generateFakeTweets(name);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tweets.map((t) => (
        <Card key={t.id} className="p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3 mb-3">
             <div className="w-10 h-10 rounded-full bg-[#E2E8F0] flex-shrink-0 overflow-hidden">
                {/* Placeholder avatar */}
                 <svg className="w-full h-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                 </svg>
             </div>
             <div>
                 <div className="font-bold text-[#111827] text-[15px]">{name}</div>
                 <div className="text-[#64748B] text-[13px]">@{name.replace(/\s+/g, '')}Official</div>
             </div>
          </div>
          
          <div className="text-[15px] text-[#334155] leading-relaxed mb-4">
            {t.text}
          </div>
          
          <div className="flex items-center justify-between text-[13px] text-[#94A3B8] border-t border-[#F1F5F9] pt-3">
             <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 hover:text-red-500 transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {t.likes.toLocaleString()}
                </span>
                <span className="flex items-center gap-1 hover:text-blue-500 transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                     Reply
                </span>
             </div>
            <span>{t.time}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
