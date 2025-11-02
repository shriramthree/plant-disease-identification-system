import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const model = 'gemini-2.5-flash';

export async function identifyDisease(
  imageBase64: string,
  mimeType: string
): Promise<string> {
  const prompt = `You are an intelligent agricultural diagnostic assistant.
Your task is to generate a detailed and professional Plant Disease Diagnostic Report based on the uploaded leaf image.

Analyze the image and generate a markdown-formatted report with the following structure:

**1. Diagnostic Summary**
   - **Plant Type:** <Identify the plant from the image, e.g., "Tomato Plant", "Rose Bush", "Apple Tree".>
   - **Detected Disease:** <Identify the disease name from the image, e.g., "Late Blight". If healthy, state "Healthy". If unsure, state "Indeterminate".>
   - **Confidence Score:** <Provide a confidence percentage, e.g., "95.21%">
   - **Description:** <A short (2-4 line) professional description of the disease, including its cause (fungus, bacteria, virus), the affected plant parts, and how it spreads.>

**2. Symptoms Observed**
   - <Provide a bulleted list of specific symptoms visible in the image that led to the diagnosis.>
   - <If healthy, state that no symptoms of disease were observed.>

**3. Recommended Treatments & Management**
   - <Provide a bulleted list of cultural, biological, and organic control methods first.>
   - **Chemical Control Details:** If chemical intervention is recommended, provide a comprehensive guide:
     - **Suggested Pesticides:** <List specific active ingredients (e.g., "Copper fungicide", "Mancozeb") and, if appropriate, example commercial names.>
     - **Application Procedure:** <Provide clear, step-by-step instructions for mixing and applying the pesticide.>
     - **Timing and Frequency:** <Detail the optimal time of day for application and the required frequency (e.g., "Apply every 7-14 days during wet weather").>
     - **Regulations and Safety Precautions:** <Include a critical disclaimer to always read and follow the product label. Mention the need for personal protective equipment (PPE) and advise checking local regulations regarding pesticide use.>
     - **Where to Buy:** <Suggest common online platforms like Amazon, Flipkart, or agricultural suppliers. Provide a sample, non-affiliate Google Shopping search link for the primary active ingredient in Markdown format. Example: "You can find products containing Copper fungicide on platforms like Amazon, Flipkart, or at local garden centers. Search online: [Google Shopping for Copper Fungicide](https://www.google.com/search?tbm=shop&q=copper+fungicide)">
   - <If healthy, provide general plant care tips instead of treatment details.>

**4. Model Evaluation Summary**
   - <A brief, one-paragraph statement about the analysis. Mention that this is an AI-generated result and should be used for informational purposes. Advise consulting a professional for critical decisions and that pesticide regulations vary by location.>

---

Generate ONLY the markdown report based on this template. Do not include any other text or explanations before or after the report.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType,
            },
          },
          { text: prompt },
        ],
      },
    });

    return response.text;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to analyze image: ${error.message}`);
    }
    throw new Error("An unknown error occurred while analyzing the image.");
  }
}