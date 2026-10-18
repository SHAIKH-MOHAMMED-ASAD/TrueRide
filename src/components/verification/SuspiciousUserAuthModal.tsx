"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Smartphone,
  Lock,
  ArrowRight,
  RefreshCw,
  Eye,
  Key,
  Check,
  X,
  Clock,
  Mic,
  Volume2,
  Radio,
  Sparkles,
} from "lucide-react";

export interface SuspiciousCourierTarget {
  id: string; // e.g. "r_0042" or "RDR-8021"
  name: string;
  riskScore: number;
  riskLevel: "L0" | "L1" | "L2" | "L3" | string;
  zone?: string;
  avatarUrl?: string;
  caseId?: string;
  triggers?: string[];
}

interface SuspiciousUserAuthModalProps {
  courier: SuspiciousCourierTarget;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (result: any) => void;
}

export function SuspiciousUserAuthModal({
  courier,
  isOpen,
  onClose,
  onComplete,
}: SuspiciousUserAuthModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [otpCode, setOtpCode] = useState<string>("849201");
  const [isOtpVerified, setIsOtpVerified] = useState<boolean>(true);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [isSimulatedFeed, setIsSimulatedFeed] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isConnectingCamera, setIsConnectingCamera] = useState<boolean>(false);
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null);
  const [selectedDemoPreset, setSelectedDemoPreset] = useState<"MATCH" | "NO_MATCH" | "INCONCLUSIVE">("MATCH");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [authOutcome, setAuthOutcome] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Factor 3: Voice Challenge state
  const [includeVoiceChallenge, setIncludeVoiceChallenge] = useState<boolean>(true);
  const [voicePhrase, setVoicePhrase] = useState<string>("Confirm Bangalore Koramangala route five eight two");
  const [isSpeakingPhrase, setIsSpeakingPhrase] = useState<boolean>(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState<boolean>(false);
  const [voiceRecorded, setVoiceRecorded] = useState<boolean>(true);

  // Video element refs for live webcam
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setOtpCode("849201");
      setIsOtpVerified(true);
      setSelectedDemoPreset("MATCH");
      setAuthOutcome(null);
      setErrorMsg(null);
      setCameraError(null);
      setIsSimulatedFeed(true);
    } else {
      stopCamera();
    }
  }, [isOpen]);

  // Sync live stream to video element whenever liveStream or isSimulatedFeed updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (liveStream && !isSimulatedFeed) {
      video.srcObject = liveStream;
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Auto-play error:", err);
        });
      }
    } else {
      video.srcObject = null;
    }
  }, [liveStream, isSimulatedFeed]);

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
  };

  const startLiveWebcam = async () => {
    setCameraError(null);
    setIsConnectingCamera(true);
    stopCamera();

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setCameraError("Webcam hardware API not supported in this browser.");
      setIsSimulatedFeed(true);
      setIsConnectingCamera(false);
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: "user",
          },
          audio: false,
        });
      } catch (constraintErr) {
        // Fallback to basic unconstrained video
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setLiveStream(stream);
      setIsSimulatedFeed(false);
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.play().catch((playErr) => {
          console.warn("Video play error on start:", playErr);
        });
      }
    } catch (err: any) {
      console.warn("Camera hardware access error:", err);
      const errName = err.name || "";
      if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
        setCameraError("Permission denied: Click the camera icon in Chrome's address bar to enable camera.");
      } else if (errName === "NotReadableError" || errName === "TrackStartError") {
        setCameraError("Camera is currently in use by another app or hardware shutter is closed.");
      } else {
        setCameraError(`Camera unavailable (${err.message || "Hardware error"}). Switched to simulated feed.`);
      }
      setIsSimulatedFeed(true);
    } finally {
      setIsConnectingCamera(false);
    }
  };

  const handleExecuteAuthentication = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const similarity =
      selectedDemoPreset === "MATCH"
        ? 0.964
        : selectedDemoPreset === "NO_MATCH"
        ? 0.342
        : 0.612;

    const voiceChallenge = includeVoiceChallenge
      ? {
          phrase: voicePhrase,
          spokenTranscript: voicePhrase,
          voiceMatchScore:
            selectedDemoPreset === "MATCH" ? 0.962 : selectedDemoPreset === "NO_MATCH" ? 0.315 : 0.618,
          voiceLivenessPassed: selectedDemoPreset !== "NO_MATCH",
          antiDeepfakeScore: selectedDemoPreset === "MATCH" ? 0.985 : 0.142,
          voiceOutcome: selectedDemoPreset,
        }
      : undefined;

    const payload = {
      riderId: courier.id.startsWith("r_") ? `RDR-${courier.id.replace("r_", "")}` : courier.id,
      sessionId: `SESS-${Date.now().toString().slice(-6)}`,
      caseId: courier.caseId,
      otpCode,
      biometricOutcome: selectedDemoPreset,
      similarityScore: similarity,
      livenessPassed: selectedDemoPreset !== "NO_MATCH",
      voiceChallenge,
      actor: "STEP_UP_SECURITY_GATEWAY",
    };

    try {
      const res = await fetch("/api/verification/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication request failed");
      }

      setAuthOutcome(data);
      setCurrentStep(3);
      if (onComplete) {
        onComplete(data);
      }
    } catch (err: any) {
      console.error("Auth challenge error:", err);
      setErrorMsg(err.message || "Failed to execute authentication");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-[#0B0F19] border border-[#1E293B] rounded-[2px] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh] text-slate-100">
        {/* Top Header: Dark Industrial */}
        <div className="bg-[#070C18] text-white p-3.5 flex items-center justify-between border-b border-[#1E293B]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[2px] bg-[#FFD900] text-[#070C18] flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 fill-current text-[#070C18]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-extrabold uppercase tracking-wider text-white">
                  Step-Up Authentication
                </span>
                <span className="px-1.5 py-0.5 rounded-[1px] bg-[#1E293B] text-[#FFD900] font-mono text-[10px] font-bold border border-[#FFD900]/30">
                  2FA Protocol
                </span>
              </div>
              <div className="text-[10px] font-mono text-[#94A3B8]">
                Courier: {courier.name} ({courier.id}) • Risk Score: {courier.riskScore}/100 ({courier.riskLevel})
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-[#94A3B8] hover:text-white p-1 rounded-[1px] hover:bg-[#1E293B] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Step Breadcrumb Bar */}
        <div className="grid grid-cols-3 bg-[#090D18] border-b border-[#1E293B] font-mono text-xs">
          <div
            className={`py-2 px-3 flex items-center justify-center gap-1.5 border-r border-[#1E293B] transition ${
              currentStep === 1
                ? "bg-[#0B0F19] text-[#FFD900] font-extrabold border-b-2 border-b-[#FFD900]"
                : currentStep > 1
                ? "text-[#10B981] font-bold"
                : "text-[#64748B]"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-[#1E293B] text-[#FFD900] text-[10px] flex items-center justify-center font-bold">
              {currentStep > 1 ? "✓" : "1"}
            </span>
            <span>Triage</span>
          </div>

          <div
            className={`py-2 px-3 flex items-center justify-center gap-1.5 border-r border-[#1E293B] transition ${
              currentStep === 2
                ? "bg-[#0B0F19] text-[#FFD900] font-extrabold border-b-2 border-b-[#FFD900]"
                : currentStep > 2
                ? "text-[#10B981] font-bold"
                : "text-[#64748B]"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-[#1E293B] text-[#FFD900] text-[10px] flex items-center justify-center font-bold">
              {currentStep > 2 ? "✓" : "2"}
            </span>
            <span>Challenge</span>
          </div>

          <div
            className={`py-2 px-3 flex items-center justify-center gap-1.5 transition ${
              currentStep === 3
                ? "bg-[#0B0F19] text-[#FFD900] font-extrabold border-b-2 border-b-[#FFD900]"
                : "text-[#64748B]"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-[#1E293B] text-[#FFD900] text-[10px] flex items-center justify-center font-bold">
              3
            </span>
            <span>Verdict</span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 flex-1 min-h-0 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 bg-[#7F1D1D]/40 border border-[#EF4444]/50 rounded-[2px] text-xs font-mono text-[#FCA5A5]">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: Threat Assessment & Step-Up Triage */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Courier Profile & Threat Severity */}
              <div className="p-4 bg-[#0F172A] border border-[#1E293B] rounded-[2px] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-[2px] bg-[#070C18] text-[#FFD900] flex items-center justify-center font-mono font-bold text-lg border border-[#1E293B]">
                    {courier.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{courier.name}</h3>
                    <div className="text-xs font-mono text-[#94A3B8] mt-0.5">
                      Rider ID: <span className="text-white font-bold">{courier.id}</span> • {courier.zone || "Mumbai Central"}
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-[10px] text-[#64748B] uppercase font-bold block">Assessed Risk</span>
                  <span
                    className={`text-2xl font-extrabold ${
                      courier.riskScore >= 70
                        ? "text-[#EF4444]"
                        : courier.riskScore >= 40
                        ? "text-[#F59E0B]"
                        : "text-[#10B981]"
                    }`}
                  >
                    {courier.riskScore}/100
                  </span>
                  <span className="text-[10px] text-[#EF4444] font-bold block uppercase">
                    {courier.riskLevel === "L3" ? "L3 Security Hold" : "L2 Challenge Required"}
                  </span>
                </div>
              </div>

              {/* Explaining Detected Anomalies */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold uppercase text-[#94A3B8] tracking-wider block">
                  Detected Identity Telemetry Triggers:
                </span>
                <div className="space-y-1.5 font-mono text-xs">
                  {(courier.triggers || [
                    "Motor touch cadence deviation (+3.4σ from enrolled baseline)",
                    "Unregistered device hardware signature detected in active session",
                    "High-velocity off-corridor displacement between order delivery points",
                  ]).map((trig, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-[2px] bg-[#0F172A] border border-[#1E293B] flex items-start gap-2"
                    >
                      <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                      <span className="text-slate-200">{trig}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Operational Notice */}
              <div className="p-3 bg-[#0F172A] border border-[#F59E0B]/40 rounded-[2px] text-xs font-sans text-slate-300 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Fairness Policy:</strong> Dispatch hold is active during verification. No driver rating or earnings penalty is applied during evaluation.
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Dual-Factor Interactive Challenge */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Factor 1: Device SIM Possession (OTP) */}
              <div className="p-4 bg-[#0F172A] border border-[#1E293B] rounded-[2px] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase text-white flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-[#06B6D4]" />
                    <span>Factor 1: SIM Authentication (SMS OTP)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-[1px] bg-[#064E3B] text-[#6EE7B7] border border-[#10B981]/40 text-[10px] font-mono font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>SIM BOUND</span>
                  </span>
                </div>

                <p className="text-xs text-[#94A3B8]">
                  Enter the 6-digit one-time PIN dispatched to registered SIM (+91 ••••• ••821):
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => {
                      setOtpCode(e.target.value);
                      setIsOtpVerified(e.target.value.length === 6);
                    }}
                    placeholder="849201"
                    className="w-36 px-3 py-2 bg-[#070C18] border border-[#334155] focus:border-[#FFD900] font-mono text-base font-bold tracking-widest text-center text-[#FFD900] rounded-[2px] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setOtpCode("849201");
                      setIsOtpVerified(true);
                    }}
                    className="px-3 py-2 text-xs font-mono font-bold bg-[#1E293B] hover:bg-[#334155] text-slate-200 rounded-[2px] transition cursor-pointer"
                  >
                    Auto-Fill (849201)
                  </button>
                </div>
              </div>

              {/* Factor 2: Live Biometric Face & Liveness Verification */}
              <div className="p-4 bg-[#0F172A] border border-[#1E293B] rounded-[2px] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase text-white flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-[#10B981]" />
                    <span>Factor 2: Live Facial Biometrics</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#06B6D4]">
                    Zero-Knowledge Vector Matching
                  </span>
                </div>

                {/* Video / Camera Preview Window */}
                <div className="w-full h-56 bg-[#070C18] rounded-[2px] border border-[#1E293B] relative overflow-hidden flex items-center justify-center">
                  {/* Permanent Video Element in DOM */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-200 ${
                      !isSimulatedFeed && cameraActive ? "opacity-100 z-10" : "opacity-0 pointer-events-none -z-10"
                    }`}
                  />

                  {/* Simulated Feed View */}
                  {isSimulatedFeed && (
                    <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-4 text-center bg-[#0B132B]/90 z-10">
                      <div className="w-20 h-20 rounded-full border-2 border-[#FFD900] overflow-hidden mb-2 relative flex items-center justify-center bg-[#1E293B]">
                        {courier.avatarUrl ? (
                          <img
                            src={courier.avatarUrl}
                            alt={courier.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-mono font-bold text-xl">
                            {courier.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <div className="absolute inset-x-0 h-0.5 bg-[#06B6D4] shadow-[0_0_8px_#06B6D4] animate-pulse top-1/2" />
                      </div>
                      <span className="font-mono text-xs text-[#06B6D4] font-bold">
                        {selectedDemoPreset === "NO_MATCH"
                          ? "IMPOSTER PROFILE SIMULATED"
                          : "ENROLLED REFERENCE TEMPLATE"}
                      </span>
                      <span className="text-[10px] font-mono text-[#64748B] mt-0.5">
                        Synthetic facial embedding vector loaded
                      </span>
                    </div>
                  )}

                  {/* Live Webcam Reticles Overlay */}
                  {!isSimulatedFeed && cameraActive && (
                    <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                      <div className="w-40 h-48 border-2 border-dashed border-[#06B6D4] rounded-[2px] relative">
                        <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[#FFD900]" />
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-[#FFD900]" />
                        <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-[#FFD900]" />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-[#FFD900]" />
                        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#06B6D4] to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse" />
                      </div>
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-[1px] bg-[#070C18]/90 border border-[#10B981]/50 text-[#10B981] text-[10px] font-mono font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                        <span>LIVE CAMERA ACTIVE (30 FPS)</span>
                      </div>
                    </div>
                  )}

                  {/* Camera hardware loading spinner */}
                  {isConnectingCamera && (
                    <div className="absolute inset-0 bg-[#070C18]/95 z-30 flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#FFD900]" />
                      <span className="text-xs font-mono text-white">Opening laptop camera stream...</span>
                    </div>
                  )}

                  {/* Mode Toggles */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 font-mono text-[10px] z-30">
                    <button
                      type="button"
                      onClick={() => {
                        stopCamera();
                        setIsSimulatedFeed(true);
                      }}
                      className={`px-2 py-1 rounded-[1px] border transition cursor-pointer ${
                        isSimulatedFeed
                          ? "bg-[#FFD900] text-[#070C18] font-bold border-[#FFD900]"
                          : "bg-[#0B132B]/80 text-[#94A3B8] border-[#334155] hover:text-white"
                      }`}
                    >
                      Simulated Feed
                    </button>
                    <button
                      type="button"
                      onClick={startLiveWebcam}
                      className={`px-2 py-1 rounded-[1px] border transition cursor-pointer flex items-center gap-1 ${
                        !isSimulatedFeed && cameraActive
                          ? "bg-[#10B981] text-white font-bold border-[#10B981]"
                          : "bg-[#0B132B]/80 text-[#94A3B8] border-[#334155] hover:text-white"
                      }`}
                    >
                      <Camera className="w-3 h-3" />
                      <span>Use Laptop Camera</span>
                    </button>
                  </div>
                </div>

                {/* Camera error notification if any */}
                {cameraError && (
                  <div className="p-2.5 rounded-[2px] bg-[#7F1D1D]/30 border border-[#EF4444]/40 text-[#FCA5A5] font-mono text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-[#EF4444]" />
                    <span>{cameraError}</span>
                  </div>
                )}

                {/* Scenario Profiles Selector */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono font-bold text-[#94A3B8] uppercase block">
                    Select Verification Profile (Interactive Test):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedDemoPreset("MATCH")}
                      className={`p-2.5 rounded-[2px] border text-left transition cursor-pointer ${
                        selectedDemoPreset === "MATCH"
                          ? "bg-[#064E3B]/50 border-[#10B981] text-[#6EE7B7] font-bold"
                          : "bg-[#0B132B] border-[#1E293B] text-[#94A3B8] hover:border-[#334155]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>1. Genuine Courier</span>
                        <span className="text-[10px]">96.4%</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                        Matches baseline vector template
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedDemoPreset("NO_MATCH")}
                      className={`p-2.5 rounded-[2px] border text-left transition cursor-pointer ${
                        selectedDemoPreset === "NO_MATCH"
                          ? "bg-[#7F1D1D]/50 border-[#EF4444] text-[#FCA5A5] font-bold"
                          : "bg-[#0B132B] border-[#1E293B] text-[#94A3B8] hover:border-[#334155]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>2. Imposter / Rented</span>
                        <span className="text-[10px]">34.2%</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                        Unauthorized third-party user
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedDemoPreset("INCONCLUSIVE")}
                      className={`p-2.5 rounded-[2px] border text-left transition cursor-pointer ${
                        selectedDemoPreset === "INCONCLUSIVE"
                          ? "bg-[#78350F]/50 border-[#F59E0B] text-[#FDE68A] font-bold"
                          : "bg-[#0B132B] border-[#1E293B] text-[#94A3B8] hover:border-[#334155]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>3. Low Light / Fallback</span>
                        <span className="text-[10px]">61.2%</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                        Sensor failure; non-punitive triage
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Factor 3: Acoustic Voice Challenge & Dynamic Passphrase */}
              <div className="p-4 bg-[#0F172A] border border-[#1E293B] rounded-[2px] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase text-white flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-[#FFD900]" />
                    <span>Factor 3: Dynamic Voice Challenge</span>
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer text-[10px] font-mono text-[#06B6D4]">
                    <input
                      type="checkbox"
                      checked={includeVoiceChallenge}
                      onChange={(e) => setIncludeVoiceChallenge(e.target.checked)}
                      className="accent-[#FFD900] w-3 h-3 rounded-[1px]"
                    />
                    <span>Tri-Factor Active</span>
                  </label>
                </div>

                {includeVoiceChallenge && (
                  <div className="space-y-2.5">
                    <div className="p-3 bg-[#070C18] border-l-2 border-l-[#FFD900] border-t border-r border-b border-[#1E293B] rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-[10px] font-mono text-[#94A3B8] uppercase">
                          Dynamic Prompt (Acoustic anti-replay phrase):
                        </div>
                        <div className="text-xs font-bold text-white font-mono mt-0.5">
                          "{voicePhrase}"
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const phrases = [
                            "Confirm Bangalore Koramangala route five eight two",
                            "TrueRide authorization code seven four one zero",
                            "Active courier biometric confirmation three six nine",
                            "Verified transit checkpoint alpha delta four",
                          ];
                          const next = phrases[(phrases.indexOf(voicePhrase) + 1) % phrases.length];
                          setVoicePhrase(next);
                        }}
                        className="px-2 py-1 rounded-[1px] bg-[#1E293B] hover:bg-[#334155] text-[#FFD900] text-[10px] font-mono font-bold shrink-0 self-start sm:self-center transition cursor-pointer"
                      >
                        Randomize Phrase
                      </button>
                    </div>

                    {/* Voice audio simulation & playback controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#070C18] border border-[#1E293B] rounded-[2px]">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof window !== "undefined" && "speechSynthesis" in window) {
                              setIsSpeakingPhrase(true);
                              window.speechSynthesis.cancel();
                              const utterance = new SpeechSynthesisUtterance(voicePhrase);
                              utterance.rate = 0.95;
                              utterance.onend = () => setIsSpeakingPhrase(false);
                              utterance.onerror = () => setIsSpeakingPhrase(false);
                              window.speechSynthesis.speak(utterance);
                            }
                          }}
                          disabled={isSpeakingPhrase}
                          className="px-2.5 py-1 rounded-[2px] bg-[#1E293B] hover:bg-[#334155] text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-[#06B6D4]" />
                          <span>{isSpeakingPhrase ? "Speaking..." : "Hear Prompt"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsVoiceRecording(true);
                            setTimeout(() => {
                              setIsVoiceRecording(false);
                              setVoiceRecorded(true);
                            }, 1500);
                          }}
                          disabled={isVoiceRecording}
                          className={`px-3 py-1 rounded-[2px] text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                            isVoiceRecording
                              ? "bg-[#EF4444] text-white animate-pulse"
                              : "bg-[#06B6D4] hover:bg-[#0891B2] text-[#070C18]"
                          }`}
                        >
                          <Mic className="w-3.5 h-3.5" />
                          <span>{isVoiceRecording ? "Analyzing Audio..." : "Simulate / Speak Audio"}</span>
                        </button>
                      </div>

                      {/* Equalizer animation bar */}
                      <div className="flex items-center gap-1 h-4">
                        {[12, 20, 8, 16, 24, 10, 18, 14, 22].map((h, i) => (
                          <div
                            key={i}
                            className={`w-1 rounded-full transition-all duration-150 ${
                              isVoiceRecording || isSpeakingPhrase
                                ? "bg-[#FFD900] animate-pulse"
                                : selectedDemoPreset === "NO_MATCH"
                                ? "bg-[#EF4444]"
                                : "bg-[#10B981]"
                            }`}
                            style={{ height: isVoiceRecording || isSpeakingPhrase ? `${h}px` : "6px" }}
                          />
                        ))}
                        <span className="text-[10px] font-mono text-[#94A3B8] ml-1">
                          {selectedDemoPreset === "NO_MATCH"
                            ? "Spoof Warning"
                            : selectedDemoPreset === "INCONCLUSIVE"
                            ? "Ambient Noise"
                            : "Acoustic Pass"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Cryptographic Decision & Resolution */}
          {currentStep === 3 && authOutcome && (
            <div className="space-y-4 font-sans">
              {authOutcome.authVerdict === "AUTHENTICATED" ? (
                <div className="p-5 rounded-[2px] bg-[#062D1F] border border-[#10B981] text-[#A7F3D0] space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#10B981] text-[#070C18] flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold uppercase font-mono text-[#6EE7B7]">
                        Identity Authenticated: Legitimate Courier
                      </h3>
                      <div className="text-xs text-slate-300 mt-0.5">
                        Facial similarity vector: <strong className="font-mono text-white">{(authOutcome.similarityScore * 100).toFixed(1)}%</strong> (&ge;80% threshold). Liveness verified.
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#0B1E17] rounded-[2px] border border-[#10B981]/30 font-mono text-xs text-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[#94A3B8]">Clearance Certificate:</span>
                      <span className="font-bold text-[#6EE7B7]">{authOutcome.clearanceToken}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#94A3B8]">Verification Event ID:</span>
                      <span className="font-bold">{authOutcome.verificationId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#94A3B8]">Case Resolution:</span>
                      <span className="font-bold text-[#6EE7B7]">VERIFIED_LEGITIMATE</span>
                    </div>
                    {authOutcome.voiceChallenge && (
                      <div className="flex items-center justify-between text-[#FFD900] border-t border-[#10B981]/20 pt-1">
                        <span className="text-[#94A3B8]">Voice Dynamic Liveness:</span>
                        <span className="font-bold">
                          {(authOutcome.voiceChallenge.voiceMatchScore * 100).toFixed(1)}% Match • Anti-Deepfake Clean
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-300">
                    Dispatch hold cleared immediately. Courier account standing protected without penalties.
                  </p>
                </div>
              ) : authOutcome.authVerdict === "IMPOSTER_REJECTED" ? (
                <div className="p-5 rounded-[2px] bg-[#3F0E0E] border border-[#EF4444] text-[#FECACA] space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#EF4444] text-white flex items-center justify-center">
                      <ShieldX className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold uppercase font-mono text-[#F87171]">
                        Authentication Failed: Imposter Detected
                      </h3>
                      <div className="text-xs text-slate-300 mt-0.5">
                        Facial embedding similarity was <strong className="font-mono text-white">{(authOutcome.similarityScore * 100).toFixed(1)}%</strong> (&lt;50% threshold).
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#260B0B] rounded-[2px] border border-[#EF4444]/30 font-mono text-xs text-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[#94A3B8]">Detected Threat:</span>
                      <span className="font-bold text-[#F87171]">UNAUTHORIZED ACCOUNT HANDOFF</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#94A3B8]">Enforcement Action:</span>
                      <span className="font-bold text-[#F87171]">FREEZE DISPATCH &amp; ESCALATE</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#94A3B8]">Security Case Status:</span>
                      <span className="font-bold text-[#F87171]">CONFIRMED_ACCOUNT_HANDOFF</span>
                    </div>
                    {authOutcome.voiceChallenge && (
                      <div className="flex items-center justify-between text-[#F87171] border-t border-[#EF4444]/20 pt-1">
                        <span className="text-[#94A3B8]">Voiceprint Result:</span>
                        <span className="font-bold">
                          {authOutcome.voiceChallenge.voiceOutcome} ({(authOutcome.voiceChallenge.voiceMatchScore * 100).toFixed(1)}%) • Deepfake Flagged
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-300">
                    Delivery session frozen to protect customer safety. Case forwarded to compliance review.
                  </p>
                </div>
              ) : (
                <div className="p-5 rounded-[2px] bg-[#382606] border border-[#F59E0B] text-[#FDE68A] space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#F59E0B] text-[#070C18] flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold uppercase font-mono text-[#FBBF24]">
                        Inconclusive Scan: Supervisor Callback Dispatched
                      </h3>
                      <div className="text-xs text-slate-300 mt-0.5">
                        Lighting or camera hardware precluded automated matching.
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#241703] rounded-[2px] border border-[#F59E0B]/30 font-mono text-xs text-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[#94A3B8]">Fallback Route:</span>
                      <span className="font-bold text-[#FBBF24]">SUPERVISOR VIDEO CALL (&lt;3 MINS)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#94A3B8]">Worker Penalty:</span>
                      <span className="font-bold text-[#10B981]">NONE (Earnings Guaranteed)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="bg-[#070C18] border-t border-[#1E293B] p-3.5 flex items-center justify-between font-mono text-xs">
          <div>
            {currentStep > 1 && currentStep < 3 && (
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-3 py-1.5 rounded-[2px] border border-[#334155] bg-[#0F172A] text-slate-300 hover:text-white font-bold transition cursor-pointer"
              >
                &larr; Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep === 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 rounded-[2px] bg-[#FFD900] hover:bg-[#e6c400] text-[#070C18] font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <span>Proceed to Challenge</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={handleExecuteAuthentication}
                disabled={isSubmitting || !isOtpVerified}
                className="px-5 py-2 rounded-[2px] bg-[#FFD900] hover:bg-[#e6c400] text-[#070C18] font-extrabold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#070C18]" />
                    <span>Validating Vectors...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 text-[#070C18]" />
                    <span>Submit &amp; Authenticate</span>
                  </>
                )}
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="px-4 py-2 rounded-[2px] bg-[#1E293B] hover:bg-[#334155] text-white font-bold transition cursor-pointer"
              >
                Close Window
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
