"use client";

import { useRouter } from "next/navigation";
import OrbitDeliveryHero from "@/components/ui/orbit-delivery-hero";

export default function DemoPage() {
  const router = useRouter();

  return (
    <main className="w-full min-h-screen bg-[#070c18]">
      <OrbitDeliveryHero
        theme="dark"
        onMeetCourier={() => router.push("/dashboard")}
        onExplore={() => router.push("/dashboard#simulator")}
      />
    </main>
  );
}
