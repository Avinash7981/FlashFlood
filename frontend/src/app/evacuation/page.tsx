/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Map, AlertTriangle, ArrowRight, Route, ShieldCheck } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RiskMap } from "@/components/map/RiskMap";

const fetcher = (url: string) => fetch(url).then(r => r.json());

function EvacuationPlannerContent() {
  const searchParams = useSearchParams();
  const initialOrigin = searchParams.get("origin");

  const { data: locations, error: locError } = useSWR("/api/locations", fetcher);
  
  const [originId, setOriginId] = useState<string>(initialOrigin || "");
  const [destId, setDestId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  useEffect(() => {
    if (initialOrigin && locations) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOriginId(initialOrigin);
    }
  }, [initialOrigin, locations]);

  const handlePlan = async () => {
    if (!originId || !destId) {
      alert("Please select both origin and destination.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/evacuation/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin_id: parseInt(originId), destination_id: parseInt(destId) })
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        if (data.routes && data.routes.length > 0) {
          const recommended = data.routes.find((r: any) => r.recommendation);
          setSelectedRoute(recommended ? recommended.id : data.routes[0].id);
        }
      } else {
        alert("Unable to calculate evacuation route. Please try again.");
      }
    } catch (e) {
      alert("Routing service unavailable.");
    } finally {
      setLoading(false);
    }
  };

  if (locError) return <div className="p-6 text-red-500">Failed to load locations.</div>;

  const geoJsonMap = result && selectedRoute ? {
    type: "FeatureCollection",
    features: result.routes
      .filter((r: any) => r.id === selectedRoute)
      .map((r: any) => ({
        type: "Feature",
        geometry: r.geometry,
        properties: {
          id: r.id,
          distance: r.distance,
          duration: r.duration,
          flood_exposure: r.flood_exposure
        }
      }))
  } : null;

  return (
    <div className="h-full w-full flex flex-col md:flex-row bg-zinc-950 text-zinc-100 overflow-hidden">
      
      {/* Sidebar Controls */}
      <div className="w-full md:w-96 border-r border-zinc-800 p-6 flex flex-col gap-6 overflow-y-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Evacuation Planner</h1>
          <p className="text-sm text-zinc-400 mb-2">Decision-support routing.</p>
          <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10">
            MODELLED DECISION SUPPORT
          </Badge>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-zinc-200">Route Selection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Origin (Monitored Location)</label>
              <select 
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white"
                value={originId}
                onChange={(e) => setOriginId(e.target.value)}
              >
                <option value="">Select Origin...</option>
                {locations?.map((l: any) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Destination (Safe Zone)</label>
              <select 
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-white"
                value={destId}
                onChange={(e) => setDestId(e.target.value)}
              >
                <option value="">Select Destination...</option>
                {locations?.filter((l: any) => l.is_safe_zone).map((l: any) => (
                  <option key={l.id} value={l.id}>{l.name} (DEMO DESTINATION)</option>
                ))}
                {/* Fallback if no safe zones tagged */}
                {locations?.filter((l: any) => !l.is_safe_zone).map((l: any) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handlePlan} disabled={loading}>
              {loading ? "Calculating route..." : "Plan Evacuation"}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-4 flex-1">
            <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">EVACUATION ROUTE ASSESSMENT</h3>
            
            <div className="flex items-center justify-between text-sm bg-zinc-900 p-3 rounded border border-zinc-800">
              <span className="font-medium text-white">{result.origin.name}</span>
              <ArrowRight className="w-4 h-4 text-zinc-500" />
              <span className="font-medium text-white">{result.destination.name}</span>
            </div>

            <div className="space-y-3">
              {result.routes.map((r: any, idx: number) => (
                <Card 
                  key={r.id} 
                  className={`border cursor-pointer transition-all ${selectedRoute === r.id ? 'border-blue-500 bg-blue-500/5' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'}`}
                  onClick={() => setSelectedRoute(r.id)}
                >
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-white flex items-center gap-2">
                        Route {String.fromCharCode(65 + idx)}
                        {r.recommendation && <Badge className="bg-green-500/20 text-green-400 border-green-500/30">PREFERRED BY MODEL</Badge>}
                      </div>
                      <Badge variant="outline" className="text-zinc-500 border-zinc-700 text-[10px]">{r.source}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <div>
                        <p className="text-zinc-500 text-xs uppercase">Distance</p>
                        <p className="text-zinc-200 font-mono">{r.distance}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500 text-xs uppercase">Travel Time</p>
                        <p className="text-zinc-200 font-mono">{r.duration || "Unavailable"}</p>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-zinc-800/50">
                       <p className="text-zinc-500 text-xs uppercase mb-1">Flood Exposure</p>
                       <div className="flex items-center gap-2">
                         {r.flood_exposure === "HIGH" ? (
                           <AlertTriangle className="w-4 h-4 text-red-500" />
                         ) : (
                           <ShieldCheck className="w-4 h-4 text-green-500" />
                         )}
                         <span className={r.flood_exposure === "HIGH" ? "text-red-400 font-bold" : "text-green-400 font-bold"}>{r.flood_exposure || "Exposure assessment unavailable"}</span>
                       </div>
                    </div>

                    {r.recommendation && (
                      <p className="text-xs text-zinc-400 italic mt-2">
                        Reason: Lower modeled flood exposure.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400 flex gap-2 items-start mt-4">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <p>Does not replace official emergency instructions. Never assume guaranteed safety.</p>
            </div>
          </div>
        )}

      </div>

      {/* Map View */}
      <div className="flex-1 relative bg-zinc-950 flex items-center justify-center">
        {!result ? (
          <div className="text-zinc-600 flex flex-col items-center gap-2">
            <Route className="w-12 h-12 mb-2 opacity-50" />
            <p>Select origin and destination to plan evacuation route.</p>
          </div>
        ) : (
          <RiskMap mode="BASELINE" scenarioGeojson={geoJsonMap} />
        )}
      </div>
    </div>
  );
}

export default function EvacuationPlannerPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EvacuationPlannerContent />
    </Suspense>
  );
}
