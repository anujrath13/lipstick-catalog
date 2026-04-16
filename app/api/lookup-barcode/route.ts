import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type UpcItemDbItem = {
  title?: string;
  brand?: string;
  category?: string;
  description?: string;
};

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function inferType(text: string) {
  const t = text.toLowerCase();

  if (t.includes("liquid")) return "Liquid";
  if (t.includes("gloss")) return "Gloss";
  if (t.includes("tint")) return "Tint";
  if (t.includes("balm")) return "Balm";
  if (t.includes("lipstick")) return "Bullet";

  return "";
}

function inferFinish(text: string) {
  const t = text.toLowerCase();

  if (t.includes("creamy matte")) return "Creamy Matte";
  if (t.includes("soft matte")) return "Soft Matte";
  if (t.includes("matte")) return "Matte";
  if (t.includes("satin")) return "Satin";
  if (t.includes("gloss")) return "Glossy";
  if (t.includes("sheer")) return "Sheer";
  if (t.includes("tint")) return "Tint";

  return "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const barcode = String(body?.barcode ?? "").trim();

    if (!barcode) {
      return NextResponse.json(
        { error: "Missing barcode." },
        { status: 400 }
      );
    }

    // 1. Check Supabase first
    const { data: existing, error: existingError } = await supabase
      .from("lipsticks")
      .select("*")
      .eq("barcode", barcode)
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error("Supabase barcode lookup error:", existingError);
    }

    if (existing) {
      return NextResponse.json({
        result: {
          barcode,
          brand: existing.brand || "",
          shade: existing.shade || "",
          type: existing.type || "",
          finish: existing.finish || "",
          undertone: existing.undertone || "",
          colorFamily: existing.color_family || "",
          status: existing.status || "Owned",
          occasion: existing.occasion || "",
          notes: existing.notes || `Barcode: ${barcode}`,
        },
      });
    }

    // 2. Fallback to UPCitemdb
    const url = `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(
      barcode
    )}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const raw = await response.text();
      console.error("UPCitemdb lookup failed:", raw);

      return NextResponse.json({
        result: {
          barcode,
          brand: "",
          shade: "",
          type: "",
          finish: "",
          undertone: "",
          colorFamily: "",
          status: "Owned",
          occasion: "",
          notes: `Barcode: ${barcode}`,
        },
      });
    }

    const data = await response.json();
    const item: UpcItemDbItem | undefined = data?.items?.[0];

    if (!item) {
      return NextResponse.json({
        result: {
          barcode,
          brand: "",
          shade: "",
          type: "",
          finish: "",
          undertone: "",
          colorFamily: "",
          status: "Owned",
          occasion: "",
          notes: `Barcode: ${barcode}`,
        },
      });
    }

    const title = normalizeString(item.title);
    const brand = normalizeString(item.brand);
    const category = normalizeString(item.category);
    const description = normalizeString(item.description);

    const combinedText = [title, category, description]
      .filter(Boolean)
      .join(" ");

    let shade = "";
    if (brand && title.toLowerCase().startsWith(brand.toLowerCase())) {
      shade = title.slice(brand.length).trim();
    } else {
      shade = title;
    }

    return NextResponse.json({
      result: {
        barcode,
        brand,
        shade,
        type: inferType(combinedText),
        finish: inferFinish(combinedText),
        undertone: "",
        colorFamily: "",
        status: "Owned",
        occasion: "",
        notes: `Barcode: ${barcode}${description ? ` | ${description}` : ""}`,
      },
    });
  } catch (error) {
    console.error("lookup-barcode error:", error);

    return NextResponse.json(
      { error: "Failed to process barcode." },
      { status: 500 }
    );
  }
}