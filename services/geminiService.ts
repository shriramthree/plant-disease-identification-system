

import { GoogleGenAI } from "@google/genai";

function getAiInstance() {
  const API_KEY = process.env.API_KEY;
  if (!API_KEY) {
    throw new Error("API key is not configured for this application.");
  }
  return new GoogleGenAI({ apiKey: API_KEY });
}

const textModel = 'gemini-2.5-flash';
const imageModel = 'imagen-4.0-generate-001';

export async function identifyDisease(
  imageBase64: string,
  mimeType: string
): Promise<string> {
  const prompt = `You are an intelligent agricultural diagnostic assistant.
Your task is to generate a detailed and professional Plant Disease Diagnostic Report based on the uploaded leaf image. Write the report in simple, clear, and easy-to-understand English, as if you are explaining it to a beginner gardener. Avoid technical jargon.

Analyze the image and generate a markdown-formatted report with the following structure:

**1. Diagnostic Summary**
   - **Plant Type:** <Identify the plant from the image, e.g., "Tomato Plant", "Rose Bush", "Apple Tree".>
   - **Detected Disease:** <Identify the disease name from the image, e.g., "Late Blight". If healthy, state "Healthy". If unsure, state "Indeterminate".>
   - **Confidence Score:** <Provide a confidence percentage, e.g., "95.21%">
   - **Description:** <A short (2-4 line) professional description of the disease, including its cause (fungus, bacteria, virus), the affected plant parts, and how it spreads.>

**2. Symptoms Observed**
   - <Provide a bulleted list of specific symptoms visible in the image that led to the diagnosis.>
   - <If healthy, state that no symptoms of disease were observed.>

---

Generate ONLY the markdown report based on this template. Do not include sections for "Recommended Treatments", "Environmental Impact", or "API Usage".`;

  try {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
      model: textModel,
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

export async function generateWeatherBasedRecommendations(
  plantType: string,
  diseaseName: string,
  location: string
): Promise<string> {
  if (!plantType || !diseaseName || !location) {
    throw new Error("Plant type, disease name, and location must be provided.");
  }
  const prompt = `You are an expert agricultural meteorologist and plant pathologist.
A plant has been diagnosed, and now you need to provide location-specific treatment advice based on the weather.

**Diagnosis Details:**
- **Plant Type:** ${plantType}
- **Detected Disease:** ${diseaseName}
- **Location for Weather Forecast:** ${location} (This may be provided as City/Region or as Latitude,Longitude coordinates.)

**Task:**
Generate a markdown-formatted report continuing from a previous analysis. Start with section 3. Base your recommendations STRICTLY on the projected 30-day weather for the given location. Be scientific, straightforward, and brutally honest. **Use simple English and provide clear, step-by-step instructions that a non-expert can easily follow.** Avoid complex scientific terms wherever possible. Do not give generic advice.

**Required Output Format:**

**3. Recommended Treatments & Management (for your location)**

- **Weather-Based Risk Assessment:** <Briefly state the risk level (e.g., Low, Medium, High) for the next 30 days based on the weather forecast for the location and explain WHY in simple terms. e.g., "High risk due to predicted frequent rainfall and high humidity, which helps fungus grow.">
- **Cultural & Organic Control:** <Provide a bulleted list of cultural, biological, and organic control methods. Explain how they relate to the upcoming weather. e.g., "Trim lower leaves to improve air flow before the predicted humid nights.">
- **Fertilization & Soil Health:** <Provide advice on soil and fertilizer management to help the plant recover. Suggest specific nutrient adjustments if applicable for the disease. Provide a sample, non-affiliate YouTube search link for visual guides. Example: [YouTube: How to properly fertilize ${plantType}](https://www.youtube.com/results?search_query=how+to+properly+fertilize+${plantType})>
- **Weather-Based Spray Plan:** If chemical intervention is warranted by the forecast, provide a comprehensive guide:
  - **Active Ingredients:** <List specific active ingredients (e.g., "Copper fungicide", "Mancozeb") suitable for the conditions.>
  - **Application Timing:** <Crucially, link this to the weather forecast. e.g., "Apply preventatively 24-48 hours before the forecasted rain on [mention expected dates]. Re-apply every 7-10 days if humid conditions persist.">
  - **Safety Precautions:** <Include a critical disclaimer to always read and follow the product label and use PPE.>
  - **Where to Buy:** <Suggest common online platforms or suppliers and provide a sample, non-affiliate Google Shopping search link in Markdown format. Example: [Google Shopping for Copper Fungicide](https://www.google.com/search?tbm=shop&q=copper+fungicide)>

**4. Environmental Impact Estimate**
   - **Estimated CO2e:** <Provide a very rough estimate in grams of CO2 equivalent for the entire analysis (image upload and this recommendation step). e.g., "Less than 0.2g CO2e".>
   - **Note:** <Include a brief note that this AI model runs on Google's data centers, which are committed to carbon neutrality, significantly minimizing the environmental impact.>

**5. API Usage Estimate**
   - **Estimated Total Input Tokens:** <Provide a rough estimate of the total tokens for both analysis steps. e.g. "Around 3000 tokens".>
   - **Estimated Total Output Tokens:** <Provide a rough estimate of the total tokens in the full generated report (all sections). e.g. "Around 800 tokens".>

---
Generate ONLY these markdown sections, starting with the "**3. Recommended Treatments & Management**" heading.`;

  try {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
      model: textModel,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API for recommendations:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate recommendations: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating recommendations.");
  }
}

export async function generateGenericRecommendations(
  plantType: string,
  diseaseName: string
): Promise<string> {
  if (!plantType || !diseaseName) {
    throw new Error("Plant type and disease name must be provided.");
  }
  const prompt = `You are an expert plant pathologist.
A plant has been diagnosed, and now you need to provide general, non-location-specific treatment advice.

**Diagnosis Details:**
- **Plant Type:** ${plantType}
- **Detected Disease:** ${diseaseName}

**Task:**
Generate a markdown-formatted report continuing from a previous analysis. Start with section 3. Provide general best practices for managing this disease. Do not base your advice on weather or a specific location. Be scientific, straightforward, and brutally honest. **Use simple English and provide clear, step-by-step instructions that a non-expert can easily follow.** Avoid complex scientific terms wherever possible.

**Required Output Format:**

**3. Recommended Treatments & Management (General Advice)**

- **Risk Assessment:** <Briefly state the general conditions under which this disease thrives (e.g., "This fungal disease loves damp, warm weather with not much wind.").>
- **Cultural & Organic Control:** <Provide a bulleted list of common cultural, biological, and organic control methods. e.g., "Give plants enough space so air can move between them.", "Remove and throw away any infected leaves or branches to stop the disease from spreading.">
- **Fertilization & Soil Health:** <Provide general advice on soil and fertilizer management to help the plant recover from ${diseaseName}. Suggest specific nutrient adjustments if applicable for the disease. Provide a sample, non-affiliate YouTube search link for visual guides. Example: [YouTube: How to fertilize ${plantType} with ${diseaseName}](https://www.youtube.com/results?search_query=how+to+fertilize+${plantType}+with+${diseaseName})>
- **Chemical Control Guide:** If chemical intervention is commonly used for this disease, provide a general guide:
  - **Active Ingredients:** <List specific active ingredients (e.g., "Copper fungicide", "Mancozeb") suitable for this disease.>
  - **Application Timing:** <Provide general advice on application. e.g., "Spray before the disease appears, especially if the weather is right for it.", "Follow the instructions on the product for how often to spray.">
  - **Safety Precautions:** <Include a critical disclaimer to always read and follow the product label and use PPE.>
  - **Where to Buy:** <Suggest common online platforms or suppliers and provide a sample, non-affiliate Google Shopping search link in Markdown format. Example: [Google Shopping for Copper Fungicide](https://www.google.com/search?tbm=shop&q=copper+fungicide)>

**4. Environmental Impact Estimate**
   - **Estimated CO2e:** <Provide a very rough estimate in grams of CO2 equivalent for the entire analysis (image upload and this recommendation step). e.g., "Less than 0.2g CO2e".>
   - **Note:** <Include a brief note that this AI model runs on Google's data centers, which are committed to carbon neutrality, significantly minimizing the environmental impact.>

**5. API Usage Estimate**
   - **Estimated Total Input Tokens:** <Provide a rough estimate of the total tokens for both analysis steps. e.g. "Around 3000 tokens".>
   - **Estimated Total Output Tokens:** <Provide a rough estimate of the total tokens in the full generated report (all sections). e.g. "Around 800 tokens".>
---
Generate ONLY these markdown sections, starting with the "**3. Recommended Treatments & Management**" heading.`;

  try {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
      model: textModel,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API for generic recommendations:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate generic recommendations: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating generic recommendations.");
  }
}

export async function getDiseaseInfo(diseaseName: string): Promise<string> {
  if (!diseaseName) {
    throw new Error("Disease name must be provided.");
  }
  const prompt = `You are a plant pathologist and agricultural expert.
Provide a detailed, easy-to-understand information sheet for the following plant disease.

**Disease Name:** ${diseaseName}

**Task:**
Generate a markdown-formatted report with the following sections. Use clear headings, bullet points, and concise language. **Write in simple English, assuming the reader has no background in botany or agriculture.**

**Required Output Format:**

### Overview of ${diseaseName}
<A brief, 2-3 sentence summary of what the disease is, what causes it (e.g., fungus, bacterium), and the types of plants it typically affects.>

### Common Causes & Conditions
<A bulleted list of environmental factors and plant conditions that help this disease grow and spread. Examples: high humidity, poor air circulation, specific temperature ranges, nutrient deficiencies, etc.>

### Key Symptoms to Identify
<A detailed, bulleted list of visual symptoms. Describe how they appear on leaves, stems, fruits, or roots. Be specific. e.g., "Small, wet-looking spots on lower leaves that get bigger and turn into brown spots with a yellow ring around them.">

### General Prevention & Management Strategies
- **Cultural Practices:** <Bulleted list of non-chemical methods like changing where you plant crops each year, cleaning up infected plant parts, giving plants enough space, and choosing disease-resistant types.>
- **Organic Control:** <Bulleted list of organic-approved treatments, such as neem oil, copper fungicides, or biological controls.>

---
Generate ONLY the markdown content based on this template.
`;

  try {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
      model: textModel,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error(`Error fetching info for ${diseaseName}:`, error);
    if (error instanceof Error) {
      throw new Error(`Failed to get disease information: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching disease information.");
  }
}

export async function generateImageFromPrompt(prompt: string): Promise<string> {
  try {
    const ai = getAiInstance();
    const response = await ai.models.generateImages({
      model: imageModel,
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '1:1',
      },
    });

    const generatedImage = response.generatedImages?.[0];
    if (!generatedImage?.image?.imageBytes) {
      throw new Error("No image was generated. The response may have been blocked or empty.");
    }

    const base64ImageBytes: string = generatedImage.image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;

  } catch (error) {
    console.error("Error calling Gemini API for image generation:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate image: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the image.");
  }
}

// FIX: Add missing 'generateDiseaseForecast' function to be used by the ForecastGenerator component.
export async function generateDiseaseForecast(
  locationString: string,
  cropStage: string,
  selectedCrops: string[]
): Promise<string> {
  if (!locationString || selectedCrops.length === 0) {
    throw new Error("Location and at least one crop must be provided.");
  }

  const prompt = `You are a world-class agricultural forecasting AI, specializing in plant disease prediction based on meteorological data.

**Forecasting Parameters:**
- **Location:** ${locationString} (Latitude, Longitude)
- **Crops of Interest:** ${selectedCrops.join(", ")}
- **Current Crop Stage:** ${cropStage}

**Task:**
Generate a detailed and proactive **30-Day Disease Risk Forecast** in markdown format. Your analysis must be strictly based on the projected weather for the given location. Use clear, simple language that a farmer or gardener can act upon. Structure the report as follows:

**1. 30-Day Weather Outlook & Risk Summary**
   - **Overall Risk Level:** <High, Medium, or Low>
   - **Key Weather Factors:** <Summarize the next 30 days' weather patterns that influence disease risk. e.g., "Expect 15 days of rain with high humidity above 80% and average temperatures of 25°C, creating ideal conditions for fungal pathogens.">
   - **Critical Risk Periods:** <Identify specific weeks or date ranges with the highest risk. e.g., "The second and third weeks are critical due to forecasted back-to-back rainy days.">

**2. Crop-Specific Disease Forecast**
   - <For each crop in **Crops of Interest**, create a subsection.>
   - **<Crop Name> (e.g., Tomato):**
     - **High-Risk Diseases:** <List 1-3 diseases with the highest risk for this crop based on the forecast. e.g., "Late Blight (Phytophthora infestans)">
     - **Medium-Risk Diseases:** <List diseases with moderate risk.>
     - **Low-Risk Diseases:** <List diseases with low risk.>

**3. Proactive Management Plan**
   - <For EACH **High-Risk Disease** identified above, provide a concise action plan.>
   - **Disease: <Disease Name> on <Crop Name>**
     - **Symptoms to Watch For:** <Bulleted list of early signs. e.g., "Small, water-soaked spots on leaves that turn brown.">
     - **Preventative Actions:** <Bulleted list of specific, weather-tied actions. e.g., "Ensure good air circulation by pruning lower leaves before the heavy rains predicted for week 2.", "Apply a preventative copper-based fungicide 48 hours before the rain starts around [date].">

**4. General Recommendations**
   - **Irrigation:** <Advice on watering based on rain forecast. e.g., "Avoid overhead watering during humid periods. Water at the base of plants in the morning.">
   - **Scouting:** <Recommend frequency of checking plants for symptoms during high-risk periods.>

---
Generate ONLY the markdown report. Do not add any introductory or concluding text outside of this structure.`;

  try {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
      model: textModel,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API for disease forecast:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate disease forecast: ${error.message}`);
    }
    throw new Error(
      "An unknown error occurred while generating the disease forecast."
    );
  }
}

// FIX: Add missing 'getChatResponse' function to be used by the ChatComponent component.
export async function getChatResponse(prompt: string): Promise<{
  answer: string;
  inputTokens: number;
  outputTokens: number;
  time: number;
}> {
  if (!prompt) {
    throw new Error("Prompt must be provided.");
  }
  
  const ai = getAiInstance();
  const startTime = performance.now();
  
  try {
    const response = await ai.models.generateContent({
      model: textModel,
      contents: prompt,
    });
    
    const endTime = performance.now();
    
    const answer = response.text;
    const inputTokens = response.usageMetadata?.promptTokenCount ?? 0;
    const outputTokens = response.usageMetadata?.candidatesTokenCount ?? 0;
    const time = (endTime - startTime) / 1000; // in seconds
    
    return { answer, inputTokens, outputTokens, time };
  } catch (error) {
    console.error("Error calling Gemini API for chat:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to get chat response: ${error.message}`);
    }
    throw new Error("An unknown error occurred while getting chat response.");
  }
}