/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import useSWR from "swr";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const fetcher = (url: string) => fetch(`http://localhost:8000${url}`).then((res) => res.json());

const BAND_COLORS = {
  LOW: "#22c55e",
  WATCH: "#f59e0b",
  HIGH: "#f97316",
  CRITICAL: "#ef4444",
};

export function RiskMap({ 
  scenarioGeojson, 
  mode = "BASELINE" 
}: { 
  scenarioGeojson?: any; 
  mode?: "BASELINE" | "SCENARIO" | "DELTA" | "PRIORITY"; 
} = {}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [selectedFeatureProps, setSelectedFeatureProps] = useState<any>(null);

  const { data: geojson } = useSWR("/api/risk", fetcher, { refreshInterval: 10000 });
  const activeGeojson = (mode === "SCENARIO" || mode === "DELTA" || mode === "PRIORITY") && scenarioGeojson ? scenarioGeojson : geojson;
  const { data: locDetails, isLoading: loadingLoc } = useSWR(
    selectedLocationId ? `/api/locations/${selectedLocationId}` : null,
    fetcher
  );

  useEffect(() => {
    if (map.current && map.current.isStyleLoaded() && geojson) {
      const source = map.current.getSource("risk-locations") as maplibregl.GeoJSONSource;
      if (source) {
        source.setData(activeGeojson);
      }
    }
  }, [activeGeojson, geojson]);

  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      const source = map.current.getSource("catchment-source") as maplibregl.GeoJSONSource;
      if (source) {
        if (locDetails && locDetails.catchment_information && locDetails.catchment_information.geometry) {
           source.setData({
             type: "FeatureCollection",
             features: [{
               type: "Feature",
               geometry: locDetails.catchment_information.geometry,
               properties: {}
             }]
           });
        } else {
           source.setData({ type: "FeatureCollection", features: [] });
        }
      }
    }
  }, [locDetails]);


  return (
    <div className="relative w-full h-full flex flex-col">
      <div ref={mapContainer} className="flex-1 w-full" />

      {/* Legend */}
      <div className="absolute bottom-6 right-6 bg-zinc-950/90 p-4 rounded-md border border-zinc-800 backdrop-blur-sm shadow-xl z-10">
        <h4 className="text-sm font-semibold mb-3 text-zinc-200">Risk Bands</h4>
        <div className="space-y-2 text-sm text-zinc-400">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Critical</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div> High</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Watch</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> Low</div>
        </div>
      </div>

      {/* Location Details Drawer */}
      <Sheet open={!!selectedLocationId} onOpenChange={(open) => { if (!open) { setSelectedLocationId(null); setSelectedFeatureProps(null); } }}>
        <SheetContent side="right" className="w-[400px] sm:w-[450px] bg-zinc-950 border-zinc-800 text-zinc-100 overflow-y-auto">
                              {mode === "PRIORITY" && selectedFeatureProps ? (
            <div className="p-6 space-y-6">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-xl font-bold text-white">{selectedFeatureProps.location_name}</SheetTitle>
                <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10">
                  PRIORITY #{selectedFeatureProps.priority_rank}
                </Badge>
              </SheetHeader>
              
              <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-4 flex flex-col items-center">
                      <span className="text-sm text-zinc-500 mb-1">Priority Score</span>
                      <span className="text-2xl font-bold text-white">{Number(selectedFeatureProps.priority_score).toFixed(2)}</span>
                    </CardContent>
                  </Card>
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-4 flex flex-col items-center">
                      <span className="text-sm text-zinc-500 mb-1">Risk Band</span>
                      <Badge className="mt-2" style={{backgroundColor: selectedFeatureProps.risk_band === "CRITICAL" ? "#ef4444" : selectedFeatureProps.risk_band === "HIGH" ? "#f97316" : selectedFeatureProps.risk_band === "WATCH" ? "#eab308" : "#22c55e"}}>{selectedFeatureProps.risk_band}</Badge>
                    </CardContent>
                  </Card>
              </div>

              <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Lead Time</h4>
                    <p className="text-sm text-yellow-400 font-mono">{selectedFeatureProps.estimated_escalation_window}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Why is this priority?</h4>
                    <p className="text-sm text-zinc-300 italic">&quot;{selectedFeatureProps.explanation}&quot;</p>
                  </div>
              </div>
            </div>
          ) : mode !== "BASELINE" && mode !== "PRIORITY" && selectedFeatureProps ? (
            <div className="p-6 space-y-6">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-xl font-bold text-white">{selectedFeatureProps.location_name}</SheetTitle>
                <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10">
                  MODELLED SCENARIO
                </Badge>
              </SheetHeader>
              
              <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-4 flex flex-col items-center">
                      <span className="text-sm text-zinc-500 mb-1">Baseline</span>
                      <span className="text-2xl font-bold text-zinc-300">{Number(selectedFeatureProps.baseline_score).toFixed(1)}</span>
                      <Badge className="mt-2 bg-zinc-800">{selectedFeatureProps.baseline_band}</Badge>
                    </CardContent>
                  </Card>
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-4 flex flex-col items-center">
                      <span className="text-sm text-zinc-500 mb-1">Scenario</span>
                      <span className="text-2xl font-bold text-white">{Number(selectedFeatureProps.risk_score).toFixed(1)}</span>
                      <Badge className="mt-2" style={{backgroundColor: selectedFeatureProps.risk_band === "CRITICAL" ? "#ef4444" : selectedFeatureProps.risk_band === "HIGH" ? "#f97316" : selectedFeatureProps.risk_band === "WATCH" ? "#eab308" : "#22c55e"}}>{selectedFeatureProps.risk_band}</Badge>
                    </CardContent>
                  </Card>
              </div>

              <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-4 flex flex-col items-center">
                      <span className="text-sm text-zinc-500 mb-1">Risk Delta</span>
                      <span className={`text-3xl font-mono font-bold ${Number(selectedFeatureProps.score_delta) > 0 ? "text-red-400" : Number(selectedFeatureProps.score_delta) < 0 ? "text-green-400" : "text-zinc-500"}`}>
                        {Number(selectedFeatureProps.score_delta) > 0 ? "+" : ""}{Number(selectedFeatureProps.score_delta).toFixed(1)}
                      </span>
                  </CardContent>
              </Card>
              
              <div>
                  <h4 className="text-sm font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Scenario Explanation</h4>
                  <p className="text-sm text-zinc-400 italic">&quot;{selectedFeatureProps.explanation}&quot;</p>
              </div>
            </div>
          ) : loadingLoc ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="space-y-2 pt-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          ) : !locDetails ? (
            <div className="p-6 text-zinc-500">Catchment context unavailable</div>
          ) : (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-center justify-between">
                <div className="flex flex-col items-end">
                  <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 mb-1">
                    {typeof locDetails.data_provenance === "string" ? locDetails.data_provenance : "PROVENANCE TRACKED"}
                  </Badge>
                </div>
              </div>
              <SheetDescription className="text-zinc-400">
                Catchment: {locDetails.catchment_information.name}
              </SheetDescription>
              </SheetHeader>

              <div className="space-y-8">
                {/* 1. RISK SCORE & BAND */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-4 flex flex-col items-center justify-center">
                      <span className="text-sm text-zinc-500 mb-1">Risk Score</span>
                      <span className="text-3xl font-bold text-white">{locDetails.current_risk}</span>
                    </CardContent>
                  </Card>
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-4 flex flex-col items-center justify-center">
                      <span className="text-sm text-zinc-500 mb-1">Risk Band</span>
                      <Badge className={
                         locDetails.risk_band === "CRITICAL" ? "bg-red-500" :
                         locDetails.risk_band === "HIGH" ? "bg-orange-500" :
                         locDetails.risk_band === "WATCH" ? "bg-yellow-500" : "bg-green-500"
                      }>{locDetails.risk_band}</Badge>
                    </CardContent>
                  </Card>
                </div>

                {/* 2. RISK EXPLANATION */}
                <div>
                  <h4 className="text-sm font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Why is this location at risk?</h4>
                  <p className="text-sm text-zinc-400 mb-4 italic">&quot;{locDetails.explanation}&quot;</p>
                  
                  <div className="space-y-3">
                    {locDetails.risk_drivers.map((driver: { factor: string, contribution: string, raw_value: string }, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-zinc-900 rounded-md border border-zinc-800/50">
                        <div>
                          <p className="font-medium text-sm text-zinc-200">{driver.factor}</p>
                          <p className="text-xs text-zinc-500 capitalize">{driver.contribution} contribution</p>
                        </div>
                        <div className="text-sm font-mono text-blue-400">{driver.raw_value}</div>
                      </div>
                    ))}
                    {locDetails.risk_drivers.length === 0 && <p className="text-sm text-zinc-500">No significant drivers.</p>}
                  </div>
                </div>

                {/* 3. UPSTREAM DOWNSTREAM */}
                <div>
                   <h4 className="text-sm font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Upstream Context</h4>
                   <p className="text-sm text-zinc-400 p-3 bg-zinc-900 rounded-md border border-zinc-800">
                      {locDetails.upstream_downstream_explanation}
                   </p>
                </div>

                {/* 4. CATCHMENT SUMMARY */}
                <div>
                  <h4 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider">Catchment Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-3 bg-zinc-900 rounded-md border border-zinc-800/50">
                       <span className="block text-zinc-500 text-xs mb-1">Monitored Locations</span>
                       <span className="text-zinc-200">{locDetails.catchment_information.monitored_locations}</span>
                    </div>
                    <div className="p-3 bg-zinc-900 rounded-md border border-zinc-800/50">
                       <span className="block text-zinc-500 text-xs mb-1">Avg Rainfall</span>
                       <span className="text-zinc-200">{locDetails.catchment_information.average_rainfall} mm/hr</span>
                    </div>
                    <div className="p-3 bg-zinc-900 rounded-md border border-zinc-800/50">
                       <span className="block text-zinc-500 text-xs mb-1">Avg Saturation</span>
                       <span className="text-zinc-200">{locDetails.catchment_information.average_soil}%</span>
                    </div>
                    <div className="p-3 bg-zinc-900 rounded-md border border-zinc-800/50">
                       <span className="block text-zinc-500 text-xs mb-1">Avg Slope</span>
                       <span className="text-zinc-200">{locDetails.catchment_information.slope}%</span>
                    </div>
                  </div>
                </div>

                {/* 5. VULNERABILITY */}
                <div>
                  <h4 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider">Vulnerability Profile</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-3 bg-zinc-900 rounded-md border border-zinc-800/50">
                       <span className="block text-zinc-500 text-xs mb-1">Exposure</span>
                       <span className="text-zinc-200">{(locDetails.exposure * 100).toFixed(0)}%</span>
                    </div>
                    <div className="p-3 bg-zinc-900 rounded-md border border-zinc-800/50">
                       <span className="block text-zinc-500 text-xs mb-1">Vulnerability</span>
                       <span className="text-zinc-200">{(locDetails.vulnerability * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                {/* 6. DATA PROVENANCE */}
                {typeof locDetails.data_provenance === "object" && (
                <div>
                  <h4 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider">Data Provenance</h4>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                     {Object.entries(locDetails.data_provenance).map(([key, p]: [string, any]) => (
                        <div key={key} className="p-3 bg-zinc-900 rounded-md border border-zinc-800/50 flex justify-between items-center">
                           <div>
                             <span className="block text-zinc-300 capitalize font-medium">{key}</span>
                             <span className="text-zinc-500 text-xs">{p.source}</span>
                           </div>
                           <div className="text-right">
                             <Badge variant="outline" className={p.source_type === "PUBLIC" ? "border-green-500/30 text-green-400 text-[10px]" : p.source_type === "DERIVED" ? "border-blue-500/30 text-blue-400 text-[10px]" : "border-amber-500/30 text-amber-400 text-[10px]"}>
                               {p.source_type}
                             </Badge>
                             {p.value !== undefined && (
                                <div className="text-xs text-zinc-400 mt-1 font-mono">{Number(p.value).toFixed(1)} {p.unit}</div>
                             )}
                           </div>
                        </div>
                     ))}
                  </div>
                </div>
                )}

                {locDetails.estimated_escalation_window !== "N/A" && (
                   <div className="p-4 bg-orange-950/30 border border-orange-900/50 rounded-md">
                     <h4 className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-1">Escalation Window</h4>
                     <p className="text-sm text-orange-200">{locDetails.estimated_escalation_window}</p>
                   </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
