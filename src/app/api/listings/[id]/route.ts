import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured, SAMPLE_LISTINGS } from "@/lib/supabase";
import { memoryStore } from "@/lib/memory-store";

// GET /api/listings/[id] - Get a specific listing by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        // Also check sample listings if a static demo ID was visited directly
        const sampleMatch = SAMPLE_LISTINGS.find((item) => item.id === id);
        if (sampleMatch) {
          return NextResponse.json({ listing: sampleMatch });
        }

        return NextResponse.json(
          { error: "Listing not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ listing: data });
    }

    // Fallback store lookup
    const listing = memoryStore.getListingById(id);
    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ listing });
  } catch (err) {
    console.error("Unexpected error in GET /api/listings/[id]:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
