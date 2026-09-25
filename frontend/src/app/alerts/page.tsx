/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BellRing, CheckCircle, AlertTriangle, ShieldAlert, Clock, Info } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AlertsPage() {
  const { data: alerts, error, isLoading, mutate } = useSWR("/api/alerts", fetcher, { refreshInterval: 10000 });
  const [selectedAlert, setSelectedAlert] = useState<any>(null);

  const handleAcknowledge = async (id: number) => {
    try {
      const res = await fetch(`/api/alerts/${id}/acknowledge`, { method: "POST" });
      if (res.ok) {
        alert("Alert acknowledged successfully.");
        mutate();
        if (selectedAlert?.id === id) setSelectedAlert(null);
      } else {
        alert("Failed to acknowledge alert.");
      }
    } catch (e) {
      alert("Error acknowledging alert.");
    }
  };

  if (error) return <div className="p-6 text-red-500">Failed to load alerts.</div>;
  if (isLoading || !alerts) return <div className="p-6 text-zinc-400">Loading alerts...</div>;

  const newAlerts = alerts.filter((a: any) => a.status === "NEW");
  const ackAlerts = alerts.filter((a: any) => a.status === "ACKNOWLEDGED");
  const criticalCount = alerts.filter((a: any) => a.severity === "CRITICAL").length;
  const highCount = alerts.filter((a: any) => a.severity === "HIGH").length;

  return (
    <div className="h-full w-full flex bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Main Alert List */}
      <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Alert Center</h1>
            <p className="text-sm text-zinc-400">Operational tracking of escalated risk conditions.</p>
          </div>
          <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10">
            SIMULATED / DEMO
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-lg"><AlertTriangle className="w-6 h-6 text-red-500" /></div>
              <div>
                <p className="text-sm text-zinc-400">Critical Alerts</p>
                <p className="text-2xl font-bold text-white">{criticalCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-lg"><ShieldAlert className="w-6 h-6 text-orange-500" /></div>
              <div>
                <p className="text-sm text-zinc-400">High Alerts</p>
                <p className="text-2xl font-bold text-white">{highCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg"><BellRing className="w-6 h-6 text-blue-500" /></div>
              <div>
                <p className="text-sm text-zinc-400">New Actions</p>
                <p className="text-2xl font-bold text-white">{newAlerts.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg"><CheckCircle className="w-6 h-6 text-green-500" /></div>
              <div>
                <p className="text-sm text-zinc-400">Acknowledged</p>
                <p className="text-2xl font-bold text-white">{ackAlerts.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-zinc-900 border-zinc-800 flex-1 flex flex-col">
          <CardHeader className="py-4 border-b border-zinc-800">
            <CardTitle className="text-lg text-zinc-200">Active Alert Stream</CardTitle>
          </CardHeader>
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader className="bg-zinc-950 sticky top-0 z-10">
                <TableRow className="border-zinc-800 hover:bg-zinc-950">
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400">Location</TableHead>
                  <TableHead className="text-zinc-400">Severity</TableHead>
                  <TableHead className="text-zinc-400">Time</TableHead>
                  <TableHead className="text-zinc-400 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((a: any) => (
                  <TableRow 
                    key={a.id} 
                    className={`border-zinc-800/50 cursor-pointer ${selectedAlert?.id === a.id ? 'bg-zinc-800/50' : 'hover:bg-zinc-800/30'}`}
                    onClick={() => setSelectedAlert(a)}
                  >
                    <TableCell>
                      {a.status === "NEW" ? (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 flex w-fit gap-1 items-center"><BellRing className="w-3 h-3"/> NEW</Badge>
                      ) : (
                        <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 flex w-fit gap-1 items-center"><CheckCircle className="w-3 h-3"/> ACK</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-white">{a.location_name}</TableCell>
                    <TableCell>
                      <Badge className={a.severity === "CRITICAL" ? "bg-red-500" : "bg-orange-500"}>{a.severity}</Badge>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">
                      <div className="flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(a.timestamp).toLocaleTimeString()}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      {a.status === "NEW" && (
                        <Button size="sm" variant="outline" className="h-8 border-zinc-700 hover:bg-zinc-800" onClick={(e) => { e.stopPropagation(); handleAcknowledge(a.id); }}>
                          Acknowledge
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Detail Sidebar */}
      {selectedAlert && (
        <div className="w-96 border-l border-zinc-800 bg-zinc-950 p-6 overflow-y-auto flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Alert #{selectedAlert.id}</h3>
            <Badge className={selectedAlert.severity === "CRITICAL" ? "bg-red-500" : "bg-orange-500"}>{selectedAlert.severity}</Badge>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Location</p>
              <p className="text-xl font-bold text-white">{selectedAlert.location_name}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900 p-3 rounded border border-zinc-800">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Risk Score</p>
                <p className="text-lg font-mono text-white">{selectedAlert.risk_score.toFixed(1)}</p>
              </div>
              <div className="bg-zinc-900 p-3 rounded border border-zinc-800">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Risk Band</p>
                <p className="text-lg font-mono text-white">{selectedAlert.risk_band}</p>
              </div>
            </div>

            <div className="bg-zinc-900 p-4 rounded border border-zinc-800">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Info className="w-3 h-3"/> Reason for Alert</p>
              <p className="text-sm text-zinc-300 italic">&quot;{selectedAlert.reason}&quot;</p>
            </div>

            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Detailed Priority Explanation</p>
              <p className="text-sm text-zinc-400 bg-zinc-900 p-3 rounded">{selectedAlert.explanation}</p>
            </div>

            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Top Drivers</p>
              <div className="space-y-2">
                {selectedAlert.top_risk_drivers.map((d: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-zinc-900 px-3 py-2 rounded">
                    <span className="text-sm text-zinc-300">{d.factor}</span>
                    <Badge variant="outline" className="border-zinc-700 text-zinc-400">{d.contribution || "N/A"}</Badge>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {selectedAlert.status === "NEW" && (
            <Button className="w-full mt-auto mb-2" onClick={() => handleAcknowledge(selectedAlert.id)}>
              Mark as Acknowledged
            </Button>
          )}
          <Link href={`/evacuation?origin=${selectedAlert.location_id}`} className="w-full">
             <Button variant="secondary" className="w-full border border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700">
                PLAN EVACUATION
             </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
