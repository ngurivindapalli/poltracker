"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import LeaderImage from "@/components/LeaderImage";

interface Leader {
  id: string;
  name: string;
  title: string;
  country: string;
  imageUrl: string;
  link: string;
}

interface LeadersListProps {
  leaders: Leader[];
}

export default function LeadersList({ leaders }: LeadersListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {leaders.map((leader) => (
        <Link 
          key={leader.id} 
          href={leader.link}
          className="block h-full group"
        >
          <Card className="h-full flex flex-col items-center text-center p-6 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
            <div className="relative mb-4">
              <LeaderImage
                src={leader.imageUrl}
                name={leader.name}
                size="w-24 h-24"
              />
            </div>

            <h3 className="text-[18px] font-semibold text-[#1E3A5F] mb-1 group-hover:text-[#2563EB] transition-colors">
              {leader.name}
            </h3>
            
            <p className="text-[14px] text-[#64748B] mb-3">
              {leader.title}
            </p>

            <Badge variant="neutral">
              {leader.country}
            </Badge>
          </Card>
        </Link>
      ))}
    </div>
  );
}
