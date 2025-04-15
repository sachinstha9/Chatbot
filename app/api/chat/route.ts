import { HfInference } from "@huggingface/inference";
import { NextRequest } from "next/server";
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY!);

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const prompt =
    messages
      .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
      .join("\n") + "\nassistant:";

  try {
    const response = await hf.textGeneration({
      model: "mistralai/Mistral-7B-Instruct-v0.1",
      inputs: prompt,
      parameters: {
        max_new_tokens: 100,
        temperature: 0.7,
        return_full_text: false,
      },
    });

    return new Response(
      JSON.stringify({
        output: response.generated_text,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("HuggingFace Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate response." }),
      { status: 500 }
    );
  }
}
