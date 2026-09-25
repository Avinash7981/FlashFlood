"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, MapPin, Activity, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskMap } from "@/components/map/RiskMap";

const fetcher = (url: string) => fetch(`http://localhost:8000${url}`).then((res) => res.json());

export default function Dashboard() {
  const { data: summary, error: summaryError } = useSWR("/api/dashboard/summary", fetcher, { refreshInterval: 10000 });
  const { data: priorities } = useSWR("/api/priorities", fetcher, { refreshInterval: 10000 });
  const { data: statusData } = useSWR("/api/data-sources/status", fetcher, { refreshInterval: 60000 });

  if (summaryError) return <div className="p-6 text-red-500">Failed to load dashboard data. Is the backend running?</div>;

  return (
    <div className="p-6 space-y-6 h-full flex flex-col overflow-y-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Command Center</h2>
          <p className="text-sm text-zinc-400">
            Last updated: {summary ? new Date(summary.last_updated_timestamp).toLocaleTimeString() : <Skeleton className="h-4 w-24 inline-block ml-2" />}
          </p>
        </div>
      </div>

      {/* Top Threat Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-950 border-red-900/50 shadow-sm shadow-red-900/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-red-400">Critical Locations</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{summary ? summary.critical_locations : <Skeleton className="h-8 w-12" />}</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-950 border-orange-900/50 shadow-sm shadow-orange-900/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-orange-400">High-Risk Locations</CardTitle>
            <MapPin className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{summary ? summary.high_risk_locations : <Skeleton className="h-8 w-12" />}</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-zinc-400">Active Alerts</CardTitle>
            <Bell className="w-4 h-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{summary ? summary.active_alerts : <Skeleton className="h-8 w-12" />}</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-zinc-400">Average Risk Score</CardTitle>
            <Activity className="w-4 h-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{summary ? summary.average_risk : <Skeleton className="h-8 w-12" />}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7 flex-1 min-h-[500px]">
        {/* Main Map Area */}
        <Card className="col-span-5 bg-zinc-950 border-zinc-800 flex flex-col overflow-hidden relative min-h-[400px]">
          <CardContent className="p-0 flex-1 relative h-full">
             <RiskMap />
          </CardContent>
        </Card>

        {/* Right Sidebar */}
        <div className="col-span-2 flex flex-col space-y-6">
          {/* Data Source Status */}
          <Card className="bg-zinc-950 border-zinc-800 flex flex-col">
            <CardHeader className="py-4 border-b border-zinc-900">
              <CardTitle className="text-sm font-medium">Data Source Status</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {!statusData ? (
                 <Skeleton className="h-24 w-full" />
              ) : (
                 statusData.map((src: { name: string; status: string; type: string; source_type: string; last_update: string; quality: string }) => (
                   <div key={src.name} className="flex flex-col space-y-1">
                     <div className="flex justify-between items-center">
                       <span className="text-sm font-medium text-zinc-200">{src.name}</span>
                       <Badge variant="outline" className={src.status === "Available" ? "border-green-500/30 text-green-400" : "border-amber-500/30 text-amber-400"}>
                         {src.status}
                       </Badge>
                     </div>
                     <div className="text-xs text-zinc-500 flex justify-between">
                       <span>{src.type}</span>
                       <span className="uppercase text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded">{src.source_type}</span>
                     </div>
                     {src.status === "Unavailable" && (
                       <div className="text-[10px] text-zinc-400 italic">Using deterministic demo fallback</div>
                     )}
                   </div>
                 ))
              )}
            </CardContent>
          </Card>

          {/* Response Priority List */}
          <Card className="bg-zinc-950 border-zinc-800 flex flex-col flex-1">
          <CardHeader className="py-4 border-b border-zinc-900">
            <CardTitle className="text-sm font-medium">Response Priority</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-auto flex-1">
            {!priorities ? (
               <div className="p-4 space-y-4">
                 {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
               </div>
            ) : (
               <div className="divide-y divide-zinc-900">
                 {priorities.map((item: { location_id: number, location_name: string, priority_score: number, reason: string }, index: number) => (
                   <div key={item.location_id} className="p-4 hover:bg-zinc-900/50 cursor-pointer transition-colors">
                     <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm text-zinc-200">
                           <span className="text-zinc-500 text-xs mr-2">{String(index + 1).padStart(2, '0')}</span>
                           {item.location_name}
                        </span>
                        <Badge variant="outline" className={
                           item.priority_score > 60 ? "border-red-500/30 text-red-400" :
                           item.priority_score > 30 ? "border-orange-500/30 text-orange-400" :
                           "border-green-500/30 text-green-400"
                        }>
                           {item.priority_score.toFixed(1)}
                        </Badge>
                     </div>
                     <p className="text-xs text-zinc-500 truncate">{item.reason}</p>
                   </div>
                 ))}
                </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
