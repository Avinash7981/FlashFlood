import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

export function Topbar() {
  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-400 font-medium">Region:</span>
        <select className="bg-zinc-900 border border-zinc-800 text-sm rounded-md px-3 py-1.5 text-zinc-200 outline-none focus:ring-1 focus:ring-blue-500">
          <option>North District</option>
        </select>
        <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/10">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2 animate-pulse"></span>
          System Operational
        </Badge>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-sm text-zinc-400 text-right">
          <div>admin@flashguard.demo</div>
          <div className="text-xs text-zinc-500">Disaster Management Authority</div>
        </div>
        <div className="h-9 w-9 bg-zinc-800 rounded-full flex items-center justify-center">
          <User className="h-5 w-5 text-zinc-400" />
        </div>
      </div>
    </header>
  );
}
