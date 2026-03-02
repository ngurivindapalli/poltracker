"use client";

interface Connection {
  name: string;
  amount?: number;
  totalAmount?: number;
  type?: string;
  relationship?: string;
}

interface InfluenceMapProps {
  connections: Connection[];
  senator: string;
}

export default function InfluenceMap({ connections, senator }: InfluenceMapProps) {
  if (!connections || connections.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-xl font-semibold mb-6 text-gray-900">
          Influence Network
        </h2>
        <div className="text-gray-400 text-center py-8">
          No influence connections available
        </div>
      </div>
    );
  }

  const left = connections.slice(0, 8);
  const right = connections.slice(8, 16);

  const getTypeColor = (type?: string) => {
    switch (type) {
      case "donor":
        return "bg-purple-50 border-purple-200";
      case "investment":
        return "bg-green-50 border-green-200";
      case "ngo":
        return "bg-orange-50 border-orange-200";
      case "lobbyClient":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case "donor":
        return "Donor";
      case "investment":
        return "Investment";
      case "ngo":
        return "NGO";
      case "lobbyClient":
        return "Lobby Client";
      default:
        return "Connection";
    }
  };

  const formatAmount = (conn: Connection) => {
    const amt = conn.totalAmount || conn.amount || 0;
    if (amt > 0) {
      return `$${amt.toLocaleString()}`;
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <h2 className="text-xl font-semibold mb-6 text-gray-900">
        Influence Network
      </h2>

      <div className="flex justify-between items-center min-h-[400px]">
        {/* LEFT COLUMN */}
        <div className="space-y-3 flex-1">
          {left.map((c, i) => (
            <div
              key={i}
              className={`px-4 py-3 rounded-lg border shadow-sm ${getTypeColor(c.type)}`}
            >
              <div className="font-semibold text-gray-900 text-sm">
                {c.name}
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">
                  {getTypeLabel(c.type)}
                </span>
                {formatAmount(c) && (
                  <span className="text-xs font-medium text-gray-700">
                    {formatAmount(c)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CENTER - SENATOR */}
        <div className="px-8 flex-shrink-0">
          <div className="relative">
            {/* Connection lines visual */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-32 h-32 border-2 border-dashed border-gray-200 rounded-full" />
            </div>
            
            <div className="bg-blue-600 text-white px-8 py-6 rounded-xl shadow-lg text-center relative z-10">
              <div className="font-bold text-lg">
                {senator}
              </div>
              <div className="text-xs opacity-80 mt-1">
                US Senator
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-3 flex-1">
          {right.map((c, i) => (
            <div
              key={i}
              className={`px-4 py-3 rounded-lg border shadow-sm ${getTypeColor(c.type)}`}
            >
              <div className="font-semibold text-gray-900 text-sm">
                {c.name}
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">
                  {getTypeLabel(c.type)}
                </span>
                {formatAmount(c) && (
                  <span className="text-xs font-medium text-gray-700">
                    {formatAmount(c)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-purple-200 border border-purple-300" />
          <span className="text-xs text-gray-600">Donors</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-200 border border-green-300" />
          <span className="text-xs text-gray-600">Investments</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-200 border border-orange-300" />
          <span className="text-xs text-gray-600">NGOs</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-200 border border-blue-300" />
          <span className="text-xs text-gray-600">Lobby Clients</span>
        </div>
      </div>
    </div>
  );
}
