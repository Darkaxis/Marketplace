import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

// POST /api/upload - Upload listing image to Supabase Storage ('listing-images' bucket)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file format. Please upload a JPG, PNG, WebP, or GIF image.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit." },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured()) {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 10)}.${fileExt}`;
      const filePath = `listings/${fileName}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase storage upload error:", uploadError);
        return NextResponse.json(
          {
            error: "Failed to upload image to storage",
            details: uploadError.message,
          },
          { status: 500 }
        );
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("listing-images").getPublicUrl(filePath);

      return NextResponse.json({ url: publicUrl }, { status: 201 });
    }

    // Fallback when Supabase is not configured yet: convert to base64 data URL so preview & local testing work seamlessly
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({ url: dataUrl, fallback: true }, { status: 201 });
  } catch (err) {
    console.error("Unexpected error in POST /api/upload:", err);
    return NextResponse.json(
      { error: "Failed to process image upload" },
      { status: 500 }
    );
  }
}
