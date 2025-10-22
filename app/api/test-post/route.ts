import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "POST works!" }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ message: "GET works!" }, { status: 200 });
}
