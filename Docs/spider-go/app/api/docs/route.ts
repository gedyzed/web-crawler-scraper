// Explicit AI config passed to createDocsAPI to avoid file-system parsing
// issues on serverless platforms like Vercel.

import { createDocsAPI } from "@farming-labs/theme/api";

export const { GET, POST } = createDocsAPI({
    entry: "d",
    ai: {
        enabled: true,
        baseUrl: "https://api.groq.com/openai/v1",
        apiKey: process.env.GROQ_API_KEY,
        model: "llama-3.3-70b-versatile",
    },
});

export const revalidate = false;
