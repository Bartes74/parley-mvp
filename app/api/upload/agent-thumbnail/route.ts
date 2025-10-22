import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import sharp from "sharp";

// Force Node.js runtime for Sharp compatibility (must be at top level)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TARGET_WIDTH = 800;
const TARGET_HEIGHT = 450; // 16:9 aspect ratio

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Validate file size (4MB limit for Vercel)
    const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "File too large",
          message: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds 4MB limit. Please use a smaller image.`,
          maxSize: "4MB"
        },
        { status: 413 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process image: resize and crop to 800x450 (16:9)
    const processedImage = await sharp(buffer)
      .resize(TARGET_WIDTH, TARGET_HEIGHT, {
        fit: "cover", // This will crop to exact dimensions
        position: "center", // Center the crop
      })
      .jpeg({ quality: 90 }) // Convert to JPEG with good quality
      .toBuffer();

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const filename = `${timestamp}-${randomString}.jpg`;
    const filepath = `${filename}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("agent-thumbnails")
      .upload(filepath, processedImage, {
        contentType: "image/jpeg",
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
    } = supabase.storage.from("agent-thumbnails").getPublicUrl(filepath);

    return NextResponse.json({
      success: true,
      path: filepath,
      url: publicUrl,
      dimensions: {
        width: TARGET_WIDTH,
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
