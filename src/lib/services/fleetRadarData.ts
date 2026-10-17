export interface FleetCourier {
  id: string;
  name: string;
  vehicle: "Motorbike" | "EV Scooter" | "Bicycle";
  status: "In-Transit" | "Waiting Pickup" | "Delivering" | "Stationary";
  zone: string;
  x: number; // Normalized % on Mumbai map (0-100)
  y: number; // Normalized % on Mumbai map (0-100)
  riskLevel: "L0" | "L1" | "L2" | "L3";
  trustScore: number; // out of 100
  riskScore: number;
  trustStatus: "Silent Trust" | "Ambient Monitor" | "Step-Up Verify" | "Security Hold";
  route?: {
    from: [number, number];
    to: [number, number];
    control: [number, number];
    color: string;
  };
  telemetry: {
    avgCadenceSec: number;
    baselineCadenceSec: number;
    acceptanceRate: number;
    deviceId: string;
    isKnownDevice: boolean;
    operatingZone: string;
    gripConsistency: number; // %
    reactionTimeScore: number; // %
    baselineDriftSigma: number; // sigma
    personBoundConsistency: number; // 0-1
    categoryScores: {
      behavioral: number;
      device: number;
      location: number;
      sessionAccount: number;
      historical: number;
    };
    signals: Array<{
      code: string;
      name: string;
      subscore: number;
      observed: string;
      baseline: string;
      explanation: string;
    }>;
  };
  caseId?: string;
  isSyndicateNode?: boolean;
}

// 60 Mumbai couriers with geospatial coordinates across major commercial & transit zones
export const INITIAL_MUMBAI_COURIERS: FleetCourier[] = [
  // Flagged/Mission Courier: r_0042 (Primary Focus in Reference Screenshot)
  {
    id: "r_0042",
    name: "Arjun Kumar (RDR-8021)",
    vehicle: "Motorbike",
    status: "In-Transit",
    zone: "Bandra Kurla Complex (BKC)",
    x: 48,
    y: 44,
    riskLevel: "L3",
    trustScore: 38.2,
    riskScore: 84.6,
    trustStatus: "Security Hold",
    route: {
      from: [26, 68], // Lower Parel
      to: [48, 44],   // BKC
      control: [32, 48],
      color: "#F05269",
    },
    telemetry: {
      avgCadenceSec: 32.8,
      baselineCadenceSec: 14.5,
      acceptanceRate: 0.42,
      deviceId: "DEV-XIAOMI-13T",
      isKnownDevice: false,
      operatingZone: "BKC Commercial Zone",
      gripConsistency: 42,
      reactionTimeScore: 54,
      baselineDriftSigma: 3.8,
      personBoundConsistency: 0.38,
      categoryScores: {
        behavioral: 86,
        device: 82,
        location: 45,
        sessionAccount: 88,
        historical: 74,
      },
      signals: [
        {
          code: "BEH_INTERVAL_COLLAPSE",
          name: "Touch Cadence Collapse",
          subscore: 88,
          observed: "32.8s avg touch rhythm",
          baseline: "14.5s ± 3.2s baseline",
          explanation: "Rider typing and touch cadence diverges by 3.8 standard deviations from enrolled baseline.",
        },
        {
          code: "DEV_HARDWARE_MISMATCH",
          name: "Unregistered Device Signature",
          subscore: 82,
          observed: "DEV-XIAOMI-13T (New Hardware)",
          baseline: "DEV-SM-A53 / DEV-SM-A54",
          explanation: "Hardware fingerprint not present in rider's multi-month known hardware registry.",
        },
        {
          code: "ACC_RAPID_RELINK",
          name: "Rapid Credential / Payout Mod",
          subscore: 85,
          observed: "Payout bank rerouted 18m prior",
          baseline: "Stable since account creation",
          explanation: "High-risk correlation: new device paired with immediate payout account routing change.",
        },
      ],
    },
    caseId: "CASE-2026-8021",
    isSyndicateNode: true,
  },
  // Ambient warning courier: r_0025
  {
    id: "r_0025",
    name: "Rajesh Sharma (RDR-7740)",
    vehicle: "Motorbike",
    status: "In-Transit",
    zone: "Andheri East",
    x: 42,
    y: 28,
    riskLevel: "L1",
    trustScore: 88.4,
    riskScore: 28.5,
    trustStatus: "Ambient Monitor",
    route: {
      from: [28, 62], // Dadar
      to: [42, 28],   // Andheri East
      control: [34, 42],
      color: "#E5C347",
    },
    telemetry: {
      avgCadenceSec: 16.2,
      baselineCadenceSec: 15.0,
      acceptanceRate: 0.88,
      deviceId: "DEV-POCO-X4",
      isKnownDevice: true,
      operatingZone: "Andheri MIDC",
      gripConsistency: 92,
      reactionTimeScore: 91,
      baselineDriftSigma: 0.6,
      personBoundConsistency: 0.92,
      categoryScores: {
        behavioral: 18,
        device: 10,
        location: 42,
        sessionAccount: 15,
        historical: 20,
      },
      signals: [
        {
          code: "LOC_TRANSIT_SPIKE",
          name: "Cross-Corridor Transit",
          subscore: 42,
          observed: "Dadar -> Andheri (Plausible)",
          baseline: "Western Express Arterial",
          explanation: "Highway speed aligns with normal rush-hour transit between distribution hubs.",
        },
      ],
    },
    isSyndicateNode: false,
  },
  // Challenge Courier: r_0017
  {
    id: "r_0017",
    name: "Vikram Singh (RDR-9105)",
    vehicle: "EV Scooter",
    status: "In-Transit",
    zone: "Lower Parel / Worli",
    x: 28,
    y: 65,
    riskLevel: "L2",
    trustScore: 68.0,
    riskScore: 61.5,
    trustStatus: "Step-Up Verify",
    route: {
      from: [48, 44],
      to: [28, 65],
      control: [40, 56],
      color: "#F39B45",
    },
    telemetry: {
      avgCadenceSec: 22.4,
      baselineCadenceSec: 16.0,
      acceptanceRate: 0.68,
      deviceId: "DEV-ONEPLUS-11",
      isKnownDevice: false,
      operatingZone: "Phoenix Palladium / High Street",
      gripConsistency: 74,
      reactionTimeScore: 78,
      baselineDriftSigma: 1.9,
      personBoundConsistency: 0.72,
      categoryScores: {
        behavioral: 58,
        device: 65,
        location: 30,
        sessionAccount: 62,
        historical: 40,
      },
      signals: [
        {
          code: "DEV_FIRST_SEEN",
          name: "First-Time Device Access",
          subscore: 65,
          observed: "DEV-ONEPLUS-11 (Initial Login)",
          baseline: "DEV-S21-ULTRA",
          explanation: "First session on newly provisioned handset; step-up biometric verification recommended.",
        },
      ],
    },
    isSyndicateNode: true,
  },
  // Silent Trust Couriers (L0)
  {
    id: "r_0001",
    name: "Aakash Patel",
    vehicle: "Motorbike",
    status: "In-Transit",
    zone: "Bandra West",
    x: 34,
    y: 42,
    riskLevel: "L0",
    trustScore: 94.6,
    riskScore: 6.2,
    trustStatus: "Silent Trust",
    telemetry: {
      avgCadenceSec: 14.2,
      baselineCadenceSec: 14.5,
      acceptanceRate: 0.95,
      deviceId: "DEV-SAMSUNG-F23",
      isKnownDevice: true,
      operatingZone: "Bandra Linking Road",
      gripConsistency: 98,
      reactionTimeScore: 95,
      baselineDriftSigma: 0.08,
      personBoundConsistency: 0.96,
      categoryScores: { behavioral: 8, device: 5, location: 6, sessionAccount: 4, historical: 8 },
      signals: [],
    },
  },
  {
    id: "r_0013",
    name: "Sunil Mane",
    vehicle: "Motorbike",
    status: "In-Transit",
    zone: "Colaba",
    x: 24,
    y: 86,
    riskLevel: "L0",
    trustScore: 95.1,
    riskScore: 5.4,
    trustStatus: "Silent Trust",
    telemetry: {
      avgCadenceSec: 13.8,
      baselineCadenceSec: 13.5,
      acceptanceRate: 0.98,
      deviceId: "DEV-REDMI-NOTE12",
      isKnownDevice: true,
      operatingZone: "Cuffe Parade & Fort",
      gripConsistency: 99,
      reactionTimeScore: 96,
      baselineDriftSigma: 0.05,
      personBoundConsistency: 0.98,
      categoryScores: { behavioral: 6, device: 4, location: 5, sessionAccount: 5, historical: 7 },
      signals: [],
    },
  },
  {
    id: "r_0053",
    name: "Deepa Nair (RDR-6032)",
    vehicle: "EV Scooter",
    status: "In-Transit",
    zone: "Powai Commercial Hub",
    x: 58,
    y: 26,
    riskLevel: "L0",
    trustScore: 95.2,
    riskScore: 5.2,
    trustStatus: "Silent Trust",
    telemetry: {
      avgCadenceSec: 15.1,
      baselineCadenceSec: 15.0,
      acceptanceRate: 0.96,
      deviceId: "DEV-MOTO-G82",
      isKnownDevice: true,
      operatingZone: "Hiranandani Gardens",
      gripConsistency: 97,
      reactionTimeScore: 94,
      baselineDriftSigma: 0.06,
      personBoundConsistency: 0.97,
      categoryScores: { behavioral: 5, device: 4, location: 6, sessionAccount: 4, historical: 6 },
      signals: [],
    },
  },
  {
    id: "r_0020",
    name: "Pratik Bhosle",
    vehicle: "Motorbike",
    status: "In-Transit",
    zone: "Dadar West",
    x: 32,
    y: 56,
    riskLevel: "L0",
    trustScore: 95.6,
    riskScore: 4.8,
    trustStatus: "Silent Trust",
    telemetry: {
      avgCadenceSec: 14.9,
      baselineCadenceSec: 15.2,
      acceptanceRate: 0.94,
      deviceId: "DEV-REALME-9",
      isKnownDevice: true,
      operatingZone: "Shivaji Park",
      gripConsistency: 98,
      reactionTimeScore: 95,
      baselineDriftSigma: 0.04,
      personBoundConsistency: 0.98,
      categoryScores: { behavioral: 5, device: 5, location: 4, sessionAccount: 3, historical: 6 },
      signals: [],
    },
  },
  {
    id: "r_0030",
    name: "Karan Desai",
    vehicle: "Motorbike",
    status: "In-Transit",
    zone: "Kurla West",
    x: 50,
    y: 40,
    riskLevel: "L0",
    trustScore: 95.6,
    riskScore: 4.7,
    trustStatus: "Silent Trust",
    telemetry: {
      avgCadenceSec: 16.0,
      baselineCadenceSec: 15.8,
      acceptanceRate: 0.92,
      deviceId: "DEV-VIVO-T1",
      isKnownDevice: true,
      operatingZone: "Kurla LBS Marg",
      gripConsistency: 96,
      reactionTimeScore: 93,
      baselineDriftSigma: 0.07,
      personBoundConsistency: 0.95,
      categoryScores: { behavioral: 6, device: 5, location: 5, sessionAccount: 4, historical: 5 },
      signals: [],
    },
    isSyndicateNode: true,
  },
  // Auto-generate remaining couriers up to 60 with realistic Mumbai coordinates
  ...Array.from({ length: 52 }, (_, i) => {
    const num = i + 35;
    const padId = `r_${num.toString().padStart(4, "0")}`;
    const zones = [
      { name: "Andheri West", x: 34, y: 24 },
      { name: "Bandra Kurla Complex", x: 49, y: 45 },
      { name: "Ghatkopar East", x: 60, y: 38 },
      { name: "Lower Parel", x: 27, y: 64 },
      { name: "Worli Sea Face", x: 23, y: 58 },
      { name: "Vashi Sector 17", x: 80, y: 48 },
      { name: "Belapur CBD", x: 84, y: 62 },
      { name: "Chembur Monorail", x: 56, y: 50 },
      { name: "Malad Link Road", x: 32, y: 16 },
      { name: "Nariman Point", x: 22, y: 88 },
      { name: "Fort Commercial", x: 25, y: 82 },
      { name: "Sion Circle", x: 44, y: 52 },
      { name: "Mulund West", x: 68, y: 22 },
      { name: "Santacruz Airport", x: 42, y: 35 },
    ];
    const z = zones[i % zones.length];
    // Add jitter within zone
    const jx = Math.max(12, Math.min(88, z.x + ((i * 7) % 9) - 4));
    const jy = Math.max(12, Math.min(90, z.y + ((i * 5) % 9) - 4));
    const trust = +(94.0 + ((i * 1.37) % 5.5)).toFixed(1);
    const risk = +(100 - trust).toFixed(1);

    return {
      id: padId,
      name: `Courier ${num} (Mumbai Fleet)`,
      vehicle: (i % 3 === 0 ? "EV Scooter" : i % 5 === 0 ? "Bicycle" : "Motorbike") as any,
      status: (i % 4 === 0 ? "Delivering" : i % 3 === 0 ? "Waiting Pickup" : "In-Transit") as any,
      zone: z.name,
      x: jx,
      y: jy,
      riskLevel: "L0" as const,
      trustScore: trust,
      riskScore: risk,
      trustStatus: "Silent Trust" as const,
      telemetry: {
        avgCadenceSec: +(13.5 + (i % 4) * 0.5).toFixed(1),
        baselineCadenceSec: 14.0,
        acceptanceRate: +(0.92 + (i % 6) * 0.01).toFixed(2),
        deviceId: `DEV-ARM-${8000 + i}`,
        isKnownDevice: true,
        operatingZone: z.name,
        gripConsistency: 96 + (i % 4),
        reactionTimeScore: 93 + (i % 5),
        baselineDriftSigma: +((i % 5) * 0.03).toFixed(2),
        personBoundConsistency: 0.95,
        categoryScores: {
          behavioral: 8 + (i % 5),
          device: 6,
          location: 7,
          sessionAccount: 5,
          historical: 7,
        },
        signals: [],
      },
    };
  }),
];

// Syndicate clusters (devices shared across couriers in BKC / Kurla corridor)
export const SYNDICATE_EDGES = [
  { fromId: "r_0042", toId: "r_0017", label: "Shared Handset Hash (DEV-XIAOMI-13T)" },
  { fromId: "r_0042", toId: "r_0030", label: "Identical IMEI Fingerprint Hub" },
  { fromId: "r_0017", toId: "r_0030", label: "Coordinated Login Handshake" },
];

// Express Delivery Corridors across Mumbai
export const EXPRESS_CORRIDORS = [
  // Western Express Arterial: Andheri -> Bandra -> Dadar -> Worli
  {
    name: "Western Express Corridor",
    points: [
      [34, 16],
      [42, 28],
      [42, 35],
      [34, 42],
      [32, 56],
      [28, 65],
    ] as Array<[number, number]>,
  },
  // BKC - Eastern Express Arterial: BKC -> Kurla -> Chembur -> Vashi
  {
    name: "BKC-Navi Mumbai Expressway",
    points: [
      [48, 44],
      [50, 40],
      [56, 50],
      [80, 48],
      [84, 62],
    ] as Array<[number, number]>,
  },
  // Sea Link Arterial: Bandra -> Worli
  {
    name: "Bandra-Worli Sea Link",
    points: [
      [34, 42],
      [24, 48],
      [23, 58],
      [28, 65],
    ] as Array<[number, number]>,
  },
];

export interface RadarPreset {
  id: string;
  name: string;
  subtitle: string;
  targetCourierId: string;
  description: string;
  badge: string;
  override: Partial<FleetCourier>;
}

export const RADAR_PRESETS: Record<string, RadarPreset> = {
  presetA: {
    id: "presetA",
    name: "Preset A",
    subtitle: "Legit New Phone + Zone",
    targetCourierId: "r_0042",
    badge: "Dampener Active (L0)",
    description: "Courier legitimately acquired a new phone in a new delivery zone. The Life-Event Dampener engages, preserving L0 Silent Trust without disruptive lockout.",
    override: {
      riskLevel: "L0",
      trustScore: 94.6,
      riskScore: 12.4,
      trustStatus: "Silent Trust",
      route: {
        from: [26, 68],
        to: [48, 44],
        control: [32, 48],
        color: "#22C99A",
      },
      telemetry: {
        avgCadenceSec: 14.8,
        baselineCadenceSec: 14.5,
        acceptanceRate: 0.94,
        deviceId: "DEV-PIXEL-8A (New Legit)",
        isKnownDevice: false,
        operatingZone: "BKC Commercial Zone",
        gripConsistency: 96,
        reactionTimeScore: 95,
        baselineDriftSigma: 0.3,
        personBoundConsistency: 0.94,
        categoryScores: {
          behavioral: 14,
          device: 32,
          location: 24,
          sessionAccount: 12,
          historical: 10,
        },
        signals: [
          {
            code: "DAMPENER_ENGAGED",
            name: "Life-Event Dampener Engaged",
            subscore: 15,
            observed: "PBC 0.94 within safe tolerance",
            baseline: "Stable baseline enrolled",
            explanation: "Legitimate device switch detected. Biometric grip and cadence match the true owner, suppressing false alarm.",
          },
        ],
      },
    },
  },
  presetB: {
    id: "presetB",
    name: "Preset B",
    subtitle: "Rented Account Swap",
    targetCourierId: "r_0042",
    badge: "Detection Triggered (L3)",
    description: "Account credentials and phone transferred to unverified third-party renter. Touch cadence collapses and syndicate device link triggers L3 Security Hold.",
    override: {
      riskLevel: "L3",
      trustScore: 38.2,
      riskScore: 84.6,
      trustStatus: "Security Hold",
      route: {
        from: [26, 68],
        to: [48, 44],
        control: [32, 48],
        color: "#F05269",
      },
      telemetry: {
        avgCadenceSec: 32.8,
        baselineCadenceSec: 14.5,
        acceptanceRate: 0.42,
        deviceId: "DEV-XIAOMI-13T",
        isKnownDevice: false,
        operatingZone: "BKC Commercial Zone",
        gripConsistency: 42,
        reactionTimeScore: 54,
        baselineDriftSigma: 3.8,
        personBoundConsistency: 0.38,
        categoryScores: {
          behavioral: 86,
          device: 82,
          location: 45,
          sessionAccount: 88,
          historical: 74,
        },
        signals: [
          {
            code: "BEH_INTERVAL_COLLAPSE",
            name: "Touch Cadence Collapse",
            subscore: 88,
            observed: "32.8s avg touch rhythm",
            baseline: "14.5s ± 3.2s baseline",
            explanation: "Rider typing and touch cadence diverges by 3.8 standard deviations from enrolled baseline.",
          },
          {
            code: "DEV_HARDWARE_MISMATCH",
            name: "Unregistered Device Signature",
            subscore: 82,
            observed: "DEV-XIAOMI-13T (New Hardware)",
            baseline: "DEV-SM-A53 / DEV-SM-A54",
            explanation: "Hardware fingerprint not present in rider's multi-month known hardware registry.",
          },
          {
            code: "ACC_RAPID_RELINK",
            name: "Rapid Credential / Payout Mod",
            subscore: 85,
            observed: "Payout bank rerouted 18m prior",
            baseline: "Stable since account creation",
            explanation: "High-risk correlation: new device paired with immediate payout account routing change.",
          },
        ],
      },
    },
  },
  presetC: {
    id: "presetC",
    name: "Preset C",
    subtitle: "Live Manual Chaos Override",
    targetCourierId: "r_0042",
    badge: "L2 Step-Up Verify",
    description: "Simulates sudden location velocity jump across Thane Creek into Navi Mumbai combined with abnormal route deviation.",
    override: {
      riskLevel: "L2",
      trustScore: 61.5,
      riskScore: 58.0,
      trustStatus: "Step-Up Verify",
      route: {
        from: [48, 44],
        to: [84, 62],
        control: [64, 46],
        color: "#F39B45",
      },
      telemetry: {
        avgCadenceSec: 20.4,
        baselineCadenceSec: 14.5,
        acceptanceRate: 0.71,
        deviceId: "DEV-SM-A54",
        isKnownDevice: true,
        operatingZone: "Navi Mumbai Industrial Hub",
        gripConsistency: 74,
        reactionTimeScore: 68,
        baselineDriftSigma: 2.4,
        personBoundConsistency: 0.62,
        categoryScores: {
          behavioral: 48,
          device: 22,
          location: 84,
          sessionAccount: 34,
          historical: 40,
        },
        signals: [
          {
            code: "LOC_SPEED_ANOMALY",
            name: "High Velocity Displacement",
            subscore: 84,
            observed: "78 km/h transit over creek",
            baseline: "22 km/h city average",
            explanation: "Distance traversed exceeds realistic motorcycle velocity under peak traffic conditions.",
          },
        ],
      },
    },
  },
  presetD: {
    id: "presetD",
    name: "Preset D",
    subtitle: "Sneaky Renter (Dampener Bypassed)",
    targetCourierId: "r_0042",
    badge: "Subtle Drift (L2)",
    description: "Renter attempts to mimic owner using the same handset and operating in familiar zone, but micro-touch tremor and latency reveal substitution.",
    override: {
      riskLevel: "L2",
      trustScore: 64.0,
      riskScore: 52.4,
      trustStatus: "Step-Up Verify",
      route: {
        from: [34, 42],
        to: [48, 44],
        control: [40, 46],
        color: "#F39B45",
      },
      telemetry: {
        avgCadenceSec: 22.1,
        baselineCadenceSec: 14.5,
        acceptanceRate: 0.88,
        deviceId: "DEV-SM-A54",
        isKnownDevice: true,
        operatingZone: "BKC Commercial Zone",
        gripConsistency: 68,
        reactionTimeScore: 71,
        baselineDriftSigma: 2.9,
        personBoundConsistency: 0.59,
        categoryScores: {
          behavioral: 76,
          device: 18,
          location: 22,
          sessionAccount: 24,
          historical: 38,
        },
        signals: [
          {
            code: "BEH_MICRO_TREMOR",
            name: "Micro-Cadence Drift",
            subscore: 76,
            observed: "22.1s dwell rhythm variance",
            baseline: "14.5s baseline signature",
            explanation: "Identical device used, but motor-habit friction and swipe velocity deviate noticeably.",
          },
        ],
      },
    },
  },
};

export function applyPresetToCouriers(presetKey: string, currentCouriers: FleetCourier[]): FleetCourier[] {
  const preset = RADAR_PRESETS[presetKey];
  if (!preset) return currentCouriers;

  return currentCouriers.map((c) => {
    if (c.id === preset.targetCourierId) {
      return {
        ...c,
        ...preset.override,
        telemetry: {
          ...c.telemetry,
          ...(preset.override.telemetry || {}),
          categoryScores: {
            ...c.telemetry.categoryScores,
            ...(preset.override.telemetry?.categoryScores || {}),
          },
          signals: preset.override.telemetry?.signals || c.telemetry.signals,
        },
      };
    }
    return c;
  });
}

export const MUMBAI_GEO_BOUNDS = {
  minLat: 18.89,
  maxLat: 19.28,
  minLng: 72.78,
  maxLng: 73.05,
  center: { lat: 19.0657, lng: 72.8687 }, // Bandra Kurla Complex (BKC)
  zoom: 12,
};

export function courierToLatLng(c: { x: number; y: number }): { lat: number; lng: number } {
  const { minLat, maxLat, minLng, maxLng } = MUMBAI_GEO_BOUNDS;
  return {
    lat: +(maxLat - (c.y / 100) * (maxLat - minLat)).toFixed(6),
    lng: +(minLng + (c.x / 100) * (maxLng - minLng)).toFixed(6),
  };
}

export function latLngToNormalized(lat: number, lng: number): { x: number; y: number } {
  const { minLat, maxLat, minLng, maxLng } = MUMBAI_GEO_BOUNDS;
  const clampedLat = Math.max(minLat, Math.min(maxLat, lat));
  const clampedLng = Math.max(minLng, Math.min(maxLng, lng));
  return {
    x: +(((clampedLng - minLng) / (maxLng - minLng)) * 100).toFixed(2),
    y: +(((maxLat - clampedLat) / (maxLat - minLat)) * 100).toFixed(2),
  };
}

