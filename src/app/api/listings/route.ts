import { NextRequest, NextResponse } from "next/server";
import {
  supabase,
  isSupabaseConfigured,
  SAMPLE_LISTINGS,
  type Listing,
} from "@/lib/supabase";
import { memoryStore } from "@/lib/memory-store";

// GET /api/listings - Browse listings with optional search and category filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category")?.trim().toLowerCase();
    const search = (
      searchParams.get("search") ||
      searchParams.get("q") ||
      ""
    )
      .trim()
      .toLowerCase();

    if (isSupabaseConfigured()) {
      let query = supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false });

      if (category && category !== "all") {
        query = query.ilike("category", category);
      }

      if (search) {
        query = query.or(
          `title.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error("Supabase listings fetch error:", error);
        return NextResponse.json(
          { error: "Failed to fetch listings", details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        listings: data || [],
        source: "supabase",
      });
    }

    // Fallback when Supabase credentials are not configured yet
    let listings = memoryStore.getListings();

    if (category && category !== "all") {
      listings = listings.filter(
        (item) => item.category.toLowerCase() === category
      );
    }

    if (search) {
      listings = listings.filter(
        (item) =>
          item.title.toLowerCase().includes(search) ||
          (item.description &&
            item.description.toLowerCase().includes(search)) ||
          item.location.toLowerCase().includes(search) ||
          item.category.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      listings,
      source: "fallback",
    });
  } catch (err) {
    console.error("Unexpected error in GET /api/listings:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/listings - Create a new listing (or seed demo listings)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Optional seed action to populate sample listings into Supabase
    if (body?.action === "seed") {
      if (isSupabaseConfigured()) {
        const seedRows = SAMPLE_LISTINGS.map(
          ({ title, description, price, category, seller_email, image_url, location }) => ({
            title,
            description,
            price,
            category,
            seller_email,
            image_url,
            location,
          })
        );
        const { data, error } = await supabase
          .from("listings")
          .insert(seedRows)
          .select();

        if (error) {
          return NextResponse.json(
            { error: "Failed to seed listings", details: error.message },
            { status: 500 }
          );
        }

        return NextResponse.json(
          { listings: data, message: "Sample listings seeded successfully" },
          { status: 201 }
        );
      }

      return NextResponse.json(
        {
          listings: memoryStore.getListings(),
          message: "Sample listings loaded",
        },
        { status: 200 }
      );
    }

    const {
      title,
      description,
      price,
      category,
      seller_email,
      image_url,
      location,
    } = body;

    // Input validation
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const numericPrice = Number(price);
    if (price === undefined || price === null || isNaN(numericPrice) || numericPrice < 0) {
      return NextResponse.json(
        { error: "A valid non-negative price is required" },
        { status: 400 }
      );
    }

    if (!category || typeof category !== "string" || !category.trim()) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      !seller_email ||
      typeof seller_email !== "string" ||
      !emailRegex.test(seller_email.trim())
    ) {
      return NextResponse.json(
        { error: "A valid seller email address is required" },
        { status: 400 }
      );
    }

    const cleanListingData = {
      title: title.trim(),
      description: description ? String(description).trim() : null,
      price: numericPrice,
      category: category.trim().toLowerCase(),
      seller_email: seller_email.trim(),
      image_url: image_url ? String(image_url).trim() : null,
      location:
        location && String(location).trim()
          ? String(location).trim()
          : "Palo Alto, CA",
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("listings")
        .insert([cleanListingData])
        .select()
        .single();

      if (error) {
        console.error("Supabase create listing error:", error);
        return NextResponse.json(
          { error: "Failed to create listing", details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ listing: data }, { status: 201 });
    }

    // Fallback when Supabase is not configured yet
    const newListing: Listing = {
      id: crypto.randomUUID(),
      ...cleanListingData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    memoryStore.addListing(newListing);
    return NextResponse.json({ listing: newListing }, { status: 201 });
  } catch (err) {
    console.error("Unexpected error in POST /api/listings:", err);
    return NextResponse.json(
      { error: "Invalid request payload" },
      { status: 400 }
    );
  }
}
