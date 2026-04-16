import { NextResponse } from "next/server";

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

    // Placeholder lookup result.
    // You can later connect this to a real UPC/product database.
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
  } catch (error) {
    console.error("lookup-barcode error:", error);
    return NextResponse.json(
      { error: "Failed to process barcode." },
      { status: 500 }
    );
  }
}