import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import sharp from "sharp";

// Force Node.js runtime for Sharp compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TARGET_HEIGHT = 80; // Logo height for header
const MAX_WIDTH = 400; // Maximum width to prevent excessively wide logos

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication and admin role
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Validate file size (2MB limit - logos should be smaller)
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "File too large",
          message: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds 2MB limit. Please use a smaller image.`,
          maxSize: "2MB"
        },
        { status: 413 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get image metadata to calculate proportional width
    const metadata = await sharp(buffer).metadata();
    const aspectRatio = metadata.width && metadata.height ? metadata.width / metadata.height : 1;
    const targetWidth = Math.min(Math.round(TARGET_HEIGHT * aspectRatio), MAX_WIDTH);

    // Process image: resize maintaining aspect ratio, convert to PNG with transparency support
    const processedImage = await sharp(buffer)
      .resize(targetWidth, TARGET_HEIGHT, {
        fit: "contain", // Maintain aspect ratio, fit within dimensions
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
      })
      .png({ quality: 90, compressionLevel: 9 }) // PNG for transparency support
      .toBuffer();

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const filename = `logo-${timestamp}-${randomString}.png`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(filename, processedImage, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image", details: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("logos").getPublicUrl(filename);

    return NextResponse.json({
      success: true,
      path: filename,
      url: publicUrl,
      dimensions: {
        width: targetWidth,
        height: TARGET_HEIGHT,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to process image",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
