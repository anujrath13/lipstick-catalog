import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const imageDataUrl = body?.imageDataUrl;

    if (!imageDataUrl || typeof imageDataUrl !== "string") {
      return NextResponse.json(
        { error: "Missing imageDataUrl." },
        { status: 400 }
      );
    }

    const response = await openai.responses.create({
      model: "gpt-5.4",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You extract lipstick product details from a photo. " +
                "Return only valid JSON with these exact keys: " +
                "brand, shade, type, finish, undertone, colorFamily, status, occasion, notes. " +
                "If unsure, use an empty string. " +
                "Allowed values when possible: " +
                'type: "Bullet", "Liquid", "Tint", "Gloss", "Balm" or "" ; ' +
                'finish: "Matte", "Creamy Matte", "Soft Matte", "Satin", "Glossy", "Sheer", "Tint" or "" ; ' +
                'undertone: "Warm", "Cool", "Neutral" or "" ; ' +
                'colorFamily: "Red", "Pink", "Berry", "Brown", "Nude", "Coral", "Mauve" or "" ; ' +
                'status: "Owned" unless the image clearly suggests otherwise, else "" ; ' +
                'occasion: "Daily", "Office", "Evening", "Party", "Anytime" or "".'
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Look at this lipstick photo and identify the brand and shade if visible. " +
                "Then infer likely lipstick attributes conservatively. " +
                "Return JSON only.",
            },
            {
              type: "input_image",
              image_url: imageDataUrl,
              detail: "high",
            },
          ],
        },
      ],
    });

    const text = response.output_text?.trim();

    if (!text) {
      return NextResponse.json(
        { error: "No response from scan model." },
        { status: 500 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Could not parse scan result.", raw: text },
        { status: 500 }
      );
    }

    return NextResponse.json({ result: parsed });
  } catch (error) {
    console.error("scan-lipstick error:", error);
    return NextResponse.json(
      { error: "Failed to scan lipstick image." },
      { status: 500 }
    );
  }
}