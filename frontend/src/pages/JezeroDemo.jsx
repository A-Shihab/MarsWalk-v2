import { useEffect, useState } from "react";
import MarsMap from "../components/MarsMap";
import { planRoverMission } from "../services/api";
import { DEFAULT_ROVER } from "../services/roverDefaults";

const START = { x: 3251, y: 2079 };
const STOP = { x: 3134, y: 2147 };
const MAP_SOURCE = "https://doi.org/10.3133/sim3464";
const INITIAL_BUDGET = { pace: "0.65", science: "12", reserve: "5", available: "30" };
const BUDGET_FIELDS = [
  ["pace", "Walking pace (m/s)", 0.01, 0.05],
  ["science", "Science time (min)", 0, 1],
  ["reserve", "Return reserve (min)", 0, 1],
  ["available", "Available time (min)", 1, 1],
];
const SLOPE_LEGEND = [
  ["0–<5°", "#46ab8e"],
  ["5–<15°", "#eac955"],
  ["15–<25°", "#f48e46"],
  ["≥25°", "#ee4754"],
];

function WalkingBudget({ route }) {
  const [budget, setBudget] = useState(INITIAL_BUDGET);
  const { pace, science, reserve, available } = Object.fromEntries(
    Object.entries(budget).map(([key, value]) => [key, Number(value)])
  );
  const valid = BUDGET_FIELDS.every(([key, , min]) => (
    budget[key] !== "" && Number.isFinite(Number(budget[key])) && Number(budget[key]) >= min
  ));
  const outboundMinutes = route?.outbound_distance_m / pace / 60;
  const returnMinutes = route?.return_distance_m / pace / 60;
  const latestDeparture = available - returnMinutes - reserve;
  const margin = latestDeparture - outboundMinutes - science;

  return (
    <section className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-5">
      <h2 className="text-xl font-bold">Illustrative walking budget</h2>
      <div className="grid grid-cols-2 gap-3">
        {BUDGET_FIELDS.map(([key, label, min, step]) => (
          <label key={key} className="space-y-1 text-xs font-medium text-slate-300">
            {label}
            <input
              className="block w-full rounded-lg border border-slate-600 bg-slate-950 p-2 text-base text-white"
              type="number"
              min={min}
              step={step}
              value={budget[key]}
              onChange={event => setBudget({ ...budget, [key]: event.target.value })}
            />
          </label>
        ))}
      </div>
      {!valid && <p role="alert" className="text-sm text-amber-200">Enter a positive pace and available time, and nonnegative science and reserve times.</p>}
      {valid && route && (
        <div className="space-y-3 rounded-lg bg-slate-950 p-3">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-2"><dt>Walk out</dt><dd>{outboundMinutes.toFixed(1)} min · {route.outbound_distance_m.toFixed(1)} m</dd></div>
            <div className="flex justify-between gap-2"><dt>Walk back</dt><dd>{returnMinutes.toFixed(1)} min · {route.return_distance_m.toFixed(1)} m</dd></div>
            <div className="flex justify-between gap-2">
              <dt>Leave stop by</dt>
              <dd>{latestDeparture >= 0 ? `${latestDeparture.toFixed(1)} min after start` : "No return window"}</dd>
            </div>
          </dl>
          <p className={margin >= 0 ? "text-sm text-emerald-300" : "text-sm text-amber-200"} aria-live="polite">
            {Math.abs(margin).toFixed(1)} min {margin >= 0 ? "spare after reserve" : "over budget with reserve"}
          </p>
        </div>
      )}
      <p className="text-xs leading-5 text-slate-400">
        The prototype grid search uses a 25° terrain-slope cap. The time model uses distance ÷ pace and omits suit, fatigue and surface-traction effects.
      </p>
    </section>
  );
}

export default function JezeroDemo({ onSupportTrip }) {
  const [route, setRoute] = useState(null);
  const [geology, setGeology] = useState([]);
  const [routeError, setRouteError] = useState("");
  const [geologyError, setGeologyError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [basemap, setBasemap] = useState("ctx");
  const [showSlope, setShowSlope] = useState(true);
  const [showGeology, setShowGeology] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    planRoverMission({
      start_pixel: START,
      destination_pixel: STOP,
      algorithm: "astar",
      route_mode: "safest",
      rover: DEFAULT_ROVER,
    }, controller.signal).then(result => {
      if (result.status !== "success") throw new Error(result.message);
      if (!controller.signal.aborted) setRoute(result);
    }).catch(error => {
      if (!controller.signal.aborted) setRouteError(error.message);
    });
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/jezero-demo/geology.json", { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error("The geology layer could not load.");
        return response.json();
      })
      .then(setGeology)
      .catch(error => {
        if (!controller.signal.aborted) setGeologyError(error.message);
      });
    return () => controller.abort();
  }, []);

  const routes = route ? [
    { id: "outbound", points: route.outbound_route_pixels, color: "#0e7490", weight: 9, selected: true },
    { id: "return", points: route.return_route_pixels, color: "#fef08a", weight: 4, dashArray: "7 10", selected: true },
  ] : [];

  return (
    <article className="space-y-5 rounded-2xl bg-slate-950 p-4 sm:p-6">
      <header className="max-w-4xl space-y-2">
        <p className="text-sm font-semibold text-orange-300">Jezero region · Southern Nili Planum</p>
        <h1 className="text-3xl font-black text-white sm:text-4xl">Nili wind-ridge stop</h1>
        <p className="text-sm leading-6 text-slate-300 sm:text-base">
          Walk from a simulated staging point on mapped Nili Planum 1 crust (Nnp1) to a mapped eolian bedform field (Aeb).
          Take paired photos with a scale on either side of the contact. Measure ridge orientation and spacing, and check for loose sediment to test the orbital interpretation of wind-shaped deposits.
        </p>
        <p className="text-sm text-slate-400">
          Demo stop · 18.134261° N, 77.282395° E · <a className="underline" href={MAP_SOURCE}>Sun and Stack, USGS SIM 3464</a>
        </p>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <section className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3 text-sm">
            <label className="flex items-center gap-2">
              Orbital image
              <select className="rounded-lg border border-slate-600 bg-slate-950 p-2" value={basemap} onChange={event => setBasemap(event.target.value)}>
                <option value="ctx">MRO · CTX optical</option>
                <option value="themis-night">Mars Odyssey · THEMIS night IR</option>
              </select>
            </label>
            <label><input type="checkbox" checked={showSlope} onChange={event => setShowSlope(event.target.checked)} /> DEM slope</label>
            <label><input type="checkbox" checked={showGeology} onChange={event => setShowGeology(event.target.checked)} /> Mapped geology</label>
          </div>
          <MarsMap
            className="h-[420px] w-full"
            startPoint={START}
            destinationPoint={STOP}
            startLabel="Staging point"
            destinationLabel="Wind-ridge stop"
            focusRoute
            routes={routes}
            basemap={basemap}
            slope={showSlope}
            geology={showGeology ? geology : []}
          />
          <div className="space-y-2 p-3 text-sm text-slate-200">
            {route && (
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                <span><span aria-hidden="true" className="mr-1 inline-block w-6 border-t-4 border-cyan-700" /> Outbound</span>
                <span><span aria-hidden="true" className="mr-1 inline-block w-6 border-t-4 border-dashed border-yellow-200" /> Return</span>
              </div>
            )}
            {showSlope && (
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                <span>Terrain slope</span>
                {SLOPE_LEGEND.map(([label, color]) => (
                  <span key={label}><span className="mr-1 inline-block size-3 rounded-sm" style={{ backgroundColor: color }} /> {label}</span>
                ))}
              </div>
            )}
            {showGeology && <p className="text-xs text-slate-300"><span className="text-cyan-200">Cyan · Aeb eolian bedforms</span> <span className="mx-2 text-violet-200">Violet · Nnp1 crust</span> White · other mapped units</p>}
            {geologyError && <p role="alert" className="text-amber-200">{geologyError}</p>}
            {!route && !routeError && <p role="status">Calculating outbound and return paths…</p>}
            {routeError && (
              <p role="alert" className="text-amber-200">
                {routeError} <button type="button" className="underline" onClick={() => {
                  setRouteError("");
                  setAttempt(attempt + 1);
                }}>Retry demo route</button>
              </p>
            )}
          </div>
        </section>

        <aside className="space-y-3">
          <WalkingBudget route={route} />
          <button
            type="button"
            onClick={() => onSupportTrip({ start: START, destination: STOP })}
            className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-orange-400"
          >
            Plan rover equipment support
          </button>
          <p className="text-xs text-slate-400">Compare rover round trips to the same science stop.</p>
        </aside>
      </div>

      <details open className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm leading-6 text-slate-300">
        <summary className="cursor-pointer font-semibold text-white">Layer sources and alignment</summary>
        <ul className="mt-2 space-y-2">
          <li><strong>MRO Context Camera.</strong> Nili_CTX_Mosaic_Beta01_Feb2018_MTM from USGS SIM 3464. CTX imagery is approximately 6 m/pixel, distributed here on a 5 m grid. Bilinear reprojection to the routing grid footprint.</li>
          <li><strong>Mars Odyssey THEMIS.</strong> nili_THEMIS_NightIR_Controlled_oct2018 from USGS SIM 3464. Controlled nighttime infrared, 100 m source grid, nearest-neighbor reprojection. Display values show relative image brightness.</li>
          <li><strong>Mapped geology.</strong> SIM 3464 Geologic Units layer 8, features 854 (Nnp1) and 597 (Aeb) at the endpoints. Regional interpretation at 1:75,000. Polygons reprojected and clipped to the demo grid.</li>
          <li><strong>DEM slope.</strong> Sobel gradient on the bundled DEM, projected to 1 m cells using bilinear resampling. The source instrument, product ID and native resolution are unconfirmed. The color classes show terrain gradient. Route scoring uses peak grade along the path.</li>
          <li><strong>Coverage.</strong> 18.1013–18.1705° N, 77.2268–77.2960° E (original crop). All layers share the same Mars transverse Mercator display footprint. Optical and IR coverage was checked across the crop. Local positional accuracy is limited by the source products and map scale.</li>
        </ul>
        <p className="mt-2"><a className="text-cyan-200 underline" href={MAP_SOURCE}>USGS SIM 3464 data and credits</a></p>
      </details>
    </article>
  );
}
