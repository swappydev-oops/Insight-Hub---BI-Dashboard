import { GoogleGenAI, Type } from "@google/genai";
import type { DataRow, ChartSuggestion } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This is a fallback for development. In a real environment, the key should be set.
  console.warn("Gemini API key not found. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const suggestionSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "A short, engaging title for the suggested chart.",
        },
        description: {
          type: Type.STRING,
          description: "A brief, one-sentence explanation of what this chart shows and what insight it might reveal.",
        },
        type: {
          type: Type.STRING,
          enum: ['Bar', 'Line', 'Pie', 'Donut', 'Area', 'Scatter'],
          description: 'The type of chart recommended.',
        },
        xAxis: {
          type: Type.STRING,
          description: 'The column name to be used for the X-axis (dimension).',
        },
        yAxis: {
          type: Type.STRING,
          description: 'The column name to be used for the Y-axis (measure).',
        },
        aggregation: {
          type: Type.STRING,
          enum: ['Sum', 'Count', 'Average'],
          description: 'The aggregation method to be used for the Y-axis.',
        },
      },
      required: ['title', 'description', 'type', 'xAxis', 'yAxis', 'aggregation'],
    },
};

export async function getAIInsights(columns: string[], sampleData: DataRow[]): Promise<ChartSuggestion[]> {
    if (!API_KEY) {
        return Promise.resolve([]);
    }
    
    const model = "gemini-2.5-flash";

    const sampleDataString = sampleData.map(row => JSON.stringify(row)).join('\n');
    
    const prompt = `
        You are a sophisticated data analysis expert. Your task is to analyze the provided dataset columns and sample data to uncover potentially interesting relationships and patterns. Based on this analysis, generate 3 insightful chart suggestions.

        Go beyond simple aggregations. Look for potential correlations between two numeric columns (ideal for Scatter plots), trends over time if a date/time column seems present (ideal for Line charts), or how a measure (like Sales or Profit) is distributed across different categories (ideal for Bar or Pie charts).

        Columns: ${columns.join(', ')}

        Sample Data (first 10 rows):
        ${sampleDataString}

        For each suggestion:
        1.  Provide a concise, engaging title.
        2.  The 'description' is crucial: Explain *why* the chart is interesting and what potential relationship or insight the user might uncover. For example, instead of "Shows sales by region," say "This chart helps visualize which regions are top performers and could reveal geographical sales patterns."
        3.  Provide the exact configuration (chart type, xAxis, yAxis, aggregation).
        4.  Ensure xAxis is typically categorical/dimensional and yAxis is numerical/measurable.
        5.  Return the result as a JSON array that conforms to the provided schema.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: suggestionSchema,
            },
        });

        const jsonString = response.text.trim();
        const suggestions = JSON.parse(jsonString) as ChartSuggestion[];
        return suggestions;

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        throw new Error('Failed to generate AI insights.');
    }
}