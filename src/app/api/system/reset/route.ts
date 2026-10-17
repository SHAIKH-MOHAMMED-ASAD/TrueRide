import { NextResponse } from "next/server";
import { resetAndSeedDatabase } from "@/lib/services/seed";

export async function POST() {
  try {
    const result = await resetAndSeedDatabase();
    return NextResponse.json({ success: true, message: "Demo database reset and seeded successfully.", result });
  } catch (error: any) {
    console.error("System Reset API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
