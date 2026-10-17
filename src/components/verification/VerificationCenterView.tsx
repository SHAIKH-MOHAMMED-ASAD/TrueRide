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
} from "lucide-react";

interface VerificationCenterProps {
  onRefreshMetrics?: () => void;
}

export function VerificationCenterView({ onRefreshMetrics }: VerificationCenterProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationOutcome, setVerificationOutcome] = useState<any | null>(null);
  const [selectedRider, setSelectedRider] = useState("RDR-8021");
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"LIVE_CAMERA" | "MANUAL_FALLBACK">("LIVE_CAMERA");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Start live webcam stream
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn("Webcam access unavailable or permission denied:", err);
      setCameraError(
        "Camera permission denied or hardware unavailable. You can use the built-in synthetic verification simulator or manual supervisor fallback."
      );
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Capture frame from webcam or simulate capture
  const handleCapture = () => {
    if (cameraActive && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    } else {
      // Synthetic fallback capture
      setCapturedImage("SYNTHETIC_FRAME_CAPTURED");
    }
  };

  // Run verification comparison
  const handleRunVerification = async (forcedOutcome?: "MATCH" | "NO_MATCH" | "INCONCLUSIVE") => {
    setIsVerifying(true);
    setVerificationOutcome(null);

    // Simulate embedding comparison latency
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
          const updateData = await updateRes.json();
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
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0a1828] via-[#0c1f38] to-[#0a1828] border border-cyan-500/30 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                PROPORTIONATE STEP-UP CHECK
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Triggered on Elevated Risk • Never Every Login
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Biometric Step-Up Verification Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              When behavioral indicators flag a potential rented account handoff, TrueRide initiates a fast 2-second live face check. Discarded from memory immediately after comparison to protect rider privacy.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Zero Document/Aadhaar Collection</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Camera Box vs Verification Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Camera View */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-[#0c162c] border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Live Rider Verification Feed
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Rider ID: <strong className="text-white">{selectedRider}</strong>
            </span>
          </div>

          {/* Camera Frame Box */}
          <div className="relative aspect-video w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                />
                {/* Face Scanning Overlay Frame */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-56 border-2 border-dashed border-cyan-400/80 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)] relative">
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-cyan-300 bg-slate-950/80 px-2 py-0.5 rounded">
                      Align Face Here
                    </span>
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent absolute top-1/2 animate-bounce" />
                  </div>
                </div>
              </>
            ) : capturedImage ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/80 p-4 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-400 mb-2" />
                <span className="text-sm font-semibold text-white">
                  Biometric Frame Captured
                </span>
                <span className="text-xs text-slate-400 font-mono mt-1">
                  Ready for facial embedding comparison against reference portrait
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <Scan className="w-12 h-12 text-slate-600 mb-2" />
                <span className="text-sm font-semibold text-slate-300">
                  Webcam Stream Inactive
                </span>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Click &ldquo;Start Camera Stream&rdquo; to test live face verification using your browser webcam, or run the synthetic simulator below.
                </p>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {cameraError && (
            <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-200 text-xs">
              {cameraError}
            </div>
          )}

          {/* Camera Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              {!cameraActive ? (
                <button
                  onClick={startCamera}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Start Camera Stream</span>
                </button>
              ) : (
                <button
                  onClick={handleCapture}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span>Capture Live Frame</span>
                </button>
              )}

              {capturedImage && (
                <button
                  onClick={() => {
                    setCapturedImage(null);
                    setVerificationOutcome(null);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition cursor-pointer"
                >
                  Retake Frame
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono">Test Outcomes:</span>
              <button
                onClick={() => handleRunVerification("MATCH")}
                disabled={isVerifying}
                className="px-2.5 py-1.5 rounded text-xs font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 cursor-pointer disabled:opacity-50"
              >
                Match (94%)
              </button>
              <button
                onClick={() => handleRunVerification("NO_MATCH")}
                disabled={isVerifying}
                className="px-2.5 py-1.5 rounded text-xs font-mono bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 cursor-pointer disabled:opacity-50"
              >
                No Match (38%)
              </button>
              <button
                onClick={() => handleRunVerification("INCONCLUSIVE")}
                disabled={isVerifying}
                className="px-2.5 py-1.5 rounded text-xs font-mono bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900 cursor-pointer disabled:opacity-50"
              >
                Inconclusive
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Reference Dossier & Verification Outcome */}
        <div className="lg:col-span-5 space-y-5">
          {/* Reference Profile Card */}
          <div className="p-5 rounded-2xl bg-[#0c162c] border border-slate-800 shadow-md">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-teal-400" /> Authorized Reference Dossier
            </h3>

            <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 border border-cyan-500/40 shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                  alt="Enrolled Reference"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="text-xs">
                <div className="font-bold text-white text-sm">Arjun Kumar</div>
                <div className="text-slate-400 font-mono text-[11px]">RDR-8021 • Koramangala</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-emerald-300 font-mono">
                    Enrolled Reference Portrait
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-slate-400 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Enrollment Check:</span>
                <span className="text-white">Aadhaar Offline XML (Synthetic)</span>
              </div>
              <div className="flex justify-between">
                <span>Embedding Model:</span>
                <span className="text-cyan-400">FaceNet-ResNet50 / 512-dim</span>
              </div>
              <div className="flex justify-between">
                <span>Match Threshold:</span>
                <span className="text-white">Cosine Similarity &ge; 0.75</span>
              </div>
            </div>
          </div>

          {/* Verification Outcome Panel */}
          {isVerifying ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-cyan-500/40 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Extracting Facial Embeddings...</h4>
              <p className="text-xs text-slate-400 font-mono max-w-xs mx-auto">
                Comparing 512-dimensional vector with stored reference portrait.
              </p>
            </div>
          ) : verificationOutcome ? (
            <div
              className={`p-5 rounded-2xl border shadow-xl space-y-4 animate-in fade-in duration-300 ${
                verificationOutcome.result === "MATCH"
                  ? "bg-emerald-950/30 border-emerald-500/50"
                  : verificationOutcome.result === "NO_MATCH"
                  ? "bg-rose-950/30 border-rose-500/50"
                  : "bg-amber-950/30 border-amber-500/50"
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  {verificationOutcome.result === "MATCH" ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : verificationOutcome.result === "NO_MATCH" ? (
                    <XCircle className="w-5 h-5 text-rose-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  )}
                  <h4 className="font-bold text-white text-sm">
                    Outcome: {verificationOutcome.result}
                  </h4>
                </div>

                <span className="font-mono text-xs font-bold text-white">
                  Similarity: {(verificationOutcome.similarityScore * 100).toFixed(1)}%
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-2">
                {verificationOutcome.result === "MATCH" && (
                  <p>
                    Biometric match confirmed! The live camera capture matches Arjun Kumar&apos;s enrolled portrait with 94.2% cosine similarity. Case automatically marked <strong>VERIFIED_LEGITIMATE</strong>.
                  </p>
                )}

                {verificationOutcome.result === "NO_MATCH" && (
                  <div className="space-y-1">
                    <p className="text-rose-300 font-medium">
                      Biometric mismatch detected. Live face does not match enrolled reference.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Case elevated to <strong>CRITICAL</strong> priority for Trust & Safety investigation.
                    </p>
                  </div>
                )}

                {verificationOutcome.result === "INCONCLUSIVE" && (
                  <div className="space-y-2">
                    <p className="text-amber-300 font-medium">
                      Check Inconclusive: {verificationOutcome.qualityWarning}.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Rule of fairness: Inconclusive result is NOT treated as fraud. Alternative fallback route activated.
                    </p>
                    <button className="px-3 py-1.5 rounded bg-amber-900/60 hover:bg-amber-900 text-amber-200 border border-amber-700 text-xs font-mono flex items-center gap-1.5 cursor-pointer">
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Request Supervisor Callback</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[#0c162c] border border-slate-800 text-center text-slate-500 text-xs">
              Perform a camera capture or click a test outcome above to execute the biometric verification pipeline.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
