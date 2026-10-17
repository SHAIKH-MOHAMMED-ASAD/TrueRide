"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OrbitDeliveryHero from "@/components/ui/orbit-delivery-hero";

export default function HomePage() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // If user navigates to root with a dashboard hash (e.g. #verification, #simulator), redirect to /dashboard
  useEffect(() => {
    setIsTransitioning(false);
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.replace("#", "");
      if (
        [
          "dashboard",
          "radar",
          "simulator",
          "cases",
          "sessions",
          "riders",
          "verification",
          "evaluation",
          "audit",
        ].includes(hash)
      ) {
        router.replace(`/dashboard#${hash}`);
      }
    }
  }, [router]);

  const handleMeetCourier = () => {
    // Check user's motion preference
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      router.push("/dashboard");
      return;
    }

    setIsTransitioning(true);
    // Subtle, fast cinematic transition into dashboard
    setTimeout(() => {
      router.push("/dashboard");
    }, 280);
  };

  const handleExplore = () => {
    router.push("/dashboard#simulator");
  };

  return (
    <div
      className={`relative w-full min-h-screen bg-[#070c18] overflow-hidden transition-all duration-300 ease-out ${
        isTransitioning
          ? "opacity-0 scale-[1.02] filter blur-sm pointer-events-none"
          : "opacity-100 scale-100"
      }`}
    >
      <OrbitDeliveryHero
        theme="dark"
        onMeetCourier={handleMeetCourier}
        onExplore={handleExplore}
      />
    </div>
  );
}
