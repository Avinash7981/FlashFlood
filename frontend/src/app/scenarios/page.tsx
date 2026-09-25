/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { useState, Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { RiskMap } from "@/components/map/RiskMap";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Play, ArrowRight, Activity, TrendingUp, TrendingDown, Minus, Map, ArrowUp, ArrowDown } from "lucide-react";

interface ScenarioResponse {
  location_id: number;
  location_name: string;
  baseline_score: number;
  scenario_score: number;
  score_delta: number;
  baseline_band: string;
  scenario_band: string;
  changed_drivers: any[];
  explanation: string;
  baseline_priority_score: number;
  scenario_priority_score: number;
  baseline_rank: number;
  scenario_rank: number;
  rank_delta: number;
  data_mode: string;
  geom: Record<string, unknown>;
}

const BAND_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-500",
  HIGH: "bg-orange-500",
  WATCH: "bg-yellow-500",
  LOW: "bg-green-500",
};

import { useSearchParams } from "next/navigation";

function ScenariosContent() {
  const searchParams = useSearchParams();
  const initialLoc = searchParams.get("location");
  const [rainfallMod, setRainfallMod] = useState(1.0);
  const [saturationMod, setSaturationMod] = useState(1.0);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ScenarioResponse[] | null>(null);

  const [mapMode, setMapMode] = useState<"BASELINE" | "SCENARIO">("SCENARIO");
  const [sortField, setSortField] = useState<"scenario_score" | "score_delta">("scenario_score");

  const runScenario = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8000/api/scenarios/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rainfall_modifier: rainfallMod,
          saturation_modifier: saturationMod
        })
      });
      if (!res.ok) throw new Error("Failed to run scenario");
      const data = await res.json();
      setResults(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const resetScenario = () => {
    setRainfallMod(1.0);
    setSaturationMod(1.0);
    setResults(null);
    setError(null);
  };

  const getBandBadge = (band: string) => (
    <Badge className={BAND_COLORS[band] || "bg-zinc-500"}>{band}</Badge>
  );

  const sortedResults = results ? [...results].sort((a, b) => {
    if (sortField === "scenario_score") return b.scenario_score - a.scenario_score;
    return b.score_delta - a.score_delta;
  }) : [];

  const locationsAffected = results ? results.filter(r => r.score_delta > 0).length : 0;
  const bandTransitions = results ? results.filter(r => r.baseline_band !== r.scenario_band).length : 0;
  const maxRisk = results ? Math.max(...results.map(r => r.scenario_score)) : 0;
  const scenarioGeojson = results ? {
    type: "FeatureCollection",
    features: results.map(r => ({
      type: "Feature",
      geometry: r.geom,
      properties: {
        location_id: r.location_id,
        location_name: r.location_name,
        risk_score: r.scenario_score,
        risk_band: r.scenario_band,
        baseline_score: r.baseline_score,
        baseline_band: r.baseline_band,
        score_delta: r.score_delta,
        explanation: r.explanation,
        data_mode: r.data_mode
      }
    }))
  } : null;


  return (
    <div className="h-full w-full p-6 overflow-y-auto bg-zinc-950 text-zinc-100 flex flex-col gap-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">What-If Scenario Simulator</h1>
          <p className="text-sm text-zinc-400">Modify environmental conditions to forecast cascading risk.</p>
        </div>
        <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 h-8 px-3">
          MODELLED SCENARIO
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CONTROLS */}
        <Card className="col-span-1 bg-zinc-900 border-zinc-800 flex flex-col">
          <CardHeader className="pb-4 border-b border-zinc-800">
            <CardTitle className="text-lg text-zinc-200 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Scenario Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-8 flex-1">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-zinc-300">Rainfall Modification</label>
                <span className="text-sm font-mono text-blue-400">
                  {rainfallMod >= 1 ? "+" : ""}{((rainfallMod - 1) * 100).toFixed(0)}%
                </span>
              </div>
              <Slider 
                value={[rainfallMod]} 
                min={0.8} max={1.5} step={0.05} 
                onValueChange={(v: number | readonly number[]) => setRainfallMod(Array.isArray(v) ? v[0] : (v as number))} 
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>-20%</span>
                <span>+50%</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-zinc-300">Soil Saturation Modification</label>
                <span className="text-sm font-mono text-blue-400">
                  {saturationMod >= 1 ? "+" : ""}{((saturationMod - 1) * 100).toFixed(0)}%
                </span>
              </div>
              <Slider 
                value={[saturationMod]} 
                min={0.8} max={1.3} step={0.05} 
                onValueChange={(v: number | readonly number[]) => setSaturationMod(Array.isArray(v) ? v[0] : (v as number))} 
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>-20%</span>
                <span>+30%</span>
              </div>
            </div>
          </CardContent>
          <div className="p-4 border-t border-zinc-800 flex gap-3">
            <Button onClick={runScenario} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Run Scenario
            </Button>
            <Button onClick={resetScenario} variant="outline" className="border-zinc-700 hover:bg-zinc-800">
              Reset
            </Button>
          </div>
        </Card>

        {/* SUMMARY & RESULTS */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
          
          {error && (
            <div className="p-4 bg-red-950/50 border border-red-900 rounded-md text-red-200 text-sm">
              Unable to run scenario: {error}
            </div>
          )}

          {!results && !loading && !error && (
            <Card className="bg-zinc-900 border-zinc-800 flex-1 flex items-center justify-center min-h-[300px]">
               <div className="text-center text-zinc-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No scenario has been run yet.</p>
                  <p className="text-xs mt-1">Adjust parameters and click &quot;Run Scenario&quot;</p>
               </div>
            </Card>
          )}

          {loading && !results && (
             <Card className="bg-zinc-900 border-zinc-800 flex-1 flex items-center justify-center min-h-[300px]">
               <div className="text-center text-zinc-500 flex flex-col items-center">
                  <RefreshCw className="w-8 h-8 animate-spin mb-3 text-blue-500" />
                  <p>Running scenario calculations...</p>
               </div>
             </Card>
          )}

          {results && (
            <>
              {/* Top Summary Blocks */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Locations Affected</p>
                    <p className="text-2xl font-bold text-white">{locationsAffected}</p>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Band Transitions</p>
                    <p className="text-2xl font-bold text-white">{bandTransitions}</p>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Highest Risk</p>
                    <p className="text-2xl font-bold text-red-400">{maxRisk.toFixed(1)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Avg Delta</p>
                    <p className="text-2xl font-bold text-blue-400">
                      +{(results.reduce((acc, r) => acc + r.score_delta, 0) / results.length).toFixed(1)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* WHY DID IT CHANGE? */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="py-4 border-b border-zinc-800 bg-zinc-900/50">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
                    Why did risk change?
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-sm text-zinc-400 mb-4">
                     Rainfall modified by <strong className="text-zinc-200">{((rainfallMod - 1) * 100).toFixed(0)}%</strong> and soil saturation modified by <strong className="text-zinc-200">{((saturationMod - 1) * 100).toFixed(0)}%</strong>.
                  </p>
                  {/* Just showing the first one as representative of the system context for the demo */}
                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-md">
                     <p className="text-sm text-zinc-300 italic">&quot;{results[0]?.explanation}&quot;</p>
                  </div>
                </CardContent>
              </Card>

              {/* TABLE */}
              <Card className="bg-zinc-900 border-zinc-800 overflow-hidden flex-1">
                <CardHeader className="py-3 border-b border-zinc-800 flex flex-row items-center justify-between bg-zinc-900/50">
                  <CardTitle className="text-sm font-semibold text-zinc-300">Affected Locations</CardTitle>
                  <div className="flex gap-2 text-xs">
                    <Button variant={sortField === "scenario_score" ? "secondary" : "ghost"} size="sm" onClick={() => setSortField("scenario_score")} className="h-7">By Risk</Button>
                    <Button variant={sortField === "score_delta" ? "secondary" : "ghost"} size="sm" onClick={() => setSortField("score_delta")} className="h-7">By Delta</Button>
                  </div>
                </CardHeader>
                <div className="overflow-auto max-h-[400px]">
                  <Table>
                    <TableHeader className="bg-zinc-950 sticky top-0 z-10">
                      <TableRow className="border-zinc-800 hover:bg-zinc-950">
                        <TableHead className="text-zinc-400">Location</TableHead>
                        <TableHead className="text-zinc-400 text-right">Baseline</TableHead>
                        <TableHead className="text-zinc-400 text-center">Transition</TableHead>
                        <TableHead className="text-zinc-400 text-center">Priority Rank</TableHead>
                        <TableHead className="text-zinc-400 text-right">Scenario</TableHead>
                        <TableHead className="text-zinc-400 text-right">Delta</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedResults.map((r) => (
                        <TableRow key={r.location_id} className="border-zinc-800/50 hover:bg-zinc-800/30">
                          <TableCell className="font-medium text-zinc-200">{r.location_name}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-zinc-400">{r.baseline_score.toFixed(1)}</span>
                              {getBandBadge(r.baseline_band)}
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-zinc-600">
                             {r.baseline_band !== r.scenario_band ? <ArrowRight className="w-4 h-4 mx-auto text-blue-500" /> : <Minus className="w-4 h-4 mx-auto" />}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end gap-1">
                              <span className="font-bold text-white">{r.scenario_score.toFixed(1)}</span>
                              {getBandBadge(r.scenario_band)}
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            <div className="flex flex-col items-center">
                              <span className="text-zinc-300 font-bold">#{r.scenario_rank}</span>
                              {r.rank_delta > 0 ? (
                                <span className="text-red-400 text-xs flex items-center"><ArrowUp className="w-3 h-3"/> {r.rank_delta}</span>
                              ) : r.rank_delta < 0 ? (
                                <span className="text-green-400 text-xs flex items-center"><ArrowDown className="w-3 h-3"/> {Math.abs(r.rank_delta)}</span>
                              ) : (
                                <span className="text-zinc-500 text-xs">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {r.score_delta > 0 ? (
                              <span className="flex items-center justify-end text-red-400 text-sm font-mono">
                                <TrendingUp className="w-3 h-3 mr-1" /> +{r.score_delta.toFixed(1)}
                              </span>
                            ) : r.score_delta < 0 ? (
                              <span className="flex items-center justify-end text-green-400 text-sm font-mono">
                                <TrendingDown className="w-3 h-3 mr-1" /> {r.score_delta.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-zinc-500 text-sm font-mono">0.0</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>

              {/* SCENARIO MAP */}
              <Card className="bg-zinc-900 border-zinc-800 flex flex-col h-[500px]">
                <CardHeader className="py-3 border-b border-zinc-800 flex flex-row items-center justify-between bg-zinc-900/50">
                  <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                    <Map className="w-4 h-4 text-blue-500" />
                    Spatial Impact Map
                  </CardTitle>
                  <div className="flex gap-2 text-xs">
                    <Button variant={mapMode === "BASELINE" ? "secondary" : "ghost"} size="sm" onClick={() => setMapMode("BASELINE")} className="h-7">Baseline</Button>
                    <Button variant={mapMode === "SCENARIO" ? "secondary" : "ghost"} size="sm" onClick={() => setMapMode("SCENARIO")} className="h-7">Scenario</Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 relative overflow-hidden">
                   <RiskMap mode={mapMode} scenarioGeojson={scenarioGeojson || undefined} />
                </CardContent>
              </Card>

            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default function ScenariosPage() {
  return (
    <Suspense fallback={<div>Loading Scenarios...</div>}>
      <ScenariosContent />
    </Suspense>
  );
}
