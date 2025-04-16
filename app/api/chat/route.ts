import { HfInference } from "@huggingface/inference";
import { NextRequest } from "next/server";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY!);

export async function POST(req: NextRequest) {
  if (!process.env.HUGGINGFACE_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Hugging Face API key is missing." }),
      { status: 400 }
    );
  }

  const { messages } = await req.json();

  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: "Invalid messages format." }), {
      status: 400,
    });
  }

  // Build a cleaner prompt with clear user/assistant roles
  let prompt = "";
  for (const m of messages) {
    if (m.role === "user") {
      prompt += `User: ${m.content}\n`;
    } else if (m.role === "assistant") {
      prompt += `Assistant: ${m.content}\n`;
    }
  }

  // Ensure it ends with Assistant: to prompt a reply
  prompt += "Assistant:";

  console.log("Generated Prompt:", prompt);

  try {
    const response = await hf.textGeneration({
      model: "mistralai/Mistral-7B-Instruct-v0.1",
      inputs: prompt,
      parameters: {
        max_new_tokens: 1000, // avoid 10000; it’s too large
        temperature: 0.7,
        return_full_text: false,
      },
    });

    console.log("Hugging Face Response:", response);

    if (!response || !response.generated_text) {
      return new Response(
        JSON.stringify({ error: "Invalid response from Hugging Face." }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        output: response.generated_text.trim(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Hugging Face Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate response." }),
      { status: 500 }
    );
  }
}
