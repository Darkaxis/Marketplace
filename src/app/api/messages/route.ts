import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured, type Message } from "@/lib/supabase";
import { memoryStore } from "@/lib/memory-store";
import { sendSellerNotificationEmail } from "@/lib/email";

// GET /api/messages - Get messages for a listing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId =
      searchParams.get("listing_id") || searchParams.get("listingId");

    if (!listingId) {
      return NextResponse.json(
        { error: "listing_id query parameter is required" },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("listing_id", listingId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Supabase messages fetch error:", error);
        return NextResponse.json(
          { error: "Failed to fetch messages", details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ messages: data || [] });
    }

    const messages = memoryStore.getMessagesByListing(listingId);
    return NextResponse.json({ messages });
  } catch (err) {
    console.error("Unexpected error in GET /api/messages:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/messages - Send a message to a seller
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listing_id, buyer_email, seller_email, message } = body;

    if (!listing_id || typeof listing_id !== "string") {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      !buyer_email ||
      typeof buyer_email !== "string" ||
      !emailRegex.test(buyer_email.trim())
    ) {
      return NextResponse.json(
        { error: "A valid buyer email address is required" },
        { status: 400 }
      );
    }

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

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message content cannot be empty" },
        { status: 400 }
      );
    }

    const cleanMessage = {
      listing_id: listing_id.trim(),
      buyer_email: buyer_email.trim(),
      seller_email: seller_email.trim(),
      message: message.trim(),
    };

    const origin = request.nextUrl.origin;
    const listingUrl = `${origin}/item/${encodeURIComponent(cleanMessage.listing_id)}`;

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("messages")
        .insert([cleanMessage])
        .select()
        .single();

      if (error) {
        console.error("Supabase send message error:", error);
        return NextResponse.json(
          { error: "Failed to send message", details: error.message },
          { status: 500 }
        );
      }

      // Fetch listing title & price for the seller notification email
      const { data: listing } = await supabase
        .from("listings")
        .select("title, price")
        .eq("id", cleanMessage.listing_id)
        .single();

      const emailResult = await sendSellerNotificationEmail({
        sellerEmail: cleanMessage.seller_email,
        buyerEmail: cleanMessage.buyer_email,
        message: cleanMessage.message,
        listingId: cleanMessage.listing_id,
        listingTitle: listing?.title,
        listingPrice: listing?.price,
        listingUrl,
      });

      return NextResponse.json(
        {
          message: data,
          emailSent: emailResult.sent,
          emailProvider: emailResult.provider,
        },
        { status: 201 }
      );
    }

    const newMessage: Message = {
      id: crypto.randomUUID(),
      ...cleanMessage,
      created_at: new Date().toISOString(),
    };

    memoryStore.addMessage(newMessage);

    const fallbackListing = memoryStore.getListingById(cleanMessage.listing_id);
    const emailResult = await sendSellerNotificationEmail({
      sellerEmail: cleanMessage.seller_email,
      buyerEmail: cleanMessage.buyer_email,
      message: cleanMessage.message,
      listingId: cleanMessage.listing_id,
      listingTitle: fallbackListing?.title,
      listingPrice: fallbackListing?.price,
      listingUrl,
    });

    return NextResponse.json(
      {
        message: newMessage,
        emailSent: emailResult.sent,
        emailProvider: emailResult.provider,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Unexpected error in POST /api/messages:", err);
    return NextResponse.json(
      { error: "Invalid request payload" },
      { status: 400 }
    );
  }
}
