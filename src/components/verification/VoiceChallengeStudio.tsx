"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Square,
  Activity,
  Radio,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface VoiceChallengeStudioProps {
  initialRiderId?: string;
  onVerificationComplete?: (result: any) => void;
}

const DEFAULT_PHRASES = [
  "Confirm Bangalore Koramangala route five eight two",
  "TrueRide authorization code seven four one zero",
  "Active courier biometric confirmation three six nine",
  "Verified transit checkpoint alpha delta four",
  "Express parcel dispatch clearance eight nine one",
];

export function VoiceChallengeStudio({
  initialRiderId = "RDR-8021",
  onVerificationComplete,
}: VoiceChallengeStudioProps) {
  const [riderId, setRiderId] = useState<string>(initialRiderId);
  const [currentPhrase, setCurrentPhrase] = useState<string>(DEFAULT_PHRASES[0]);
  const [challengeId, setChallengeId] = useState<string>("VC-891042");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [hasCapturedAudio, setHasCapturedAudio] = useState<boolean>(false);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);

  // Preset selector
  const [selectedPreset, setSelectedPreset] = useState<"MATCH" | "NO_MATCH" | "INCONCLUSIVE">("MATCH");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Audio Canvas ref & animation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Timer for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 4) {
            stopRecording();
            return 4;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Clean up audio streams on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Live Canvas Waveform Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let phase = 0;

    const renderWaveform = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const numBars = 48;
      const barWidth = canvas.width / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        let height = 6;
        if (isRecording || isPlayingAudio) {
          // Dynamic pulsating bars simulating audio spectral frequency
          const freq = Math.sin(phase + i * 0.3) * Math.cos(phase * 0.8 + i * 0.15);
          height = Math.max(8, Math.abs(freq) * (canvas.height * 0.85));
        } else if (hasCapturedAudio) {
          // Ambient static envelope
          const staticEnvelope = Math.sin(i * 0.2) * 16 + 18;
          height = Math.max(6, staticEnvelope);
        }

        const x = i * (barWidth + 2);
        const y = (canvas.height - height) / 2;

        // Gradient based on state
        const gradient = ctx.createLinearGradient(0, y, 0, y + height);
        if (selectedPreset === "NO_MATCH" && hasCapturedAudio) {
          gradient.addColorStop(0, "#EF4444");
          gradient.addColorStop(1, "#7F1D1D");
        } else if (selectedPreset === "INCONCLUSIVE" && hasCapturedAudio) {
          gradient.addColorStop(0, "#F59E0B");
          gradient.addColorStop(1, "#78350F");
        } else if (isRecording) {
          gradient.addColorStop(0, "#FFD900");
          gradient.addColorStop(1, "#06B6D4");
        } else {
          gradient.addColorStop(0, "#10B981");
          gradient.addColorStop(1, "#06B6D4");
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, height);
      }

      phase += 0.08;
      animationFrameRef.current = requestAnimationFrame(renderWaveform);
    };

    renderWaveform();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording, isPlayingAudio, hasCapturedAudio, selectedPreset]);

  const generateNewPhrase = () => {
    const nextIdx = (DEFAULT_PHRASES.indexOf(currentPhrase) + 1) % DEFAULT_PHRASES.length;
    setCurrentPhrase(DEFAULT_PHRASES[nextIdx]);
    setChallengeId(`VC-${Date.now().toString().slice(-6)}`);
    setHasCapturedAudio(false);
    setVerificationResult(null);
  };

  const startRecording = async () => {
    setMicPermissionError(null);
    setVerificationResult(null);
    setRecordingSeconds(0);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyserRef.current = analyser;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
        }
      }
    } catch (err: any) {
      console.warn("Microphone hardware access warning:", err);
      setMicPermissionError(
        "Microphone device not accessible in sandbox. Engaged synthetic acoustic capture pipeline."
      );
    }

    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsRecording(false);
    setHasCapturedAudio(true);
  };

  const playPhraseAudio = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsPlayingAudio(true);
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentPhrase);
      utterance.rate = 0.95;
      utterance.pitch = selectedPreset === "NO_MATCH" ? 1.4 : selectedPreset === "INCONCLUSIVE" ? 0.7 : 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingAudio(true);
      setTimeout(() => setIsPlayingAudio(false), 2500);
    }
  };

  const handleSubmitVoiceVerification = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const voiceMatchScore =
      selectedPreset === "MATCH" ? 0.964 : selectedPreset === "NO_MATCH" ? 0.321 : 0.628;
    const antiDeepfakeScore =
      selectedPreset === "MATCH" ? 0.988 : selectedPreset === "NO_MATCH" ? 0.124 : 0.812;

    const payload = {
      riderId,
      phrase: currentPhrase,
      spokenTranscript: currentPhrase,
      voiceMatchScore,
      antiDeepfakeScore,
      voiceLivenessPassed: selectedPreset !== "NO_MATCH",
      voiceOutcome: selectedPreset,
      actor: "VOICE_CHALLENGE_STUDIO",
    };

    try {
      const res = await fetch("/api/verification/voice-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Voice challenge verification failed");
      }

      setVerificationResult(data);
      if (onVerificationComplete) {
        onVerificationComplete(data);
      }
    } catch (err: any) {
      console.error("Voice verification submit error:", err);
      setErrorMsg(err.message || "Failed to submit voice verification");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-5 rounded-[2px] bg-[#070C18] border border-[#FFD900]/40 text-white shadow-2xl space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1E293B] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[2px] bg-[#FFD900]/20 border border-[#FFD900]/60 flex items-center justify-center text-[#FFD900]">
            <Radio className="w-5 h-5 animate-pulse text-[#FFD900]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-extrabold tracking-widest text-[#FFD900] uppercase">
                Acoustic Biometrics & Dynamic Liveness
              </span>
              <span className="px-1.5 py-0.5 rounded-[1px] bg-[#06B6D4]/20 text-[#38BDF8] border border-[#06B6D4]/40 text-[10px] font-mono font-bold">
                Anti-Deepfake Engine
              </span>
            </div>
            <h2 className="text-base font-extrabold text-white uppercase tracking-wider font-mono">
              Voice Challenge Studio
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#94A3B8]">
          <span>Target Courier:</span>
          <input
            type="text"
            value={riderId}
            onChange={(e) => setRiderId(e.target.value)}
            className="w-28 px-2 py-1 bg-[#0F172A] border border-[#334155] rounded-[2px] text-white font-mono text-xs focus:border-[#FFD900] outline-none"
          />
        </div>
      </div>

      {micPermissionError && (
        <div className="p-2.5 bg-[#78350F]/30 border border-[#F59E0B]/50 rounded-[2px] text-xs font-mono text-[#FDE68A] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0" />
          <span>{micPermissionError}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-2.5 bg-[#7F1D1D]/40 border border-[#EF4444]/50 rounded-[2px] text-xs font-mono text-[#FCA5A5]">
          {errorMsg}
        </div>
      )}

      {/* Main Grid: Challenge Card + Waveform Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Dynamic Challenge Phrase Box */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 bg-[#0B132B] border border-[#1E293B] rounded-[2px] space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-[#38BDF8] uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FFD900]" />
                <span>Dynamic Challenge Phrase ({challengeId})</span>
              </span>
              <button
                type="button"
                onClick={generateNewPhrase}
                className="px-2 py-1 rounded-[1px] bg-[#1E293B] hover:bg-[#334155] text-slate-200 text-[10px] font-mono font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 text-[#FFD900]" />
                <span>New Phrase</span>
              </button>
            </div>

            <div className="p-3.5 bg-[#070C18] border-l-2 border-l-[#FFD900] border-t border-r border-b border-[#1E293B] rounded-[2px]">
              <div className="text-[10px] font-mono text-[#64748B] uppercase mb-1">
                Active Phrase to Speak (Acoustic Phoneme Validation):
              </div>
              <div className="text-base font-extrabold text-white font-mono tracking-wide leading-snug">
                "{currentPhrase}"
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs font-mono">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={playPhraseAudio}
                  disabled={isPlayingAudio}
                  className="px-3 py-1.5 rounded-[2px] bg-[#1E293B] hover:bg-[#334155] text-slate-200 font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  {isPlayingAudio ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-[#06B6D4] animate-pulse" />
                      <span>Speaking...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-[#06B6D4]" />
                      <span>Hear Prompt</span>
                    </>
                  )}
                </button>

                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="px-3.5 py-1.5 rounded-[2px] bg-[#FFD900] hover:bg-[#E5C300] text-[#070C18] font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-md"
                  >
                    <Mic className="w-4 h-4 text-[#070C18]" />
                    <span>Record Voice Challenge</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="px-3.5 py-1.5 rounded-[2px] bg-[#EF4444] hover:bg-[#DC2626] text-white font-extrabold flex items-center gap-1.5 transition cursor-pointer animate-pulse"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop ({recordingSeconds}s / 4s)</span>
                  </button>
                )}
              </div>

              <span className="text-[11px] text-[#94A3B8]">
                {hasCapturedAudio ? (
                  <span className="text-[#10B981] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                    <span>Acoustic sample captured</span>
                  </span>
                ) : (
                  <span>Awaiting voice capture</span>
                )}
              </span>
            </div>
          </div>

          {/* Preset Test Profiles */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono font-bold text-[#94A3B8] uppercase block">
              Simulation Scenario Profile:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setSelectedPreset("MATCH")}
                className={`p-2.5 rounded-[2px] border text-left transition cursor-pointer ${
                  selectedPreset === "MATCH"
                    ? "bg-[#064E3B]/60 border-[#10B981] text-[#6EE7B7] font-bold"
                    : "bg-[#0B132B] border-[#1E293B] text-[#94A3B8] hover:border-[#334155]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>1. Genuine Voice</span>
                  <span className="text-[10px]">96.4%</span>
                </div>
                <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                  F0 pitch match, 98.8% anti-spoof
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPreset("NO_MATCH")}
                className={`p-2.5 rounded-[2px] border text-left transition cursor-pointer ${
                  selectedPreset === "NO_MATCH"
                    ? "bg-[#7F1D1D]/60 border-[#EF4444] text-[#FCA5A5] font-bold"
                    : "bg-[#0B132B] border-[#1E293B] text-[#94A3B8] hover:border-[#334155]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>2. Deepfake Spoof</span>
                  <span className="text-[10px]">32.1%</span>
                </div>
                <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                  AI clone detected (12.4% liveness)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPreset("INCONCLUSIVE")}
                className={`p-2.5 rounded-[2px] border text-left transition cursor-pointer ${
                  selectedPreset === "INCONCLUSIVE"
                    ? "bg-[#78350F]/60 border-[#F59E0B] text-[#FDE68A] font-bold"
                    : "bg-[#0B132B] border-[#1E293B] text-[#94A3B8] hover:border-[#334155]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>3. Ambient Monsoon</span>
                  <span className="text-[10px]">62.8%</span>
                </div>
                <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                  Traffic noise SNR &lt; 6dB; triage
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Live Frequency Spectrum Canvas */}
        <div className="lg:col-span-5 p-4 bg-[#0B132B] border border-[#1E293B] rounded-[2px] flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-bold text-white flex items-center gap-1.5 uppercase">
                <Activity className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Acoustic Waveform & Harmonics</span>
              </span>
              <span className="text-[10px] font-mono text-[#06B6D4]">
                48-Band Fast Fourier (FFT)
              </span>
            </div>

            {/* Canvas Box */}
            <div className="h-28 w-full bg-[#070C18] border border-[#1E293B] rounded-[2px] relative overflow-hidden flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={360}
                height={112}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-1 flex justify-between px-2 font-mono text-[9px] text-[#475569] pointer-events-none">
                <span>100 Hz</span>
                <span>1.2 kHz</span>
                <span>4.0 kHz</span>
                <span>8.0 kHz</span>
              </div>
            </div>
          </div>

          {/* Live Spectral Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 font-mono text-xs pt-1 border-t border-[#1E293B]">
            <div className="p-2 bg-[#070C18] border border-[#1E293B] rounded-[1px]">
              <div className="text-[9px] text-[#94A3B8] uppercase">Voiceprint Pitch Match</div>
              <div
                className={`text-sm font-extrabold ${
                  selectedPreset === "MATCH"
                    ? "text-[#10B981]"
                    : selectedPreset === "NO_MATCH"
                    ? "text-[#EF4444]"
                    : "text-[#F59E0B]"
                }`}
              >
                {selectedPreset === "MATCH"
                  ? "96.4%"
                  : selectedPreset === "NO_MATCH"
                  ? "32.1%"
                  : "62.8%"}
              </div>
            </div>

            <div className="p-2 bg-[#070C18] border border-[#1E293B] rounded-[1px]">
              <div className="text-[9px] text-[#94A3B8] uppercase">Anti-Deepfake Liveness</div>
              <div
                className={`text-sm font-extrabold ${
                  selectedPreset === "MATCH"
                    ? "text-[#10B981]"
                    : selectedPreset === "NO_MATCH"
                    ? "text-[#EF4444]"
                    : "text-[#38BDF8]"
                }`}
              >
                {selectedPreset === "MATCH"
                  ? "98.8% (CLEAN)"
                  : selectedPreset === "NO_MATCH"
                  ? "12.4% (SYNTHETIC)"
                  : "81.2% (NOISY)"}
              </div>
            </div>
          </div>

          {/* Submit Verification Button */}
          <button
            type="button"
            onClick={handleSubmitVoiceVerification}
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-[2px] bg-[#06B6D4] hover:bg-[#0891B2] text-[#070C18] font-mono text-xs font-extrabold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#070C18]" />
                <span>Running Acoustic Engine...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-[#070C18]" />
                <span>Submit Voice Verification to Audit Trail</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Outcome Verdict Card if submitted */}
      {verificationResult && (
        <div
          className={`p-4 rounded-[2px] border font-mono text-xs space-y-2 animate-fade-in ${
            verificationResult.authVerdict === "AUTHENTICATED"
              ? "bg-[#062D1F] border-[#10B981] text-[#A7F3D0]"
              : verificationResult.authVerdict === "IMPOSTER_REJECTED"
              ? "bg-[#3F0E0E] border-[#EF4444] text-[#FECACA]"
              : "bg-[#451A03] border-[#F59E0B] text-[#FDE68A]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm uppercase flex items-center gap-2">
              {verificationResult.authVerdict === "AUTHENTICATED" ? (
                <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
              ) : verificationResult.authVerdict === "IMPOSTER_REJECTED" ? (
                <ShieldX className="w-5 h-5 text-[#EF4444]" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
              )}
              <span>Voice Verdict: {verificationResult.authVerdict}</span>
            </span>

            {verificationResult.clearanceToken && (
              <span className="px-2 py-0.5 rounded-[1px] bg-[#064E3B] text-[#6EE7B7] border border-[#10B981]/40 font-bold">
                {verificationResult.clearanceToken}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-white/10 text-[11px]">
            <div>
              <span className="text-slate-400">Verification ID:</span>{" "}
              <strong className="text-white">{verificationResult.verificationId}</strong>
            </div>
            <div>
              <span className="text-slate-400">Acoustic Score:</span>{" "}
              <strong className="text-white">
                {(verificationResult.voiceMatchScore * 100).toFixed(1)}%
              </strong>
            </div>
            <div>
              <span className="text-slate-400">Anti-Deepfake:</span>{" "}
              <strong className="text-white">
                {(verificationResult.antiDeepfakeScore * 100).toFixed(1)}%
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
