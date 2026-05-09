import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { question, userId } = await req.json();

    // Fetch user's lipsticks
    const { data: lipsticks, error } = await supabase
      .from("lipsticks")
      .select("*")
      // TEMP: remove user filter

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    const context =
      lipsticks
        ?.map(
          (l) =>
            `${l.brand} - ${l.shade}, ${l.finish}, ${l.undertone}, ${l.color_family}, ${l.price_tier}`
        )
        .join("\n") || "No lipsticks found.";

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `
You are a helpful lipstick collection assistant.

Only use the data below:

${context}

User question:
${question}

If the answer is not in the data, say "I don't know based on your collection."
Keep answers short and helpful.
`,
    });

    return NextResponse.json({
      answer: response.output_text,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "AI failed" }, { status: 500 });
  }
}