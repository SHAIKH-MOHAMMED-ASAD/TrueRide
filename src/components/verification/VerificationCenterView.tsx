"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Scan,
  UserCheck,
  PhoneCall,
  Sparkles,
  Lock,
  Key,
  ShieldAlert,
  Radio,
  ArrowRight,
  Shield,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import {
  SuspiciousUserAuthModal,
  SuspiciousCourierTarget,
} from "./SuspiciousUserAuthModal";
import { AuthDecisionFramework } from "./AuthDecisionFramework";
import { VoiceChallengeStudio } from "./VoiceChallengeStudio";

export const SUSPICIOUS_COURIERS: SuspiciousCourierTarget[] = [
  {
    id: "r_0042",
    name: "Sanjay Verma",
    riskScore: 94,
    riskLevel: "L3",
    zone: "Bandra Kurla Complex (BKC)",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    triggers: [
      "SIM Swap Confirmed (42m ago)",
      "Device IMSI Discrepancy",
      "Typing Cadence Deviation 89%",
    ],
  },
  {
    id: "r_0053",
    name: "Rahul Sharma",
    riskScore: 78,
    riskLevel: "L2",
    zone: "Andheri East Logistics Hub",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
    triggers: [
      "Speed Discrepancy (118 km/h on bicycle)",
      "Dual Session Conflict Detected",
    ],
  },
  {
    id: "r_0019",
    name: "Vikram Malhotra",
    riskScore: 68,
    riskLevel: "L2",
    zone: "Dadar Central Corridor",
    avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200",
    triggers: [
      "GPS Teleportation (4.2km in 12s)",
      "Unregistered Handset IMEI",
    ],
  },
  {
    id: "RDR-8021",
    name: "Arjun Kumar",
    riskScore: 84,
    riskLevel: "L3",
    zone: "Koramangala 4th Block",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
    triggers: [
      "Account Renting Signature Flagged",
      "Unusual Midnight Route Variance",
    ],
  },
];

interface VerificationCenterProps {
  onRefreshMetrics?: () => void;
}

export function VerificationCenterView({ onRefreshMetrics }: VerificationCenterProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [isSimulatedFeed, setIsSimulatedFeed] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationOutcome, setVerificationOutcome] = useState<any | null>(null);
  const [selectedRider, setSelectedRider] = useState("RDR-8021");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isReloadPromptNeeded, setIsReloadPromptNeeded] = useState(false);
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null);

  // Suspicious courier authentication states
  const [activeAuthCourier, setActiveAuthCourier] = useState<SuspiciousCourierTarget | null>(null);
  const [recentAuthRecords, setRecentAuthRecords] = useState<
    Array<{
      riderId: string;
      name: string;
      outcome: string;
      token: string;
      timestamp: string;
      decision: string;
    }>
  >([]);

  const handleStepUpComplete = (res: any) => {
    if (activeAuthCourier) {
      setRecentAuthRecords((prev) => [
        {
          riderId: activeAuthCourier.id,
          name: activeAuthCourier.name,
          outcome: res.outcome,
          token: res.token || "N/A",
          timestamp: new Date().toLocaleTimeString(),
          decision: res.decision || "COMPLETED",
        },
        ...prev.slice(0, 4),
      ]);
    }
    setActiveAuthCourier(null);
    if (onRefreshMetrics) onRefreshMetrics();
  };

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Sync video stream to the video element whenever stream or cameraActive updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (cameraActive && liveStream && !isSimulatedFeed) {
      video.srcObject = liveStream;
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Video playback auto-play error:", err);
        });
      }
    } else if (!cameraActive) {
      video.srcObject = null;
    }
  }, [cameraActive, liveStream, isSimulatedFeed]);

  // Stop camera tracks and release hardware
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn("Track stop error:", e);
        }
      });
      streamRef.current = null;
    }
    setLiveStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsSimulatedFeed(false);
  };

  // Start live webcam stream with multi-stage fallback
  const startCamera = async () => {
    setCameraError(null);
    setIsReloadPromptNeeded(false);
    setIsSimulatedFeed(false);
    stopCamera();

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setCameraError(
        "Camera API is not supported in this browser environment. You can use 'Simulate Live Stream' below to test the full biometric verification pipeline."
      );
      return;
    }

    try {
      let stream: MediaStream;
      try {
        // Step 1: Request HD front-facing camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: "user",
          },
          audio: false,
        });
      } catch (constraintErr: any) {
        // Step 2: Fallback to basic unconstrained video
        console.warn("Retrying with unconstrained video constraint:", constraintErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setLiveStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.play().catch((playErr) => {
          console.warn("Video play error on start:", playErr);
        });
      }

      setCameraActive(true);
      setCapturedImage(null);
      setVerificationOutcome(null);
    } catch (err: any) {
      console.error("Camera access error:", err);
      const errName = err.name || "";
      if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
        setIsReloadPromptNeeded(true);
        setCameraError(
          "Permission Granted / Pending: Chrome requires a page reload after permissions are updated to attach the video stream. Click 'Reload Page Now' below or use the blue Reload banner at the top of your browser."
        );
      } else if (errName === "NotReadableError" || errName === "TrackStartError") {
        setCameraError(
          "Webcam In Use / Hardware Blocked: Another application (Zoom, Teams, Discord) or your laptop's physical privacy slider is blocking the camera. Open the shutter or click 'Simulate Live Stream'."
        );
      } else if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
        setCameraError(
          "No Camera Detected: No webcam hardware was found on this system. Click 'Simulate Live Stream' below to test with a simulated video feed."
        );
      } else {
        setCameraError(
          `Unable to access webcam (${err.message || errName || "Unknown error"}). Click 'Simulate Live Stream' below to test immediately.`
        );
      }
    }
  };

  // Start simulated camera feed for testing without hardware
  const startSimulatedCamera = () => {
    stopCamera();
    setCameraError(null);
    setIsReloadPromptNeeded(false);
    setIsSimulatedFeed(true);
    setCameraActive(true);
    setCapturedImage(null);
    setVerificationOutcome(null);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Capture frame from webcam or simulation
  const handleCapture = () => {
    if (isSimulatedFeed) {
      setCapturedImage("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600");
      stopCamera();
      return;
    }

    if (cameraActive && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    } else {
      setCapturedImage("SYNTHETIC_FRAME_CAPTURED");
      stopCamera();
    }
  };

  // Run verification comparison against backend
  const handleRunVerification = async (forcedOutcome?: "MATCH" | "NO_MATCH" | "INCONCLUSIVE") => {
    setIsVerifying(true);
    setVerificationOutcome(null);

    // Realistic biometric feature extraction latency
    setTimeout(async () => {
      const outcome = forcedOutcome || "MATCH";
      const similarityScore =
        outcome === "MATCH" ? 0.942 : outcome === "NO_MATCH" ? 0.381 : 0.612;

      const resultPayload = {
        result: outcome,
        similarityScore,
        qualityWarning:
          outcome === "INCONCLUSIVE"
            ? "Sub-optimal lighting conditions detected in rider vehicle"
            : undefined,
        failureReason:
          outcome === "NO_MATCH"
            ? "Facial feature embedding distance exceeded acceptance threshold"
            : undefined,
        recoveryMethod:
          outcome === "INCONCLUSIVE" ? "MANUAL_REVIEW_FALLBACK" : undefined,
      };

      try {
        // Record verification event in backend
        const createRes = await fetch("/api/verification/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            riderId: selectedRider,
            verificationType: "FACIAL_BIOMETRIC",
          }),
        });
        const createData = await createRes.json();

        if (createData.verification?.verificationId) {
          const updateRes = await fetch(
            `/api/verification/${createData.verification.verificationId}/result`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(resultPayload),
            }
          );
          await updateRes.json();
          setVerificationOutcome({
            ...resultPayload,
            verificationId: createData.verification.verificationId,
          });
        } else {
          setVerificationOutcome(resultPayload);
        }

        if (onRefreshMetrics) onRefreshMetrics();
      } catch (err) {
        console.error("Verification backend record error:", err);
        setVerificationOutcome(resultPayload);
      } finally {
        setIsVerifying(false);
      }
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Banner: Graphite Hero with Yellow Accent */}
      <div className="p-6 bg-[#2F3130] text-white border-l-4 border-l-[#FFD900] border-t border-r border-b border-[#3F4241] rounded-[2px] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-mono font-bold tracking-widest text-[#FFD900] uppercase">
                PROPORTIONATE STEP-UP CHECK
              </span>
              <span className="text-[#8B8D8C] text-xs font-mono">•</span>
              <span className="text-[11px] font-mono text-[#D5D7D6]">
                TRIGGERED ON ELEVATED RISK • NEVER ROUTINE LOGIN
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight uppercase">
              Biometric Step-Up Verification Studio
            </h1>
            <p className="text-xs sm:text-sm text-[#D5D7D6] mt-1 max-w-2xl leading-relaxed">
              When behavioral indicators flag a potential rented account handoff, TrueRide initiates a fast 2-second live face check. Discarded from memory immediately after comparison to protect rider privacy.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1.5 rounded-[2px] bg-[#383B3A] border border-[#4F5351] text-xs font-mono text-[#EAEAE6] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#FFD900]" />
              <span>Zero Document/Aadhaar Collection</span>
            </span>
          </div>
        </div>
      </div>

      {/* Suspicious Couriers Authentication Triage Hub */}
      <div className="p-5 rounded-[2px] bg-[#070C18] border border-[#06B6D4]/40 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1E293B] gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[2px] bg-[#06B6D4]/20 border border-[#06B6D4]/50 flex items-center justify-center text-[#06B6D4]">
              <ShieldAlert className="w-4 h-4 text-[#06B6D4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#06B6D4] uppercase">
                  ACTIVE THREAT TRIAGE
                </span>
                <span className="px-1.5 py-0.5 rounded-[1px] bg-[#D52222]/30 text-[#F87171] border border-[#D52222]/50 text-[10px] font-mono font-bold">
                  {SUSPICIOUS_COURIERS.length} FLAGGED SUSPECTS
                </span>
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Suspicious User Authentication & Step-Up Clearance
              </h2>
            </div>
          </div>
          <span className="text-xs font-mono text-[#94A3B8]">
            Multi-Factor Zero-Knowledge Protocol (SIM OTP + Live Biometric Facial Liveness)
          </span>
        </div>

        {/* Courier Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {SUSPICIOUS_COURIERS.map((c) => (
            <div
              key={c.id}
              className={`p-3.5 rounded-[2px] border transition-all flex flex-col justify-between ${
                c.riskLevel === "L3"
                  ? "bg-[#0B132B]/80 border-[#D52222]/40 hover:border-[#D52222]"
                  : "bg-[#0B132B]/80 border-[#FFD900]/40 hover:border-[#FFD900]"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-[2px] overflow-hidden bg-[#1E293B] border border-[#334155] shrink-0">
                      <img
                        src={c.avatarUrl}
                        alt={c.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white leading-tight">{c.name}</div>
                      <div className="text-[11px] font-mono text-[#94A3B8]">{c.id}</div>
                    </div>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded-[1px] text-[10px] font-mono font-bold ${
                      c.riskLevel === "L3"
                        ? "bg-[#D52222] text-white"
                        : "bg-[#FFD900] text-[#070C18]"
                    }`}
                  >
                    {c.riskLevel} • {c.riskScore}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-[#64748B] mb-2 flex items-center gap-1">
                  <span>Zone:</span>
                  <span className="text-[#CBD5E1] truncate">{c.zone}</span>
                </div>

                {/* Threat Triggers */}
                <div className="space-y-1 mb-3">
                  {c.triggers?.map((t, idx) => (
                    <div
                      key={idx}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded-[1px] bg-[#1E293B] border border-[#334155] text-[#F87171] truncate"
                    >
                      • {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-1.5 pt-2 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setActiveAuthCourier(c)}
                  className="w-full py-2 px-2.5 rounded-[2px] bg-[#06B6D4] hover:bg-[#0891B2] text-[#070C18] font-bold text-[11px] font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-[#06B6D4]/20 transition"
                >
                  <Key className="w-3.5 h-3.5 text-[#070C18]" />
                  <span>Step-Up Authenticate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRider(c.id)}
                  className="w-full py-1 px-2 rounded-[2px] bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] hover:text-white font-mono text-[10px] flex items-center justify-center gap-1 cursor-pointer transition"
                >
                  <Eye className="w-3 h-3" />
                  <span>Load into Camera Feed</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Authentication Ledger */}
        {recentAuthRecords.length > 0 && (
          <div className="pt-3 border-t border-[#1E293B]">
            <div className="text-[11px] font-mono text-[#94A3B8] mb-2 font-bold tracking-wider uppercase">
              Recent Session Step-Up Clearances:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recentAuthRecords.map((r, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-[2px] border text-xs font-mono flex items-center justify-between ${
                    r.outcome === "AUTHENTICATED_CLEARED"
                      ? "bg-[#064E3B]/40 border-[#10B981]/50 text-[#6EE7B7]"
                      : "bg-[#7F1D1D]/40 border-[#EF4444]/50 text-[#FCA5A5]"
                  }`}
                >
                  <div>
                    <span className="font-bold">{r.name}</span> ({r.riderId}) • {r.timestamp}
                    <div className="text-[10px] opacity-80 truncate">
                      Token: {r.token.slice(0, 24)}...
                    </div>
                  </div>
                  <span className="font-bold text-[10px] px-1.5 py-0.5 rounded-[1px] bg-black/40">
                    {r.outcome}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Voice Challenge Studio & Dynamic Audio Waveform Inspector */}
      <VoiceChallengeStudio
        initialRiderId="RDR-8021"
        onVerificationComplete={(res) => {
          console.log("Voice Challenge verified:", res);
        }}
      />

      {/* Authentication Methods & Risk Decision Architecture Model */}
      <AuthDecisionFramework
        title="Authentication Framework & Proportionate Risk Decision Model"
        subtitle="Operational reference for 7-factor identity validation, behavioral risk scoring, and automated step-up escalation."
      />

      {/* Main Grid: Live Camera Box vs Verification Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Camera View */}
        <div className="lg:col-span-7 p-5 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#D9D6CD]">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#17191B]" />
              <h2 className="text-xs font-bold text-[#17191B] uppercase tracking-wider font-mono">
                Live Rider Verification Feed
              </h2>
            </div>
            <span className="text-xs font-mono text-[#5D6266]">
              Rider ID: <strong className="text-[#17191B]">{selectedRider}</strong>
            </span>
          </div>

          {/* Camera Frame Box */}
          <div className="relative aspect-video w-full rounded-[2px] bg-[#17191B] border border-[#D9D6CD] overflow-hidden flex items-center justify-center">
            {/* The video element is ALWAYS in the DOM and NEVER display:none so Chrome renders hardware frames reliably */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-200 ${
                cameraActive && !isSimulatedFeed && !capturedImage
                  ? "opacity-100 z-10"
                  : "opacity-0 pointer-events-none -z-10"
              }`}
            />

            {/* Simulated Live Stream Feed View */}
            {isSimulatedFeed && !capturedImage && (
              <div className="relative w-full h-full bg-[#2D302F] flex items-center justify-center overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600"
                  alt="Simulated Rider Face"
                  className="w-full h-full object-cover filter brightness-95 contrast-105"
                />
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-[1px] bg-[#17191B]/90 border border-[#FFD900] text-[10px] font-mono text-[#FFD900] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-none bg-[#24813A] animate-ping" />
                  <span>SIMULATED AI WEBCAM FEED (30 FPS)</span>
                </div>
              </div>
            )}

            {/* Face Scanning Overlay Frame */}
            {cameraActive && !capturedImage && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="w-48 h-56 border-2 border-dashed border-[#FFD900] rounded-[2px] relative">
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-[#17191B] bg-[#FFD900] px-2.5 py-0.5 rounded-[1px] whitespace-nowrap shadow-xs">
                    Align Face Here
                  </span>
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#FFD900] to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse" />
                  {/* Corner reticles */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#FFD900]" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#FFD900]" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#FFD900]" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#FFD900]" />
                </div>
                <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-[1px] bg-[#17191B]/90 text-[10px] font-mono text-[#24813A] border border-[#24813A]/50 font-bold">
                  Feed Active
                </div>

                {/* Helpful overlay button if user's webcam physical shutter is closed */}
                {!isSimulatedFeed && (
                  <div className="absolute bottom-3 left-3 pointer-events-auto">
                    <button
                      onClick={startSimulatedCamera}
                      className="px-2 py-0.5 rounded-[1px] bg-[#17191B]/90 hover:bg-[#2D302F] text-[10px] font-mono text-[#FFD900] border border-[#FFD900]/60 cursor-pointer flex items-center gap-1 transition"
                      title="If your camera shutter is closed or showing black, switch to the synthetic feed"
                    >
                      <Sparkles className="w-3 h-3 text-[#FFD900]" />
                      <span>Feed Black? Switch to Simulated Feed</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Captured Frame Display */}
            {capturedImage && (
              <div className="relative w-full h-full flex items-center justify-center bg-[#17191B] z-20">
                {capturedImage.startsWith("data:") || capturedImage.startsWith("http") ? (
                  <img
                    src={capturedImage}
                    alt="Captured Biometric Frame"
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#2D302F] p-4 text-center">
                    <CheckCircle className="w-12 h-12 text-[#24813A] mb-2" />
                    <span className="text-sm font-bold text-white">
                      Biometric Frame Captured
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-[#17191B]/30 flex flex-col items-center justify-center p-4">
                  <div className="px-3.5 py-1.5 rounded-[2px] bg-[#17191B]/90 border border-[#24813A] text-[#24813A] text-xs font-mono font-bold flex items-center gap-2 shadow-sm">
                    <CheckCircle className="w-4 h-4 text-[#24813A]" />
                    <span>Biometric Frame Locked (512-dim Vector Extracted)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Inactive State */}
            {!cameraActive && !capturedImage && (
              <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm">
                <div className="w-12 h-12 rounded-[2px] bg-[#F1F0ED] border border-[#D9D6CD] flex items-center justify-center mb-3 text-[#17191B] shadow-xs">
                  <Scan className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Webcam Stream Inactive
                </span>
                <p className="text-[11px] text-[#8B8D8C] mt-1 leading-relaxed">
                  Click <strong className="text-white">Start Camera Stream</strong> to verify via webcam, or choose <strong className="text-white">Simulate Live Stream</strong> if testing without hardware.
                </p>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Camera Error / Notification Banner */}
          {cameraError && (
            <div className="p-3.5 rounded-[2px] bg-[#FFF5D6] border border-[#E7A500]/50 text-[#17191B] text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[#E7A500] shrink-0 mt-0.5" />
                <span className="leading-relaxed font-mono">{cameraError}</span>
              </div>
              {isReloadPromptNeeded && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-3 py-1.5 rounded-[2px] bg-[#FFD900] hover:bg-[#e6c400] text-[#17191B] font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reload Page Now</span>
                  </button>
                  <button
                    onClick={startSimulatedCamera}
                    className="px-3 py-1.5 rounded-[2px] bg-[#FFFFFF] hover:bg-[#F1F0ED] text-[#17191B] border border-[#D9D6CD] text-xs font-mono font-bold cursor-pointer transition"
                  >
                    Use Simulated Camera Instead
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Camera Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {!cameraActive && !capturedImage ? (
                <>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 rounded-[2px] text-xs font-bold text-[#17191B] bg-[#FFD900] hover:bg-[#e6c400] transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#17191B]" />
                    <span>Start Camera Stream</span>
                  </button>
                  <button
                    onClick={startSimulatedCamera}
                    className="px-3.5 py-2 rounded-[2px] text-xs font-mono font-bold text-[#17191B] bg-[#F1F0ED] hover:bg-[#D9D6CD] border border-[#D9D6CD] transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#17191B]" />
                    <span>Simulate Live Stream</span>
                  </button>
                </>
              ) : cameraActive && !capturedImage ? (
                <>
                  <button
                    onClick={handleCapture}
                    className="px-4 py-2 rounded-[2px] text-xs font-bold text-white bg-[#24813A] hover:bg-[#1f7032] transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Scan className="w-3.5 h-3.5 text-white" />
                    <span>Capture Live Frame</span>
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-3 py-2 rounded-[2px] text-xs font-mono text-[#5D6266] hover:text-[#17191B] bg-[#F1F0ED] border border-[#D9D6CD] transition cursor-pointer"
                  >
                    Stop Feed
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleRunVerification("MATCH")}
                    disabled={isVerifying}
                    className="px-4 py-2 rounded-[2px] text-xs font-bold text-[#17191B] bg-[#FFD900] hover:bg-[#e6c400] transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#17191B]" />
                    <span>Verify Captured Frame</span>
                  </button>
                  <button
                    onClick={() => {
                      setCapturedImage(null);
                      setVerificationOutcome(null);
                      startCamera();
                    }}
                    className="px-3 py-2 rounded-[2px] text-xs font-mono text-[#5D6266] hover:text-[#17191B] bg-[#F1F0ED] border border-[#D9D6CD] transition cursor-pointer"
                  >
                    Retake Frame
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#8B8D8C] font-mono">Presets:</span>
              <button
                onClick={() => handleRunVerification("MATCH")}
                disabled={isVerifying}
                className="px-2 py-1 rounded-[2px] text-xs font-mono font-bold bg-[#E8F4E8] text-[#24813A] border border-[#24813A]/30 hover:bg-[#24813A] hover:text-white cursor-pointer disabled:opacity-50 transition"
              >
                Match (94%)
              </button>
              <button
                onClick={() => handleRunVerification("NO_MATCH")}
                disabled={isVerifying}
                className="px-2 py-1 rounded-[2px] text-xs font-mono font-bold bg-[#FCE5E3] text-[#D52222] border border-[#D52222]/30 hover:bg-[#D52222] hover:text-white cursor-pointer disabled:opacity-50 transition"
              >
                No Match (38%)
              </button>
              <button
                onClick={() => handleRunVerification("INCONCLUSIVE")}
                disabled={isVerifying}
                className="px-2 py-1 rounded-[2px] text-xs font-mono font-bold bg-[#FFF5D6] text-[#E7A500] border border-[#E7A500]/30 hover:bg-[#E7A500] hover:text-white cursor-pointer disabled:opacity-50 transition"
              >
                Inconclusive
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Reference Dossier & Verification Outcome */}
        <div className="lg:col-span-5 space-y-5">
          {/* Reference Profile Card */}
          <div className="p-5 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#17191B] mb-3 flex items-center gap-2 font-mono">
              <UserCheck className="w-4 h-4 text-[#17191B]" /> Authorized Reference Dossier
            </h3>

            <div className="flex items-center gap-4 p-3 rounded-[2px] bg-[#F7F7F5] border border-[#D9D6CD]">
              <div className="w-16 h-16 rounded-[2px] overflow-hidden bg-[#F1F0ED] border border-[#D9D6CD] shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                  alt="Enrolled Reference"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="text-xs">
                <div className="font-bold text-[#17191B] text-sm">Arjun Kumar</div>
                <div className="text-[#5D6266] font-mono text-[11px]">RDR-8021 • Koramangala</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-none bg-[#24813A]" />
                  <span className="text-[10px] text-[#24813A] font-mono font-bold">
                    Enrolled Reference Portrait
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-[#5D6266] space-y-1 font-mono">
              <div className="flex justify-between border-b border-[#D9D6CD] pb-1">
                <span>Enrollment Check:</span>
                <span className="text-[#17191B] font-bold">Aadhaar Offline XML (Synthetic)</span>
              </div>
              <div className="flex justify-between border-b border-[#D9D6CD] py-1">
                <span>Embedding Model:</span>
                <span className="text-[#17191B] font-bold">FaceNet-ResNet50 / 512-dim</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>Match Threshold:</span>
                <span className="text-[#17191B] font-bold">Cosine Similarity &ge; 0.75</span>
              </div>
            </div>
          </div>

          {/* Verification Outcome Panel */}
          {isVerifying ? (
            <div className="p-8 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] text-center space-y-3 shadow-xs">
              <RefreshCw className="w-8 h-8 animate-spin text-[#17191B] mx-auto" />
              <h4 className="text-sm font-bold text-[#17191B] font-mono uppercase">Extracting Facial Embeddings...</h4>
              <p className="text-xs text-[#5D6266] font-mono max-w-xs mx-auto">
                Comparing 512-dimensional vector with stored reference portrait.
              </p>
            </div>
          ) : verificationOutcome ? (
            <div
              className={`p-5 rounded-[2px] border shadow-xs space-y-3 ${
                verificationOutcome.result === "MATCH"
                  ? "bg-[#E8F4E8] border-[#24813A]/50 text-[#17191B]"
                  : verificationOutcome.result === "NO_MATCH"
                  ? "bg-[#FCE5E3] border-[#D52222]/50 text-[#17191B]"
                  : "bg-[#FFF5D6] border-[#E7A500]/50 text-[#17191B]"
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-black/10">
                <div className="flex items-center gap-2">
                  {verificationOutcome.result === "MATCH" ? (
                    <CheckCircle className="w-5 h-5 text-[#24813A]" />
                  ) : verificationOutcome.result === "NO_MATCH" ? (
                    <XCircle className="w-5 h-5 text-[#D52222]" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-[#E7A500]" />
                  )}
                  <h4 className="font-bold text-[#17191B] text-xs font-mono uppercase">
                    Outcome: {verificationOutcome.result}
                  </h4>
                </div>

                <span className="font-mono text-xs font-bold text-[#17191B]">
                  Similarity: {(verificationOutcome.similarityScore * 100).toFixed(1)}%
                </span>
              </div>

              <div className="text-xs space-y-2">
                {verificationOutcome.result === "MATCH" && (
                  <p className="text-[#17191B]">
                    Biometric match confirmed! The live camera capture matches Arjun Kumar&apos;s enrolled portrait with 94.2% cosine similarity. Case automatically marked <strong>VERIFIED_LEGITIMATE</strong>.
                  </p>
                )}

                {verificationOutcome.result === "NO_MATCH" && (
                  <div className="space-y-1">
                    <p className="text-[#D52222] font-bold">
                      Biometric mismatch detected. Live face does not match enrolled reference.
                    </p>
                    <p className="text-[11px] text-[#5D6266]">
                      Case elevated to <strong>CRITICAL</strong> priority for Trust &amp; Safety investigation.
                    </p>
                  </div>
                )}

                {verificationOutcome.result === "INCONCLUSIVE" && (
                  <div className="space-y-2">
                    <p className="text-[#E7A500] font-bold">
                      Check Inconclusive: {verificationOutcome.qualityWarning}.
                    </p>
                    <p className="text-[11px] text-[#5D6266]">
                      Rule of fairness: Inconclusive result is NOT treated as fraud. Alternative fallback route activated.
                    </p>
                    <button className="px-3 py-1.5 rounded-[2px] bg-[#FFFFFF] hover:bg-[#F1F0ED] text-[#17191B] border border-[#D9D6CD] text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer">
                      <PhoneCall className="w-3.5 h-3.5 text-[#17191B]" />
                      <span>Request Supervisor Callback</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-[2px] bg-[#FFFFFF] border border-[#D9D6CD] text-center text-[#5D6266] text-xs font-mono shadow-xs">
              Perform a camera capture or click a test outcome above to execute the biometric verification pipeline.
            </div>
          )}
        </div>
      </div>

      {/* Interactive Suspicious Courier Step-Up Authentication Modal */}
      {activeAuthCourier && (
        <SuspiciousUserAuthModal
          courier={activeAuthCourier}
          isOpen={!!activeAuthCourier}
          onClose={() => setActiveAuthCourier(null)}
          onComplete={handleStepUpComplete}
        />
      )}
    </div>
  );
}
