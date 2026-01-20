import { GoogleGenAI } from "@google/genai";
import { SalesRecord } from "../types";
import { GEMINI_API_KEY } from "../constants";

export const generateSalesAnalysis = async (
    query: string, 
    contextData: SalesRecord[]
): Promise<string> => {
    if (!GEMINI_API_KEY) {
        return "⚠️ Error de Configuración: No se detectó la API Key de Google (NEXT_PUBLIC_GEMINI_API_KEY). Por favor configúrala en Vercel.";
    }

    try {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        
        // Summarize context to save tokens. We send top 50 records sorted by Volume if list is huge
        // or aggregated stats.
        const summary = contextData.length > 50 
            ? contextData
                .sort((a, b) => b.UC12mm - a.UC12mm)
                .slice(0, 50) 
            : contextData;

        const dataString = JSON.stringify(summary);

        const systemPrompt = `
        Eres un analista de ventas experto para la app SalesComander Pro.
        Responde basándote estrictamente en los datos adjuntos en formato JSON.
        Los datos representan clientes, volumen (UC 12mm), crecimiento (Var 2025 vs 2024), share y ticket promedio (TP).
        
        Si te preguntan por totales, calcula la suma de los datos proporcionados.
        Sé conciso, profesional y usa formato Markdown para resaltar números clave.
        
        DATOS DE CONTEXTO (Top clientes por volumen):
        ${dataString}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
                { role: 'user', parts: [{ text: systemPrompt + "\n\nPregunta del usuario: " + query }] }
            ],
             config: {
                thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster response on flash model
            }
        });

        return response.text || "No se pudo generar una respuesta.";
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Lo siento, hubo un error al consultar a la IA. Verifica tu conexión o intenta de nuevo.";
    }
};