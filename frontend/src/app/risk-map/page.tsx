import { RiskMap } from "@/components/map/RiskMap";

export default function RiskMapPage() {
  return (
    <div className="w-full h-full flex flex-col relative">
      <div className="absolute top-4 left-4 z-10 bg-zinc-950/80 backdrop-blur-sm p-3 rounded-md border border-zinc-800 shadow-xl">
         <h1 className="text-lg font-bold text-white">Full Risk Map</h1>
         <p className="text-xs text-zinc-400">Interactive live telemetry view</p>
      </div>
      <div className="flex-1 h-full w-full">
         <RiskMap />
      </div>
    </div>
  );
}
