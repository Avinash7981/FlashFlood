/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Clock, ShieldAlert, Activity, ArrowUp, ArrowDown, Map } from "lucide-react";
import { RiskMap } from "@/components/map/RiskMap";
import useSWR from "swr";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

const BAND_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-500",
  HIGH: "bg-orange-500",
  WATCH: "bg-yellow-500",
  LOW: "bg-green-500",
};

export default function PriorityCenterPage() {
  const { data: priorities, error, isLoading } = useSWR("/api/priorities", fetcher, { refreshInterval: 10000 });
  const [sortField, setSortField] = useState<"priority_score" | "risk_score" | "exposure">("priority_score");

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center p-6 text-red-500">
        Failed to load priority data.
      </div>
    );
  }

  if (isLoading || !priorities) {
    return (
      <div className="h-full w-full flex items-center justify-center p-6">
        <Activity className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const sortedPriorities = [...priorities].sort((a, b) => {
    if (sortField === "risk_score") return b.risk_score - a.risk_score;
    if (sortField === "exposure") return b.exposure_component - a.exposure_component;
    return b.priority_score - a.priority_score;
  });

  const criticalLocations = priorities.filter((p: any) => p.risk_band === "CRITICAL").length;
  const highPriorityLocations = priorities.filter((p: any) => p.priority_score > 0.5).length;
  const highestPriority = priorities.length > 0 ? priorities[0] : null;
  const priorityGeojson = priorities ? {
    type: "FeatureCollection",
    features: priorities.map((p: any) => ({
      type: "Feature",
      geometry: p.geom,
      properties: {
        location_id: p.location_id,
        location_name: p.location_name,
        priority_rank: p.priority_rank,
        priority_score: p.priority_score,
        risk_band: p.risk_band,
        risk_score: p.risk_score,
        estimated_escalation_window: p.estimated_escalation_window,
        explanation: p.explanation,
        data_mode: p.data_mode
      }
    }))
  } : null;


  return (
    <div className="h-full w-full p-6 overflow-y-auto bg-zinc-950 text-zinc-100 flex flex-col gap-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Response Priority Center</h1>
          <p className="text-sm text-zinc-400">Modelled Response Priority based on Hazard, Exposure, Vulnerability, and Time Criticality.</p>
        </div>
        <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 h-8 px-3">
          SIMULATED / DEMO
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Critical Risk</p>
              <p className="text-2xl font-bold text-white">{criticalLocations}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <ShieldAlert className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">High Priority Actions</p>
              <p className="text-2xl font-bold text-white">{highPriorityLocations}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Activity className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Highest Score</p>
              <p className="text-2xl font-bold text-white">{highestPriority ? highestPriority.priority_score.toFixed(2) : "0.0"}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Target Lead Time</p>
              <p className="text-2xl font-bold text-white">{highestPriority ? highestPriority.estimated_escalation_window : "N/A"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Queue Table */}
      <Card className="bg-zinc-900 border-zinc-800 flex-1 flex flex-col overflow-hidden">
        <CardHeader className="py-4 border-b border-zinc-800 flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-zinc-200">Response Queue</CardTitle>
          <div className="flex gap-2">
            <Badge variant={sortField === "priority_score" ? "default" : "secondary"} className="cursor-pointer" onClick={() => setSortField("priority_score")}>Sort by Priority</Badge>
            <Badge variant={sortField === "risk_score" ? "default" : "secondary"} className="cursor-pointer" onClick={() => setSortField("risk_score")}>Sort by Risk</Badge>
            <Badge variant={sortField === "exposure" ? "default" : "secondary"} className="cursor-pointer" onClick={() => setSortField("exposure")}>Sort by Exposure</Badge>
          </div>
        </CardHeader>
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader className="bg-zinc-950 sticky top-0 z-10">
              <TableRow className="border-zinc-800 hover:bg-zinc-950">
                <TableHead className="text-zinc-400 w-16 text-center">Rank</TableHead>
                <TableHead className="text-zinc-400">Location</TableHead>
                <TableHead className="text-zinc-400 text-center">Risk</TableHead>
                <TableHead className="text-zinc-400 text-center">Score</TableHead>
                <TableHead className="text-zinc-400 text-center">Lead Time</TableHead>
                <TableHead className="text-zinc-400">Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPriorities.map((p: any) => (
                <TableRow key={p.location_id} className="border-zinc-800/50 hover:bg-zinc-800/30">
                  <TableCell className="text-center font-bold text-lg">
                    #{p.priority_rank}
                  </TableCell>
                  <TableCell className="font-medium text-zinc-200">
                    <div className="flex flex-col">
                      <span>{p.location_name}</span>
                      <span className="text-xs text-zinc-500">Exp: {p.exposure_component} | Vuln: {p.vulnerability_component}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={BAND_COLORS[p.risk_band] || "bg-zinc-500"}>{p.risk_band}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-mono font-bold ${p.priority_score > 0.5 ? "text-red-400" : p.priority_score > 0.2 ? "text-orange-400" : "text-green-400"}`}>
                      {p.priority_score.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-sm font-mono text-zinc-300">
                    {p.estimated_escalation_window}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-400 max-w-xs truncate">
                    {p.explanation}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800 flex flex-col h-[500px]">
        <CardHeader className="py-3 border-b border-zinc-800 flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-zinc-200 flex items-center gap-2">
            <Map className="w-5 h-5 text-blue-500" />
            Priority Geography
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 relative overflow-hidden">
           <RiskMap mode="PRIORITY" scenarioGeojson={priorityGeojson} />
        </CardContent>
      </Card>

    </div>
  );
}
