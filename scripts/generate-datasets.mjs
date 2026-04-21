/**
 * Generates large mock datasets for Autolokate.
 * Run: npm run generate-data  (needs network to refresh Indian Drive Guide uploads from YouTube RSS)
 *
 * Videos: https://www.youtube.com/feeds/videos.xml?channel_id=UCgpxY44fOGOtG67OE3r5_2A (@IndianDriveGuide)
 * Car images: pools live in `src/data/json/car-image-pools.json` (extend there, then re-run). Listings get 5 unique URLs each.
 * Do not re-add removed Pexels IDs (wrong/off-brand in UI): 1149831, 1149832, 2134070, 4062374.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../src/data/json");
fs.mkdirSync(OUT, { recursive: true });

const POOL_PATH = path.join(__dirname, "../src/data/json/car-image-pools.json");

const unsplash = (id) =>
  `https://images.unsplash.com/photo-${id}?w=1400&q=85&auto=format&fit=crop`;

function uniqueUrls(list) {
  const seen = new Set();
  const out = [];
  for (const u of list) {
    if (!seen.has(u)) {
      seen.add(u);
      out.push(u);
    }
  }
  return out;
}

/** Single source of truth with app + UI fallbacks — extend `car-image-pools.json`, then re-run this script. */
const CAR_POOLS = JSON.parse(fs.readFileSync(POOL_PATH, "utf8"));
const EXTERIOR_POOL = uniqueUrls(CAR_POOLS.exteriors || []);
const INTERIOR_POOL = uniqueUrls(CAR_POOLS.interiors || []);

/** Editorial hero images: exteriors only. */
const EDITORIAL_COVERS = [...EXTERIOR_POOL];

const sample = (arr, i) => arr[i % arr.length];

/**
 * Five images per listing: 3× unique exterior + 2× unique interior (no duplicate URLs on one listing).
 * `_brand` kept for API stability with existing call sites.
 */
function carImageSet(_brand, seed) {
  const ext = EXTERIOR_POOL;
  const int = INTERIOR_POOL;
  const used = new Set();
  const picks = [];

  function addFrom(pool, base) {
    const n = pool.length;
    if (!n) return;
    for (let t = 0; t < n; t++) {
      const u = pool[(base + t) % n];
      if (!used.has(u)) {
        used.add(u);
        picks.push(u);
        return;
      }
    }
    picks.push(pool[base % n]);
  }

  addFrom(ext, seed);
  addFrom(ext, seed + 19);
  addFrom(ext, seed + 41);
  addFrom(int, seed * 2 + 3);
  addFrom(int, seed * 2 + 29);
  return picks;
}

const CITIES = [
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
  "Indore",
  "Kochi",
  "Chandigarh",
];

const COLORS = [
  "Pearl Arctic White",
  "Midnight Black",
  "Magnetic Grey",
  "Atlas Blue",
  "Crimson Red",
  "Bronze Gold",
  "Glacier Silver",
  "Forest Green",
  "Sunset Orange",
  "Stellar Blue",
];

const DEFAULT_RATE = 9.8;

function estimateEmi(price) {
  const principal = price * 0.85;
  const r = DEFAULT_RATE / 100 / 12;
  const n = 60;
  const pow = (1 + r) ** n;
  return Math.round((principal * r * pow) / (pow - 1));
}

function buildPriceHistory(price) {
  const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];
  return months.map((month, j) => ({
    month,
    price: Math.round(price * (1 + (months.length - 1 - j) * 0.005)),
  }));
}

function buildInspection(i) {
  const base = [
    { category: "Exterior & panels", score: 92 - (i % 5), maxScore: 100 },
    { category: "Tyres & brakes", score: 88 - (i % 4), maxScore: 100 },
    { category: "Engine bay", score: 90, maxScore: 100 },
    { category: "Interior & electronics", score: 85 - (i % 3), maxScore: 100 },
    { category: "Underbody", score: 87, maxScore: 100 },
  ];
  return base.map((b) => ({
    ...b,
    status: b.score >= 86 ? "pass" : "attention",
  }));
}

function buildOwnership(i) {
  return [
    {
      date: `${2017 + (i % 6)}`,
      title: "First registration",
      detail: "Dealer delivery with PDI checklist on file",
    },
    {
      date: `${2020 + (i % 4)}`,
      title: "Ownership event",
      detail: i % 2 === 0 ? "Single owner retained service history" : "Fleet exit — full RTO trail",
    },
    { date: "2025-11", title: "Recent service", detail: "Authorized workshop · documented invoice" },
  ];
}

function buildService(i) {
  return [
    { date: "2025-09-02", label: "Scheduled service + consumables", kms: 32000 + (i % 8) * 900 },
    { date: "2025-01-18", label: "Alignment & balancing", kms: 24000 + (i % 8) * 900 },
    { date: "2024-06-10", label: "Recall / software update", kms: 18000 + (i % 8) * 900 },
  ];
}

function buildFeatures(i) {
  const all = [
    "LED projector headlamps",
    "Wireless Apple CarPlay",
    "Ventilated front seats",
    "360° surround camera",
    "ADAS — lane + AEB",
    "Panoramic sunroof",
    "Branded premium audio",
    "15W wireless charging",
    "Multi drive modes",
    "Hill descent control",
    "6 airbags",
    "Connected telematics",
    "10.25\" digital cluster",
    "Leatherette upholstery",
    "Rear AC vents",
    "Tyre pressure monitor",
  ];
  return [
    all[i % all.length],
    all[(i + 4) % all.length],
    all[(i + 9) % all.length],
    all[(i + 13) % all.length],
  ];
}

const MODELS = [
  { brand: "Maruti Suzuki", model: "Swift", variant: "ZXI+ AMT", fuel: "Petrol", transmission: "Automatic", body: "Hatchback" },
  { brand: "Maruti Suzuki", model: "Baleno", variant: "Alpha", fuel: "Petrol", transmission: "Manual", body: "Hatchback" },
  { brand: "Maruti Suzuki", model: "Grand Vitara", variant: "Alpha+ Hybrid", fuel: "Hybrid", transmission: "e-CVT", body: "SUV" },
  { brand: "Maruti Suzuki", model: "Fronx", variant: "Zeta Turbo AT", fuel: "Petrol", transmission: "Automatic", body: "SUV" },
  { brand: "Maruti Suzuki", model: "Jimny", variant: "Alpha", fuel: "Petrol", transmission: "Manual", body: "SUV" },
  { brand: "Hyundai", model: "Creta", variant: "SX(O) Diesel AT", fuel: "Diesel", transmission: "Automatic", body: "SUV" },
  { brand: "Hyundai", model: "Venue", variant: "N Line DCT", fuel: "Petrol", transmission: "DCT", body: "SUV" },
  { brand: "Hyundai", model: "Verna", variant: "SX(O) IVT", fuel: "Petrol", transmission: "CVT", body: "Sedan" },
  { brand: "Hyundai", model: "Ioniq 5", variant: "Long Range", fuel: "Electric", transmission: "Automatic", body: "SUV" },
  { brand: "Tata", model: "Nexon", variant: "Creative+ AMT", fuel: "Petrol", transmission: "Automatic", body: "SUV" },
  { brand: "Tata", model: "Nexon EV", variant: "Max LR", fuel: "Electric", transmission: "Automatic", body: "SUV" },
  { brand: "Tata", model: "Harrier", variant: "XZ+ Diesel AT", fuel: "Diesel", transmission: "Automatic", body: "SUV" },
  { brand: "Tata", model: "Safari", variant: "Adventure Persona", fuel: "Diesel", transmission: "Automatic", body: "SUV" },
  { brand: "Tata", model: "Punch", variant: "Creative AMT", fuel: "Petrol", transmission: "Automatic", body: "SUV" },
  { brand: "Mahindra", model: "XUV700", variant: "AX7 Diesel AT", fuel: "Diesel", transmission: "Automatic", body: "SUV" },
  { brand: "Mahindra", model: "Scorpio N", variant: "Z8 L 4WD", fuel: "Diesel", transmission: "Manual", body: "SUV" },
  { brand: "Mahindra", model: "Thar", variant: "LX Diesel AT", fuel: "Diesel", transmission: "Automatic", body: "SUV" },
  { brand: "Mahindra", model: "XUV3XO", variant: "AX7 AT", fuel: "Petrol", transmission: "Automatic", body: "SUV" },
  { brand: "Mahindra", model: "BE 6", variant: "Pack Three", fuel: "Electric", transmission: "Automatic", body: "SUV" },
  { brand: "Honda", model: "City", variant: "ZX CVT", fuel: "Petrol", transmission: "CVT", body: "Sedan" },
  { brand: "Honda", model: "Elevate", variant: "ZX CVT", fuel: "Petrol", transmission: "CVT", body: "SUV" },
  { brand: "Honda", model: "Amaze", variant: "VX CVT", fuel: "Petrol", transmission: "CVT", body: "Sedan" },
  { brand: "Toyota", model: "Innova Hycross", variant: "VX Hybrid", fuel: "Hybrid", transmission: "e-CVT", body: "MPV" },
  { brand: "Toyota", model: "Fortuner", variant: "Legender 4x4 AT", fuel: "Diesel", transmission: "Automatic", body: "SUV" },
  { brand: "Toyota", model: "Hyryder", variant: "V Hybrid", fuel: "Hybrid", transmission: "e-CVT", body: "SUV" },
  { brand: "Kia", model: "Seltos", variant: "GTX+ Diesel AT", fuel: "Diesel", transmission: "Automatic", body: "SUV" },
  { brand: "Kia", model: "Carens", variant: "Luxury Plus DCT", fuel: "Petrol", transmission: "DCT", body: "MPV" },
  { brand: "Kia", model: "Sonet", variant: "X-Line DCT", fuel: "Petrol", transmission: "DCT", body: "SUV" },
  { brand: "MG", model: "Hector", variant: "Sharp DCT", fuel: "Petrol", transmission: "DCT", body: "SUV" },
  { brand: "MG", model: "ZS EV", variant: "Excite", fuel: "Electric", transmission: "Automatic", body: "SUV" },
  { brand: "MG", model: "Windsor EV", variant: "Essence", fuel: "Electric", transmission: "Automatic", body: "SUV" },
  { brand: "Skoda", model: "Kushaq", variant: "Style TSI AT", fuel: "Petrol", transmission: "Automatic", body: "SUV" },
  { brand: "Skoda", model: "Slavia", variant: "Style TSI AT", fuel: "Petrol", transmission: "Automatic", body: "Sedan" },
  { brand: "Volkswagen", model: "Taigun", variant: "GT Plus DSG", fuel: "Petrol", transmission: "DCT", body: "SUV" },
  { brand: "Volkswagen", model: "Virtus", variant: "GT Plus DSG", fuel: "Petrol", transmission: "DCT", body: "Sedan" },
  { brand: "Citroën", model: "C3 Aircross", variant: "Max Shine AT", fuel: "Petrol", transmission: "Automatic", body: "SUV" },
  { brand: "Nissan", model: "Magnite", variant: "Turbo CVT", fuel: "Petrol", transmission: "CVT", body: "SUV" },
  { brand: "Renault", model: "Kiger", variant: "RXZ Turbo X-Tronic", fuel: "Petrol", transmission: "CVT", body: "SUV" },
  { brand: "Jeep", model: "Compass", variant: "Model S 4x4", fuel: "Diesel", transmission: "Automatic", body: "SUV" },
  { brand: "Mercedes-Benz", model: "GLC", variant: "300 4MATIC", fuel: "Petrol", transmission: "Automatic", body: "SUV" },
  { brand: "Mercedes-Benz", model: "C-Class", variant: "C200", fuel: "Petrol", transmission: "Automatic", body: "Sedan" },
  { brand: "BMW", model: "3 Series", variant: "330i M Sport", fuel: "Petrol", transmission: "Automatic", body: "Sedan" },
  { brand: "BMW", model: "X1", variant: "sDrive18i M Sport", fuel: "Petrol", transmission: "Automatic", body: "SUV" },
  { brand: "Audi", model: "Q3", variant: "40 TFSI Premium Plus", fuel: "Petrol", transmission: "Automatic", body: "SUV" },
  { brand: "Audi", model: "A4", variant: "40 TFSI", fuel: "Petrol", transmission: "Automatic", body: "Sedan" },
  { brand: "Volvo", model: "XC60", variant: "B5 Ultimate", fuel: "Petrol", transmission: "Automatic", body: "SUV" },
  { brand: "Land Rover", model: "Defender", variant: "110 SE D300", fuel: "Diesel", transmission: "Automatic", body: "SUV" },
  { brand: "Porsche", model: "Macan", variant: "GTS", fuel: "Petrol", transmission: "Automatic", body: "SUV" },
];

const RAW_COMPANIES = [
  { slug: "spin-city-motors", name: "Spin City Motors", tagline: "Certified. Transparent. Same-day test drives.", city: "Mumbai" },
  { slug: "apex-auto-gallery", name: "Apex Auto Gallery", tagline: "Performance to daily drivers — curated.", city: "Bengaluru" },
  { slug: "nord-reserve-automotive", name: "Nord Reserve Automotive", tagline: "EV-forward with battery health reports.", city: "Gurugram" },
  { slug: "velocity-pre-owned", name: "Velocity Pre-Owned", tagline: "Fast listings. Faster approvals.", city: "Hyderabad" },
  { slug: "platinum-drive", name: "Platinum Drive", tagline: "White-glove delivery nationwide.", city: "Pune" },
  { slug: "urbancar-collective", name: "UrbanCar Collective", tagline: "City SUVs and hatchbacks.", city: "Chennai" },
  { slug: "highway-select", name: "Highway Select", tagline: "Diesel tourers & ADAS sedans.", city: "Ahmedabad" },
  { slug: "metro-motorsport", name: "Metro Motorsport", tagline: "Track DNA. Street legal.", city: "Kolkata" },
  { slug: "deccan-auto-hub", name: "Deccan Auto Hub", tagline: "South India's largest inspected lot.", city: "Hyderabad" },
  { slug: "bandra-premium-motors", name: "Bandra Premium Motors", tagline: "Sea-link test drives, valet pickup.", city: "Mumbai" },
  { slug: "indi-ev-exchange", name: "Indi EV Exchange", tagline: "Battery SOH on every listing.", city: "Bengaluru" },
  { slug: "capital-classified", name: "Capital Classified Motors", tagline: "Delhi NCR's dealer-grade CPO.", city: "New Delhi" },
  { slug: "coastal-car-concierge", name: "Coastal Car Concierge", tagline: "Monsoon-ready inspections.", city: "Kochi" },
  { slug: "pink-city-automotive", name: "Pink City Automotive", tagline: "Royal Rajasthan delivery lanes.", city: "Jaipur" },
  { slug: "techpark-auto-labs", name: "Techpark Auto Labs", tagline: "Corporate fleet handoffs.", city: "Bengaluru" },
  { slug: "garuda-motors-indore", name: "Garuda Motors Indore", tagline: "Heartland SUVs & MPVs.", city: "Indore" },
  { slug: "safexpress-auto-mart", name: "Safexpress Auto Mart", tagline: "Logistics-backed doorstep evals.", city: "Pune" },
  { slug: "marine-drive-selections", name: "Marine Drive Selections", tagline: "Luxury imports, escrow-ready.", city: "Mumbai" },
  { slug: "tricity-turbo-exchange", name: "Tricity Turbo Exchange", tagline: "Chandigarh–Mohali–Panchkula.", city: "Chandigarh" },
  { slug: "bay-of-bengal-motors", name: "Bay of Bengal Motors", tagline: "Coastal corrosion checks standard.", city: "Chennai" },
  { slug: "western-express-premium", name: "Western Express Premium", tagline: "Mumbai–Ahmedabad corridor specialists.", city: "Mumbai" },
  { slug: "silicon-odyssey-cars", name: "Silicon Odyssey Cars", tagline: "EV routing & home-charger consult.", city: "Hyderabad" },
  { slug: "heritage-auto-hall", name: "Heritage Auto Hall", tagline: "Classic-adjacent modern inventory.", city: "Kolkata" },
  { slug: "zenith-luxury-garage", name: "Zenith Luxury Garage", tagline: "German trio focus — Audi BMW Merc.", city: "Bengaluru" },
];

const BANNERS = [
  "1549317661-bd32c8ce0db2",
  "1492144534655-ae79c964c9d7",
  "1533473359331-0135ef1b58bf",
  "1583121274602-3e2820c69888",
  "1494976388531-d1058494cdd8",
  "1606664515524-ed2f786a0bd6",
  "1552519507-da3b142c6e3d",
  "1593941707882-a5bba14938c7",
  "1619405399517-d7fce0f13302",
  "1503376780353-7e6692767b70",
  "1609521263047-f8f205293f24",
  "1568605117036-5fe5e7bab0b7",
  "1519641471654-76ce0107ad1b",
];

function companyAddress(city) {
  const map = {
    Mumbai: "BKC Trade Centre, Unit 18, Mumbai 400051",
    Bengaluru: "Embassy Tech Village, Bengaluru 560103",
    Gurugram: "Cyber Hub Lane 4, Gurugram 122002",
    Hyderabad: "HITEC City Rd, Hyderabad 500081",
    Pune: "Koregaon Park Annex, Pune 411001",
    Chennai: "OMR Padur, Chennai 603103",
    Ahmedabad: "SG Highway Mile 12, Ahmedabad 380054",
    Kolkata: "EM Bypass East, Kolkata 700107",
    Kochi: "Edappally Bypass, Kochi 682024",
    Jaipur: "C-Scheme Moti Dungri Rd, Jaipur 302004",
    Indore: "Ring Road Super Corridor, Indore 452010",
    Chandigarh: "Industrial Area Phase I, Chandigarh 160002",
    "New Delhi": "Vasant Kunj Motorscape, New Delhi 110070",
  };
  return map[city] || `${city} flagship lot — pin on file`;
}

function buildCompanies() {
  return RAW_COMPANIES.map((r, i) => ({
    id: `co-${String(i + 1).padStart(2, "0")}`,
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    description: `${r.name} operates a multi-bay inspection facility in ${r.city}. Every listing includes odometer audit photos, service history stubs, and mock escrow handoff — structured like a scraped marketplace payload with dealer_code AUTOLK-${String(i + 1).padStart(3, "0")}.`,
    city: r.city,
    address: companyAddress(r.city),
    phone: `+91 ${40 + (i % 60)} ${2000 + (i % 7000)} ${1000 + (i % 8000)}`,
    email: `desk@${r.slug.replace(/-/g, "")}.autolokate.mock`,
    website: `https://${r.slug}.example`,
    rating: Math.round((4.3 + (i % 7) * 0.08) * 10) / 10,
    reviewCount: 420 + i * 187 + (i % 50) * 23,
    listingsCount: 0,
    established: `${2008 + (i % 12)}`,
    bannerImage: unsplash(BANNERS[i % BANNERS.length]),
    logoLetter: r.name.replace(/[^A-Z]/gi, "").slice(0, 1).toUpperCase() || "A",
    verified: true,
    dealerReviews: [0, 1, 2, 3].map((j) => ({
      id: `co-${i}-dr-${j}`,
      author: ["Fleet buyer · IT", "Verified owner · CA", "Auto enthusiast", "Corporate HR"][j],
      rating: 4 + (j % 2),
      comment: [
        `${r.name} shared inspection clips before we flew in — rare transparency.`,
        "Finance desk clarified processing fee breakdown without pressure.",
        "Car matched the listing pixel-for-pixel; RTO handled in six working days.",
        "Trade-in eval was data-backed; happy to recommend for EV transitions.",
      ][j],
      date: `2025-${String((j + i) % 9 + 1).padStart(2, "0")}-${String(5 + (i + j) % 22).padStart(2, "0")}`,
    })),
  }));
}

function mockReviews(carId, seed) {
  const authors = ["Aditya R.", "Neha S.", "Karan V.", "Ishita M.", "Rahul P.", "Meera I.", "Vikram S."];
  return [0, 1].map((j) => ({
    id: `${carId}-r${j}`,
    author: authors[(seed + j) % authors.length],
    rating: 4 + ((seed + j) % 2) * 0.5,
    title: j === 0 ? "Listing matched reality" : "Minor notes on wear",
    body:
      j === 0
        ? "Autolokate payload showed the same trim and kms at handover; dealer shared service PDFs instantly."
        : "Expect light scuffs on alloys — otherwise mechanically tight after independent scan.",
    date: `2025-${String(((seed + j) % 12) + 1).padStart(2, "0")}-${String(8 + ((seed + j) % 20)).padStart(2, "0")}`,
  }));
}

function buildSpecs(r, year) {
  return {
    "ARAI / claimed efficiency": r.fuel === "Electric" ? "400–500 km (WLTP class)" : "16–23 km/l (cycle dependent)",
    "Displacement / motor": r.fuel === "Electric" ? "Permanent magnet synchronous" : "Turbocharged / NA per BOM",
    Seating: r.body === "MPV" ? "6–7 configurable" : "5",
    "Cargo volume": r.body === "SUV" ? "350–433 L" : "295–420 L",
    "Safety notes": "Refer generation NCAP snapshot on build sheet",
    "RTO region": CITIES[year % CITIES.length],
  };
}

function generateCars(companies) {
  const cars = [];
  let globalIdx = 0;
  for (let ci = 0; ci < companies.length; ci++) {
    const co = companies[ci];
    const perCo = 52 + (ci % 19);
    for (let j = 0; j < perCo; j++) {
      const i = globalIdx;
      const r = MODELS[i % MODELS.length];
      const id = `car-${String(i + 1).padStart(6, "0")}`;
      const year = 2018 + (i % 8);
      const base = 620000 + (i % 900) * 4200 + j * 11000;
      const lux = ["Mercedes-Benz", "BMW", "Audi", "Porsche", "Land Rover", "Volvo"].includes(r.brand);
      const price = lux ? base + 3200000 + (i % 5) * 200000 : base;
      const isNew = i % 17 === 0;
      const kms = isNew ? 120 + (i % 8) * 70 : 6200 + (i % 80) * 1400;
      const owners = isNew ? 0 : 1 + (i % 3);
      const images = carImageSet(r.brand, i);
      const engine =
        r.fuel === "Electric" ? "Permanent magnet motor" : r.fuel === "Diesel" ? "Multijet / CRDi class" : "Turbo petrol / NA";
      const discountPercent = i % 11 === 0 ? 0 : 2 + (i % 9);
      const listPrice = discountPercent === 0 ? price : Math.round(price / (1 - discountPercent / 100));
      const sellerType = i % 6 === 2 ? "Individual" : "Dealer";
      const exteriorColor = COLORS[i % COLORS.length];
      const carbonScore =
        r.fuel === "Electric" ? 92 + (i % 6) : r.fuel === "Hybrid" ? 80 + (i % 5) : 52 + (i % 15);
      const certified = !isNew && i % 4 !== 0;
      const car = {
        id,
        companyId: co.id,
        brand: r.brand,
        model: r.model,
        variant: r.variant,
        year,
        price,
        listPrice,
        discountPercent,
        fuel: r.fuel,
        transmission: r.transmission,
        kms,
        owners,
        city: CITIES[(i + ci) % CITIES.length],
        sellerType,
        exteriorColor,
        images,
        engine,
        power: r.fuel === "Electric" ? `${115 + (i % 45)} kW peak` : `${108 + (i % 85)} bhp class`,
        torque: r.fuel === "Electric" ? `${250 + (i % 80)} Nm instant` : `${185 + (i % 120)} Nm class`,
        mileage:
          r.fuel === "Electric" ? `${380 + (i % 95)} km real-world est.` : `${15.2 + (i % 8) * 0.6} km/l ARAI class`,
        bodyType: r.body,
        features: buildFeatures(i),
        specs: buildSpecs(r, year),
        certified,
        isNew,
        trending: i % 7 === 0,
        addedAt: `2026-${String(1 + (i % 3)).padStart(2, "0")}-${String(3 + (i % 26)).padStart(2, "0")}`,
        reviews: mockReviews(id, i),
        estimatedEmiMonthly: estimateEmi(price),
        priceHistory: buildPriceHistory(price),
        videoTitle: `${r.brand} ${r.model} • ${r.variant} — walkaround`,
        inspectionReport: buildInspection(i),
        ownershipTimeline: buildOwnership(i),
        serviceTimeline: buildService(i),
        pros: [
          `${r.fuel === "Electric" ? "Low per-km energy cost" : "Strong highway cruise"} with ${certified ? "inspection" : "seller"} backup`,
          "Structured like marketplace scrape: VIN masked, service stubs attached",
          i % 2 === 0 ? "Recent tyres within 6 months" : "Single-family ownership chain",
        ],
        cons: [
          i % 5 === 0 ? "Cosmetic touch-up on rear bumper noted" : "Segment-leading insurance outlay",
          "Slot-based test drive in your city — confirm via concierge thread",
        ],
        whyBuy: [
          "Priced within ±4% of peer cluster in this pincode cohort (mock benchmark).",
          `${certified ? "200-pt inspection" : "Seller verification"} pack included in Autolokate UI.`,
          "EMI estimator uses rolling benchmark APR — adjust tenure in-tool.",
        ],
        carbonScore,
        matchProfileKey: `${r.brand}-${r.fuel}-${r.body}-${(i % 99).toString().padStart(2, "0")}`,
      };
      cars.push(car);
      globalIdx++;
    }
  }
  return cars;
}

const ARTICLE_CATS = ["Reviews", "Comparisons", "News", "Buying guides", "EV & Tech", "Ownership", "Industry"];

const ARTICLE_SEEDS = [
  "ADAS calibration in Indian traffic: what actually helps",
  "Hyundai vs Kia vs Maruti: real-world fuel delta on highway loops",
  "Used EV battery SOH: how to read a report like a technician",
  "Diesel in 2026: torque math for fleet buyers",
  "CPO programmes compared — warranty fine print decoded",
  "Monsoon checklist: rubber, brakes, and underbody photos",
  "Financing processing fees: the line items dealers merge",
  "Luxury sedan depreciation curves: when to enter",
  "Thar vs Gurkha weekend off-tarmac: maintenance reality",
  "Compact SUV ride quality: blind test takeaways",
];

function slugifyText(t) {
  return t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Keyword-rich slugs for editorial URLs (e.g. best-cars-under-10-lakh-india-reviews-0). */
function articleSlug(seed, i, cat) {
  const base = slugifyText(`${seed} india ${cat} price mileage specs guide`);
  return i === 0 ? base : `${base}-${i}`;
}

function generateArticles(embedPool) {
  const out = [];
  for (let i = 0; i < 120; i++) {
    const seed = ARTICLE_SEEDS[i % ARTICLE_SEEDS.length];
    const cat = ARTICLE_CATS[i % ARTICLE_CATS.length];
    const slug = articleSlug(seed, i, cat);
    const readMins = 5 + (i % 12);
    const trending = i % 9 === 0;
    const featured = i === 0;
    const sections = [
      { type: "p", text: `India's ${cat.toLowerCase()} beat moves fast — this dispatch synthesises showroom visits, owner interviews, and telematics samples from Autolokate's mock warehouse.` },
      { type: "h2", text: "Market snapshot" },
      { type: "p", text: `${seed}. We correlated asking prices across twelve cities, normalised for kms bands, and flagged listings with incomplete service PDFs.` },
      { type: "h3", text: "What changed since last quarter" },
      { type: "p", text: "Finance spreads tightened marginally for EVs; diesel tourers saw stable residual curves in the 4–7 year band. Urban hatchbacks traded faster in metros with parking-assist trims." },
      { type: "h2", text: "Buyer playbook" },
      { type: "p", text: "Insist on cold-start audio, highway lane-merge with ADAS on, and a documented alignment report. For used EVs, capture SoH screenshots in your deal thread." },
      { type: "h2", text: "Bottom line" },
      { type: "p", text: "Use Autolokate's compare tray and saved alerts — production would wire lender APIs; this editorial stack is structured for SEO with semantic headings and digestible paragraphs." },
    ];
    const toc = sections.filter((s) => s.type === "h2" || s.type === "h3").map((s, j) => ({
      id: `sec-${i}-${j}`,
      label: s.text,
    }));
    out.push({
      slug,
      title: `${seed} (${cat})`,
      excerpt: `Field notes from Autolokate editors — ${cat.toLowerCase()} focus with price bands, reliability signals, and finance watch-outs. About ${readMins} min read.`,
      category: cat,
      author: ["Autolokate Editorial", "Meera Iyer", "Rohan Mehta", "Vikram Sinha", "Ananya Bose"][i % 5],
      readMins,
      publishedAt: `2025-${String((i % 11) + 1).padStart(2, "0")}-${String((i % 25) + 1).padStart(2, "0")}`,
      coverImage: sample(EDITORIAL_COVERS, i + 11),
      tags: [cat, MODELS[i % MODELS.length].brand, CITIES[i % CITIES.length]].filter(Boolean),
      trending,
      featured,
      videoUrl:
        i % 15 === 0 || i % 15 === 5
          ? `https://www.youtube.com/embed/${embedPool[i % embedPool.length]}?rel=0`
          : undefined,
      sections,
      toc,
      relatedSlugs: [],
      inlineImages: [
        {
          src: sample(EDITORIAL_COVERS, i + 3),
          caption: "Representative ex-factory lighting — colour may vary by batch.",
          alt: "Vehicle exterior",
        },
        {
          src: sample(INTERIOR_POOL, i + 5),
          caption: "Cabin wear audits are mandatory on certified inventory.",
          alt: "Vehicle interior",
        },
      ],
    });
  }
  for (let i = 0; i < out.length; i++) {
    out[i].relatedSlugs = [out[(i + 3) % out.length].slug, out[(i + 7) % out.length].slug, out[(i + 13) % out.length].slug];
  }
  return out;
}

/** hqdefault is reliable; maxres 404s on some Shorts. */
const YT_THUMB = (id) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

/** Indian Drive Guide — https://www.youtube.com/@IndianDriveGuide */
const IDG_CHANNEL_ID = "UCgpxY44fOGOtG67OE3r5_2A";
const IDG_RSS = `https://www.youtube.com/feeds/videos.xml?channel_id=${IDG_CHANNEL_ID}`;

/** Offline / RSS failure — keep in sync with last good RSS poll. */
const IDG_VIDEO_IDS_FALLBACK = [
  "hugYCl2iTgg",
  "kZqVvUC-ceU",
  "YezN5LUURcM",
  "yGHLmHqXbrc",
  "1R-UzzD6UZ8",
  "NMFXGTYxIvE",
  "7tnsNLLu-3U",
  "o-o8Bn64RFo",
  "Gz5_KalULuY",
  "_W0k5F5PV24",
  "TysC7XZSfZ4",
  "CbT9NmgEJfI",
  "BM_c-eJEQZM",
  "nT05TUNx-bQ",
  "0Ongqax9sY8",
];

function decodeXmlEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseYoutubeChannelRss(xml) {
  const out = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  let m;
  while ((m = entryRe.exec(xml))) {
    const block = m[1];
    const id = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    if (!id) continue;
    const mediaTitle = block.match(/<media:title>([^<]*)<\/media:title>/)?.[1];
    const plainTitle = block.match(/<title>([^<]*)<\/title>/)?.[1];
    const title = decodeXmlEntities((mediaTitle || plainTitle || "").trim()) || id;
    const thumb = block.match(/<media:thumbnail[^>]*url="([^"]+)"/)?.[1];
    const published = block.match(/<published>([^<]+)<\/published>/)?.[1] || "";
    out.push({
      id,
      title,
      thumbnail: thumb || YT_THUMB(id),
      published,
    });
  }
  return out;
}

async function fetchIndianDriveGuideVideos() {
  try {
    const res = await fetch(IDG_RSS, {
      headers: { "User-Agent": "AutolokateDatasetGenerator/1.0 (+https://autolokate.mock)" },
    });
    if (!res.ok) throw new Error(`RSS ${res.status}`);
    const xml = await res.text();
    const parsed = parseYoutubeChannelRss(xml);
    if (parsed.length) return parsed;
  } catch (e) {
    console.warn("Indian Drive Guide RSS unavailable, using fallback IDs:", e.message || e);
  }
  return IDG_VIDEO_IDS_FALLBACK.map((id) => ({
    id,
    title: "Indian Drive Guide",
    thumbnail: YT_THUMB(id),
    published: "",
  }));
}

function generateVideos(idgEntries) {
  const pool = idgEntries.length ? idgEntries : IDG_VIDEO_IDS_FALLBACK.map((id) => ({ id, title: "Indian Drive Guide", thumbnail: YT_THUMB(id), published: "" }));
  const brands = [...new Set(MODELS.map((m) => m.brand))];
  const out = [];
  for (let i = 0; i < 60; i++) {
    const src = pool[i % pool.length];
    const yt = src.id;
    const brand = brands[i % brands.length];
    const dur = 45 + (i % 180);
    const m = MODELS[i % MODELS.length];
    const published = src.published
      ? src.published.slice(0, 10).replace(/-/g, "-")
      : `2026-${String((i % 9) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`;
    out.push({
      slug: `video-${String(i + 1).padStart(3, "0")}-${brand.toLowerCase().replace(/\s+/g, "-")}`,
      title: src.title,
      description: `From Indian Drive Guide (@IndianDriveGuide) — automotive tips, maintenance, and driving in India. Listed alongside ${m.brand} ${m.model} for browse context in Autolokate.`,
      thumbnail: YT_THUMB(yt),
      durationSec: dur,
      brandTag: brand,
      category: ["Reviews", "Comparisons", "News", "Guides"][i % 4],
      embedUrl: `https://www.youtube.com/embed/${yt}?rel=0`,
      publishedAt: published,
      trending: i % 6 === 0,
      views: 12000 + i * 3400 + (i % 50) * 900,
      sourceChannel: "Indian Drive Guide",
      sourceChannelUrl: "https://www.youtube.com/@IndianDriveGuide",
    });
  }
  return out;
}

function generateReviews(cars) {
  const authors = [
    "Verified purchase · BLR",
    "Fleet admin · MAA",
    "Auto journalist",
    "Repeat buyer",
    "First-time EV owner",
  ];
  const titles = ["Solid dealer experience", "As advertised", "Minor friction on paperwork", "Would buy again", "Inspection impressed"];
  const out = [];
  for (let i = 0; i < 240; i++) {
    const c = cars[(i * 17) % cars.length];
    out.push({
      id: `rvw-${String(i + 1).padStart(5, "0")}`,
      carId: c.id,
      companyId: c.companyId,
      author: authors[i % authors.length],
      rating: 3.5 + (i % 3) * 0.5,
      title: titles[i % titles.length],
      body: `Purchase flow for ${c.brand} ${c.model} mirrored listing metadata. Delivery checklist included alignment printout and SOH snapshot for EV trims where applicable. Support SLA in mock data: ${6 + (i % 18)}h median response.`,
      date: `2025-${String((i % 11) + 1).padStart(2, "0")}-${String((i % 26) + 1).padStart(2, "0")}`,
    });
  }
  return out;
}

function generateChatThreads() {
  return Array.from({ length: 35 }, (_, i) => ({
    id: `th-${i}`,
    name: [`Metro Motors — Creta ${i}`, `Private seller — Nexon ${i}`, `Zenith — 3 Series ${i}`][i % 3],
    last: ["Inspection PDF uploaded", "Can you share FC validity?", "Token hold available till Sunday", "Finance pre-approved"][i % 4],
    time: `${(i % 48) + 1}m`,
    unread: i % 5,
    messages: [
      { id: "m0", from: "them", text: "Hi — car is available for a slot tomorrow afternoon." },
      { id: "m1", from: "me", text: "Great, please confirm FC and tyre manufacturing dates." },
      { id: "m2", from: "them", text: "Uploaded under listing documents. Want a short engine bay clip?" },
    ],
  }));
}

async function main() {
  const companies = buildCompanies();
  const cars = generateCars(companies);
  for (const c of companies) {
    c.listingsCount = cars.filter((x) => x.companyId === c.id).length;
  }

  const idgEntries = await fetchIndianDriveGuideVideos();
  const embedPool = idgEntries.length ? idgEntries.map((e) => e.id) : [...IDG_VIDEO_IDS_FALLBACK];

  const articles = generateArticles(embedPool);
  const videos = generateVideos(idgEntries);
  const reviews = generateReviews(cars);
  const chatThreads = generateChatThreads();

  fs.writeFileSync(path.join(OUT, "companies.json"), JSON.stringify(companies));
  fs.writeFileSync(path.join(OUT, "cars.json"), JSON.stringify(cars));
  fs.writeFileSync(path.join(OUT, "articles.json"), JSON.stringify(articles));
  fs.writeFileSync(path.join(OUT, "videos.json"), JSON.stringify(videos));
  fs.writeFileSync(path.join(OUT, "reviews.json"), JSON.stringify(reviews));
  fs.writeFileSync(path.join(OUT, "chat-threads.json"), JSON.stringify(chatThreads));

  console.log(
    "Wrote JSON:",
    companies.length,
    "companies,",
    cars.length,
    "cars,",
    articles.length,
    "articles,",
    videos.length,
    "videos (Indian Drive Guide pool:",
    idgEntries.length || IDG_VIDEO_IDS_FALLBACK.length,
    "ids),",
    reviews.length,
    "reviews"
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
