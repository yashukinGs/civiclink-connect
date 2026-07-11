import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Crosshair, Search, MapPin, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Free OSM raster tiles + Nominatim for geocoding. No API key required.
// Please respect Nominatim's usage policy (1 req/sec, provide a valid Referer).

interface Suggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationPickerProps {
  value: string;
  onChange: (address: string, coords?: { lat: number; lng: number }) => void;
  /** Height in tailwind units, default h-72 */
  heightClass?: string;
  readOnly?: boolean;
}

const OSM_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

const NOMINATIM = "https://nominatim.openstreetmap.org";

export function LocationPicker({
  value,
  onChange,
  heightClass = "h-72",
  readOnly = false,
}: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [searching, setSearching] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Init map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: OSM_STYLE,
      center: [78.9629, 20.5937], // India centroid
      zoom: 4,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    if (!readOnly) {
      map.on("click", (e) => {
        setMarker(e.lngLat.lat, e.lngLat.lng, true);
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  const setMarker = useCallback(
    (lat: number, lng: number, doReverse = false) => {
      const map = mapRef.current;
      if (!map) return;
      if (!markerRef.current) {
        markerRef.current = new maplibregl.Marker({
          color: "hsl(var(--primary))",
          draggable: !readOnly,
        })
          .setLngLat([lng, lat])
          .addTo(map);
        if (!readOnly) {
          markerRef.current.on("dragend", () => {
            const ll = markerRef.current!.getLngLat();
            void reverseGeocode(ll.lat, ll.lng);
          });
        }
      } else {
        markerRef.current.setLngLat([lng, lat]);
      }
      map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 15) });
      if (doReverse) void reverseGeocode(lat, lng);
    },
    [readOnly],
  );

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { Accept: "application/json" } },
      );
      if (!res.ok) throw new Error("reverse failed");
      const data = await res.json();
      const addr = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      onChange(addr, { lat, lng });
    } catch {
      onChange(`${lat.toFixed(5)}, ${lng.toFixed(5)}`, { lat, lng });
    }
  };

  const forwardSearch = async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `${NOMINATIM}/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`,
        { headers: { Accept: "application/json" } },
      );
      const data: Suggestion[] = await res.json();
      setSuggestions(data);
      setShowSuggest(true);
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  };

  const onSearchChange = (v: string) => {
    setSearch(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void forwardSearch(v), 400);
  };

  const pickSuggestion = (s: Suggestion) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    setSearch(s.display_name);
    setShowSuggest(false);
    setMarker(lat, lng, false);
    onChange(s.display_name, { lat, lng });
  };

  const detect = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported on this device.");
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDetecting(false);
        setMarker(pos.coords.latitude, pos.coords.longitude, true);
        toast.success("Location detected.");
      },
      () => {
        setDetecting(false);
        toast.error("Could not detect location. Please search or click on the map.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const clearLocation = () => {
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    setSearch("");
    setSuggestions([]);
    onChange("");
  };

  return (
    <div className="space-y-2">
      {!readOnly && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search || value}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => suggestions.length && setShowSuggest(true)}
              placeholder="Search an address, landmark, or area…"
              className="pl-9 pr-9"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
            {!searching && (search || value) && (
              <button
                type="button"
                onClick={clearLocation}
                aria-label="Clear location"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {showSuggest && suggestions.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-border bg-popover shadow-lg">
                {suggestions.map((s) => (
                  <li key={s.place_id}>
                    <button
                      type="button"
                      onClick={() => pickSuggestion(s)}
                      className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="line-clamp-2">{s.display_name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button type="button" variant="glass" onClick={detect} disabled={detecting}>
            {detecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Crosshair className="h-4 w-4" />
            )}
            Detect
          </Button>
        </div>
      )}
      <div
        ref={mapContainerRef}
        className={`w-full ${heightClass} overflow-hidden rounded-xl border border-border`}
      />
      {!readOnly && (
        <p className="text-xs text-muted-foreground">
          Tip: click anywhere on the map or drag the pin to fine-tune the location.
        </p>
      )}
    </div>
  );
}
