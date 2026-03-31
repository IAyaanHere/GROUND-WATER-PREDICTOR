import L from "leaflet";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  CloudRain,
  Database,
  Droplets,
  ExternalLink,
  Gauge,
  Github,
  History,
  Layers,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  Menu,
  Navigation,
  TrendingDown,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";

// Fix Leaflet default icon issue
(L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl =
  undefined;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const CYAN_ICON = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface ApiResponse {
  prediction: number;
  unit: string;
  nearest_data: {
    Rainfall?: number;
    GW_Recharge?: number;
    GW_Extraction?: number;
    Prev_GW?: number;
    [key: string]: number | undefined;
  };
}

type Page = "home" | "about" | "contact";

function getDepthCategory(depth: number) {
  if (depth < 30)
    return {
      label: "Shallow",
      color: "#10B981",
      bg: "rgba(16,185,129,0.15)",
      border: "rgba(16,185,129,0.4)",
    };
  if (depth <= 70)
    return {
      label: "Moderate",
      color: "#F59E0B",
      bg: "rgba(245,158,11,0.15)",
      border: "rgba(245,158,11,0.4)",
    };
  return {
    label: "Deep",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.15)",
    border: "rgba(239,68,68,0.4)",
  };
}

// Map click handler component
function MapClickHandler({
  onMapClick,
}: { onMapClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Fly to location component
function FlyToLocation({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 10, { animate: true, duration: 1.5 });
    }
  }, [map, position]);
  return null;
}

// Glassmorphism styles
const glass = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
};

const glassNavbar = {
  background: "rgba(5,11,24,0.85)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderBottom: "1px solid rgba(0,212,255,0.1)",
};

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [showManualInputs, setShowManualInputs] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLon, setManualLon] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [contactSending, setContactSending] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const predict = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setLocation([lat, lon]);
    try {
      const res = await fetch(
        "https://gw-project-v2.onrender.com/predict-from-location",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ Latitude: lat, Longitude: lon }),
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResponse = await res.json();
      setResult(data);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch {
      toast.error("Server error or API not responding. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGPS = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      setShowManualFallback(true);
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        predict(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLoading(false);
        toast.error("GPS access denied. Please enter location manually.");
        setShowManualFallback(true);
        setShowManualInputs(true);
      },
      { timeout: 10000 },
    );
  }, [predict]);

  const handleManualPredict = useCallback(() => {
    const lat = Number.parseFloat(manualLat);
    const lon = Number.parseFloat(manualLon);
    if (
      Number.isNaN(lat) ||
      Number.isNaN(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      toast.error(
        "Please enter valid latitude (-90 to 90) and longitude (-180 to 180).",
      );
      return;
    }
    predict(lat, lon);
  }, [manualLat, manualLon, predict]);

  const handleContactSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setContactSending(true);
    setTimeout(() => {
      setContactSending(false);
      setContactName("");
      setContactEmail("");
      setContactMsg("");
      toast.success("Message sent! Ayaan will get back to you soon.");
    }, 1200);
  }, []);

  const navTo = (p: Page) => {
    setPage(p);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const NavLink = ({ p, label }: { p: Page; label: string }) => (
    <button
      type="button"
      onClick={() => navTo(p)}
      data-ocid={`nav.${p}.link`}
      className="relative px-3 py-1.5 text-sm font-medium transition-all duration-200"
      style={{ color: page === p ? "#00D4FF" : "rgba(255,255,255,0.7)" }}
    >
      {label}
      {page === p && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
          style={{ background: "#00D4FF" }}
        />
      )}
    </button>
  );

  return (
    <div
      className="min-h-screen font-sans"
      style={{
        background:
          "linear-gradient(135deg, #050B18 0%, #071422 50%, #05101C 100%)",
        fontFamily: "Poppins, system-ui, sans-serif",
      }}
    >
      <Toaster position="top-right" theme="dark" />

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={glassNavbar}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <button
              type="button"
              onClick={() => navTo("home")}
              data-ocid="nav.logo.link"
              className="flex items-center gap-2 text-lg font-bold"
              style={{ color: "#00D4FF" }}
            >
              <span className="text-xl">💧</span>
              <span>AquaStat AI</span>
            </button>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              <NavLink p="home" label="Home" />
              <NavLink p="about" label="About" />
              <NavLink p="contact" label="Contact" />
            </div>

            {/* Mobile hamburger */}
            <button
              type="button"
              className="md:hidden p-2 rounded-lg"
              style={{ color: "rgba(255,255,255,0.7)" }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-ocid="nav.mobile.toggle"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="md:hidden px-4 pb-4 flex flex-col gap-1"
              style={{ background: "rgba(5,11,24,0.98)" }}
            >
              {(["home", "about", "contact"] as Page[]).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => navTo(p)}
                  className="text-left px-3 py-2.5 rounded-lg text-sm font-medium capitalize transition-colors"
                  style={{
                    color: page === p ? "#00D4FF" : "rgba(255,255,255,0.7)",
                    background:
                      page === p ? "rgba(0,212,255,0.08)" : "transparent",
                  }}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* PAGE CONTENT */}
      <div className="pt-16">
        <AnimatePresence mode="wait">
          {page === "home" && (
            <HomePage
              key="home"
              predict={predict}
              handleGPS={handleGPS}
              loading={loading}
              result={result}
              location={location}
              showManualFallback={showManualFallback}
              showManualInputs={showManualInputs}
              setShowManualInputs={setShowManualInputs}
              manualLat={manualLat}
              manualLon={manualLon}
              setManualLat={setManualLat}
              setManualLon={setManualLon}
              handleManualPredict={handleManualPredict}
              resultRef={resultRef}
            />
          )}
          {page === "about" && <AboutPage key="about" />}
          {page === "contact" && (
            <ContactPage
              key="contact"
              contactName={contactName}
              setContactName={setContactName}
              contactEmail={contactEmail}
              setContactEmail={setContactEmail}
              contactMsg={contactMsg}
              setContactMsg={setContactMsg}
              contactSending={contactSending}
              handleContactSubmit={handleContactSubmit}
            />
          )}
        </AnimatePresence>
      </div>

      {/* FOOTER */}
      <footer
        className="py-8 text-center"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            Built with <span style={{ color: "#EF4444" }}>❤️</span> by{" "}
            <span style={{ color: "#00D4FF" }} className="font-medium">
              Muhammad Ayaan
            </span>{" "}
            | Taj Insights
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/IAyaanHere"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-all duration-200 hover:scale-110"
              style={{ color: "rgba(255,255,255,0.5)" }}
              aria-label="GitHub"
            >
              <Github size={18} />
            </a>
            <a
              href="https://www.linkedin.com/in/mohammad-ayaan-81862924b/?skipRedirect=true"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-all duration-200 hover:scale-110"
              style={{ color: "rgba(255,255,255,0.5)" }}
              aria-label="LinkedIn"
            >
              <Linkedin size={18} />
            </a>
          </div>
         <p
  className="text-xs"
  style={{ color: "rgba(255,255,255,0.25)" }}
>
  © {new Date().getFullYear()}. Taj Insights
</p>
        </div>
      </footer>
    </div>
  );
}

// ==================== HOME PAGE ====================
interface HomePageProps {
  predict: (lat: number, lon: number) => Promise<void>;
  handleGPS: () => void;
  loading: boolean;
  result: ApiResponse | null;
  location: [number, number] | null;
  showManualFallback: boolean;
  showManualInputs: boolean;
  setShowManualInputs: (v: boolean) => void;
  manualLat: string;
  manualLon: string;
  setManualLat: (v: string) => void;
  setManualLon: (v: string) => void;
  handleManualPredict: () => void;
  resultRef: React.RefObject<HTMLDivElement | null>;
}

function HomePage({
  predict,
  handleGPS,
  loading,
  result,
  location,
  showManualFallback,
  showManualInputs,
  setShowManualInputs,
  manualLat,
  manualLon,
  setManualLat,
  setManualLon,
  handleManualPredict,
  resultRef,
}: HomePageProps) {
  const depth = result?.prediction ?? 0;
  const category = result ? getDepthCategory(depth) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Hero */}
      <section className="relative overflow-hidden px-4 sm:px-6 pt-16 pb-12 text-center">
        {/* BG glow blobs */}
        <div
          className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none opacity-20"
          style={{
            background: "radial-gradient(circle, #00D4FF 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute top-32 left-10 w-64 h-64 rounded-full pointer-events-none opacity-10"
          style={{
            background: "radial-gradient(circle, #0EA5E9 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="relative max-w-3xl mx-auto"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{
              background: "rgba(0,212,255,0.1)",
              border: "1px solid rgba(0,212,255,0.25)",
              color: "#00D4FF",
            }}
          >
            <Gauge size={12} />
            AI-Powered Prediction System
          </div>

          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6"
            style={{
              background:
                "linear-gradient(135deg, #00D4FF 0%, #0EA5E9 50%, #7DD3FC 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            AI-Powered Groundwater Prediction
          </h1>

          <p
            className="text-lg sm:text-xl mb-10 max-w-xl mx-auto"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            Predict underground water levels using location intelligence
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={handleGPS}
              disabled={loading}
              data-ocid="hero.primary_button"
              size="lg"
              className="gap-2 font-semibold px-8 py-6 text-base rounded-xl transition-all duration-200 hover:scale-105"
              style={{
                background: loading
                  ? "rgba(0,212,255,0.3)"
                  : "linear-gradient(135deg, #00D4FF, #0EA5E9)",
                color: "#050B18",
                boxShadow: loading ? "none" : "0 0 30px rgba(0,212,255,0.4)",
                border: "none",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Predicting...
                </>
              ) : (
                <>
                  <Navigation size={18} /> Use My Location
                </>
              )}
            </Button>

            <Button
              onClick={() => {
                setShowManualInputs(true);
                document
                  .getElementById("manual-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              disabled={loading}
              data-ocid="hero.secondary_button"
              size="lg"
              variant="outline"
              className="gap-2 font-semibold px-8 py-6 text-base rounded-xl transition-all duration-200 hover:scale-105"
              style={{
                background: "transparent",
                border: "1px solid rgba(0,212,255,0.4)",
                color: "#00D4FF",
              }}
            >
              <MapPin size={18} /> Enter Manually
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-10 flex justify-center gap-6 flex-wrap"
        >
          {[
            { icon: <Layers size={14} />, text: "ML-Powered" },
            { icon: <Database size={14} />, text: "Atal Bhujal Data" },
            { icon: <MapPin size={14} />, text: "GPS First" },
          ].map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-1.5 text-xs"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              <span style={{ color: "#00D4FF" }}>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </motion.div>
      </section>

      {/* Manual Fallback */}
      <AnimatePresence>
        {(showManualFallback || showManualInputs) && (
          <motion.section
            id="manual-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl mx-auto px-4 sm:px-6 mb-8"
          >
            <div className="rounded-2xl p-6" style={glass}>
              <h3
                className="font-semibold mb-4 flex items-center gap-2"
                style={{ color: "#00D4FF" }}
              >
                <MapPin size={16} /> Enter Location Manually
              </h3>
              {!showManualInputs ? (
                <button
                  type="button"
                  onClick={() => setShowManualInputs(true)}
                  data-ocid="manual.open_modal_button"
                  className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:scale-105"
                  style={{
                    background: "rgba(0,212,255,0.1)",
                    border: "1px solid rgba(0,212,255,0.3)",
                    color: "#00D4FF",
                  }}
                >
                  📍 Enter Location Manually
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="number"
                    placeholder="Latitude (e.g. 20.59)"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    data-ocid="manual.lat.input"
                    className="rounded-xl"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "white",
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Longitude (e.g. 78.96)"
                    value={manualLon}
                    onChange={(e) => setManualLon(e.target.value)}
                    data-ocid="manual.lon.input"
                    className="rounded-xl"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "white",
                    }}
                  />
                  <Button
                    onClick={handleManualPredict}
                    disabled={loading}
                    data-ocid="manual.submit_button"
                    className="whitespace-nowrap rounded-xl font-medium"
                    style={{
                      background: "linear-gradient(135deg, #00D4FF, #0EA5E9)",
                      color: "#050B18",
                      border: "none",
                    }}
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      "Predict Now"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Map Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-10">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            border: "1px solid rgba(0,212,255,0.15)",
            boxShadow: "0 0 40px rgba(0,212,255,0.08)",
          }}
        >
          <div
            className="px-4 py-3 flex items-center gap-2"
            style={{
              background: "rgba(0,212,255,0.05)",
              borderBottom: "1px solid rgba(0,212,255,0.1)",
            }}
          >
            <MapPin size={14} style={{ color: "#00D4FF" }} />
            <span className="text-sm font-medium" style={{ color: "#00D4FF" }}>
              Interactive Map — Click to Predict
            </span>
            <span
              className="ml-auto text-xs"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Click anywhere to get groundwater prediction
            </span>
          </div>
          <div style={{ height: "420px" }}>
            <MapContainer
              center={[20.5937, 78.9629]}
              zoom={5}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <MapClickHandler onMapClick={predict} />
              <FlyToLocation position={location} />
              {location && <Marker position={location} icon={CYAN_ICON} />}
            </MapContainer>
          </div>
        </div>
      </section>

      {/* Result Card */}
      <AnimatePresence>
        {result && (
          <motion.section
            ref={resultRef}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto px-4 sm:px-6 mb-16"
            data-ocid="prediction.card"
          >
            <div
              className="rounded-2xl p-6 sm:p-8"
              style={{ ...glass, border: `1px solid ${category!.border}` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <h2
                    className="text-lg font-semibold mb-1"
                    style={{ color: "rgba(255,255,255,0.8)" }}
                  >
                    Prediction Result
                  </h2>
                  {location && (
                    <p
                      className="text-sm flex items-center gap-1"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      <MapPin size={12} />
                      {location[0].toFixed(4)}, {location[1].toFixed(4)}
                    </p>
                  )}
                </div>
                <Badge
                  className="px-4 py-1.5 text-sm font-semibold rounded-full"
                  style={{
                    background: category!.bg,
                    color: category!.color,
                    border: `1px solid ${category!.border}`,
                  }}
                >
                  {category!.label}
                </Badge>
              </div>

              {/* Depth display */}
              <div
                className="text-center mb-8 py-6 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <p
                  className="text-sm mb-2"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Predicted Groundwater Depth
                </p>
                <p
                  className="text-6xl sm:text-7xl font-bold"
                  style={{ color: category!.color }}
                >
                  {depth.toFixed(1)}
                </p>
                <p
                  className="text-xl font-medium mt-1"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  MBGL
                </p>
                <p className="text-sm mt-3" style={{ color: category!.color }}>
                  {depth < 30
                    ? "✅ Water table is shallow — easily accessible"
                    : depth <= 70
                      ? "⚠️ Moderate depth — standard drilling required"
                      : "🔴 Deep water table — extensive drilling needed"}
                </p>
              </div>

              {/* Nearest Data */}
              {result.nearest_data && (
                <div>
                  <h3
                    className="text-sm font-semibold mb-4"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    Nearest Reference Data Used
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      {
                        key: "Rainfall",
                        label: "Rainfall",
                        icon: <CloudRain size={18} />,
                        unit: "mm",
                      },
                      {
                        key: "GW_Recharge",
                        label: "GW Recharge",
                        icon: <Droplets size={18} />,
                        unit: "BCM",
                      },
                      {
                        key: "GW_Extraction",
                        label: "GW Extraction",
                        icon: <TrendingDown size={18} />,
                        unit: "BCM",
                      },
                      {
                        key: "Prev_GW",
                        label: "Previous GW",
                        icon: <History size={18} />,
                        unit: "MBGL",
                      },
                    ].map(({ key, label, icon, unit }) => {
                      const val = result.nearest_data[key];
                      return (
                        <div
                          key={key}
                          className="rounded-xl p-4 text-center"
                          style={{
                            background: "rgba(0,212,255,0.05)",
                            border: "1px solid rgba(0,212,255,0.1)",
                          }}
                        >
                          <div
                            className="flex justify-center mb-2"
                            style={{ color: "#00D4FF" }}
                          >
                            {icon}
                          </div>
                          <p
                            className="text-xs mb-1"
                            style={{ color: "rgba(255,255,255,0.45)" }}
                          >
                            {label}
                          </p>
                          <p
                            className="font-semibold text-sm"
                            style={{ color: "white" }}
                          >
                            {val !== undefined ? val.toFixed(2) : "N/A"}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "rgba(255,255,255,0.3)" }}
                          >
                            {unit}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center"
            style={{
              background: "rgba(5,11,24,0.75)",
              backdropFilter: "blur(8px)",
            }}
            data-ocid="prediction.loading_state"
          >
            <div className="rounded-2xl p-8 text-center" style={glass}>
              <Loader2
                className="animate-spin mx-auto mb-4"
                size={40}
                style={{ color: "#00D4FF" }}
              />
              <p className="font-semibold" style={{ color: "#00D4FF" }}>
                Analyzing groundwater data...
              </p>
              <p
                className="text-sm mt-1"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                Contacting prediction model
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ==================== ABOUT PAGE ====================
function AboutPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 py-16"
    >
      {/* Project Section */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(0,212,255,0.15)" }}
          >
            <Database size={20} style={{ color: "#00D4FF" }} />
          </div>
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold"
              style={{ color: "white" }}
            >
              About AquaStat AI
            </h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              ML-based groundwater prediction system
            </p>
          </div>
        </div>

        <div className="rounded-2xl p-6 sm:p-8 space-y-5" style={glass}>
          <p style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.8 }}>
            This project predicts groundwater levels using machine learning
            based on spatial and environmental data. By combining historical
            groundwater observations with rainfall patterns, the system provides
            accurate depth estimates (in MBGL) for any location in India.
          </p>

          <div
            className="rounded-xl p-4"
            style={{
              background: "rgba(0,212,255,0.06)",
              border: "1px solid rgba(0,212,255,0.15)",
            }}
          >
            <h3
              className="font-semibold mb-3 flex items-center gap-2"
              style={{ color: "#00D4FF" }}
            >
              <Database size={14} /> Data Sources
            </h3>
            <ul
              className="space-y-2 text-sm"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              <li className="flex items-start gap-2">
                <span className="mt-1" style={{ color: "#00D4FF" }}>
                  →
                </span>
                <span>
                  Atal Bhujal Yojana:{" "}
                  <a
                    href="https://www.data.gov.in/catalog/ground-water-level-data-under-atal-bhujal-yojana"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline inline-flex items-center gap-1"
                    style={{ color: "#00D4FF" }}
                  >
                    data.gov.in <ExternalLink size={10} />
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1" style={{ color: "#00D4FF" }}>
                  →
                </span>
                <span>Combined with rainfall dataset (2015 data)</span>
              </li>
              <li className="flex items-start gap-2">
                <span
                  className="mt-1"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  ℹ
                </span>
                <span style={{ color: "rgba(255,255,255,0.45)" }}>
                  Latest consistent dataset available till 2015
                </span>
              </li>
            </ul>
          </div>

          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{
              background: "rgba(0,212,255,0.08)",
              border: "1px solid rgba(0,212,255,0.25)",
            }}
          >
            <span className="text-lg">🔄</span>
            <p className="text-sm font-medium" style={{ color: "#00D4FF" }}>
              Model will be updated when newer datasets become available.
            </p>
          </div>
        </div>
      </section>

      {/* Developer Section */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(16,185,129,0.15)" }}
          >
            <span className="text-lg">👨‍💻</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: "white" }}>
              About the Developer
            </h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              The mind behind AquaStat AI
            </p>
          </div>
        </div>

        <div className="rounded-2xl p-6 sm:p-8" style={glass}>
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <div
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden"
                style={{
                  border: "3px solid #00D4FF",
                  boxShadow: "0 0 30px rgba(0,212,255,0.4)",
                }}
              >
                <img
                  src="/assets/uploads/image-019d38eb-ece8-72aa-8d75-a04eccbf50f4-1.png"
                  alt="Mohammad Ayaan"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%23071422'/%3E%3Ccircle cx='60' cy='45' r='20' fill='%2300D4FF' opacity='0.4'/%3E%3Cellipse cx='60' cy='85' rx='30' ry='20' fill='%2300D4FF' opacity='0.2'/%3E%3C/svg%3E";
                  }}
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h3
                className="text-2xl font-bold mb-1"
                style={{ color: "white" }}
              >
                Mohammad Ayaan
              </h3>
              <p
                className="text-sm mb-1"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                B.Tech Chemical Engineering
              </p>
              <p className="font-semibold mb-3" style={{ color: "#00D4FF" }}>
                VNIT Nagpur
              </p>

              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-4">
                {["Data Science", "Machine Learning", "Water Systems"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: "rgba(0,212,255,0.1)",
                        color: "#00D4FF",
                        border: "1px solid rgba(0,212,255,0.2)",
                      }}
                    >
                      {tag}
                    </span>
                  ),
                )}
              </div>

              <p
                className="text-sm italic mb-4"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                &ldquo;Building data-driven solutions for real-world
                environmental challenges.&rdquo;
              </p>

              <div className="flex gap-3 justify-center sm:justify-start">
                <a
                  href="https://github.com/IAyaanHere"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.8)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <Github size={15} /> GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/mohammad-ayaan-81862924b/?skipRedirect=true"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
                  style={{
                    background: "rgba(0,119,181,0.2)",
                    color: "#7DD3FC",
                    border: "1px solid rgba(0,119,181,0.3)",
                  }}
                >
                  <Linkedin size={15} /> LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

// ==================== CONTACT PAGE ====================
interface ContactPageProps {
  contactName: string;
  setContactName: (v: string) => void;
  contactEmail: string;
  setContactEmail: (v: string) => void;
  contactMsg: string;
  setContactMsg: (v: string) => void;
  contactSending: boolean;
  handleContactSubmit: (e: React.FormEvent) => void;
}

function ContactPage({
  contactName,
  setContactName,
  contactEmail,
  setContactEmail,
  contactMsg,
  setContactMsg,
  contactSending,
  handleContactSubmit,
}: ContactPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto px-4 sm:px-6 py-16"
    >
      <div className="text-center mb-10">
        <h1
          className="text-3xl sm:text-4xl font-bold mb-3"
          style={{ color: "white" }}
        >
          Get In Touch
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)" }}>
          Have questions about AquaStat AI? Feel free to reach out.
        </p>
      </div>

      <div className="grid sm:grid-cols-5 gap-6">
        {/* Form */}
        <div className="sm:col-span-3">
          <form
            onSubmit={handleContactSubmit}
            className="rounded-2xl p-6"
            style={glass}
          >
            <h2 className="font-semibold mb-5" style={{ color: "#00D4FF" }}>
              Send a Message
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="contact-name"
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  Your Name
                </label>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Your Name"
                  required
                  id="contact-name"
                  data-ocid="contact.name.input"
                  className="rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "white",
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="contact-email"
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  Email Address
                </label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  id="contact-email"
                  data-ocid="contact.email.input"
                  className="rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "white",
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="contact-msg"
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  Message
                </label>
                <Textarea
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  placeholder="Your message..."
                  required
                  rows={5}
                  id="contact-msg"
                  data-ocid="contact.message.textarea"
                  className="rounded-xl resize-none"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "white",
                  }}
                />
              </div>

              <Button
                type="submit"
                disabled={contactSending}
                data-ocid="contact.submit_button"
                className="w-full py-5 font-semibold rounded-xl transition-all hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, #00D4FF, #0EA5E9)",
                  color: "#050B18",
                  border: "none",
                  boxShadow: "0 0 20px rgba(0,212,255,0.3)",
                }}
              >
                {contactSending ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} />{" "}
                    Sending...
                  </>
                ) : (
                  <>📩 Send Message</>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Contact Info */}
        <div className="sm:col-span-2 flex flex-col gap-4">
          <div className="rounded-2xl p-6" style={glass}>
            <h3
              className="font-semibold mb-4"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Contact Details
            </h3>
            <div className="space-y-4">
              <a
                href="mailto:iayaanhere@gmail.com"
                className="flex items-center gap-3 text-sm group"
                data-ocid="contact.email.link"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(0,212,255,0.1)" }}
                >
                  <Mail size={15} style={{ color: "#00D4FF" }} />
                </div>
                <span
                  className="group-hover:underline"
                  style={{ color: "rgba(255,255,255,0.65)" }}
                >
                  iayaanhere@gmail.com
                </span>
              </a>

              <a
                href="https://github.com/IAyaanHere"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm group"
                data-ocid="contact.github.link"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <Github
                    size={15}
                    style={{ color: "rgba(255,255,255,0.7)" }}
                  />
                </div>
                <span
                  className="group-hover:underline"
                  style={{ color: "rgba(255,255,255,0.65)" }}
                >
                  github.com/IAyaanHere
                </span>
              </a>

              <a
                href="https://www.linkedin.com/in/mohammad-ayaan-81862924b/?skipRedirect=true"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm group"
                data-ocid="contact.linkedin.link"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(0,119,181,0.15)" }}
                >
                  <Linkedin size={15} style={{ color: "#7DD3FC" }} />
                </div>
                <span
                  className="group-hover:underline"
                  style={{ color: "rgba(255,255,255,0.65)" }}
                >
                  linkedin.com/in/mohammad-ayaan
                </span>
              </a>
            </div>
          </div>

          <div
            className="rounded-2xl p-5 text-center"
            style={{
              background: "rgba(0,212,255,0.05)",
              border: "1px solid rgba(0,212,255,0.15)",
            }}
          >
            <p className="text-2xl mb-2">💧</p>
            <p className="text-sm font-medium" style={{ color: "#00D4FF" }}>
              AquaStat AI
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Groundwater Prediction System
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
