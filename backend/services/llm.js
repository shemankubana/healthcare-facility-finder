import fetch from "node-fetch";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "mistral";

export async function getRecommendation(analysis) {
  const prompt = `You are an expert health facility planner for Rwanda.

Given the following district analysis:
- District: ${analysis.district}
- Current average travel time: ${analysis.avgTravel} minutes
- Target travel time: ${analysis.target} minutes
- Current facilities: ${analysis.currentFacilities}
- Total population: ${analysis.population.toLocaleString()}
- Population served per facility: ${Math.round(analysis.population / analysis.currentFacilities)}

Generate a JSON response with exactly 3 recommended new facility locations. For each location, suggest:
1. Name (e.g., "District Clinic North" or "Health Center Rural Zone")
2. Latitude (between ${analysis.bounds.minLat} and ${analysis.bounds.maxLat})
3. Longitude (between ${analysis.bounds.minLon} and ${analysis.bounds.maxLon})
4. Type (health_center or clinic)
5. Justification (brief explanation: underserved area, high population density, reduces travel time, etc.)

Return ONLY valid JSON in this exact format:
{
  "recommendations": [
    {
      "name": "string",
      "lat": number,
      "lon": number,
      "type": "health_center" | "clinic",
      "justification": "string",
      "estimated_impact": "Reduces avg travel time by ~X minutes"
    }
  ],
  "summary": "string"
}`;

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();

    let jsonStr = data.response;

    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("LLM did not return valid JSON. Cannot generate recommendations.");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
  } catch (error) {
    console.error("LLM Error:", error);
    throw new Error(`Failed to generate recommendations: ${error.message}`);
  }
}
