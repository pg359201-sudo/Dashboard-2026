import { GoogleGenAI } from "@google/genai";
import { SalesRecord } from "../types";

export const generateSalesAnalysis = async (
    query: string, 
    contextData: SalesRecord[]
): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Summarize context to save tokens. We send top 50 records sorted by Volume if list is huge
        // or aggregated stats.
        const summary = contextData.length > 50 
            ? contextData
                .sort((a, b) => b.UC12mm - a.UC12mm)
                .slice(0, 50) 
            : contextData;

        const dataString = JSON.stringify(summary);

        const systemInstruction = `Eres un analista de ventas experto para la app SalesComander Pro.
        Responde basándote estrictamente en los datos adjuntos en formato JSON.
        Los datos representan clientes, volumen anual (UC 12mm), volumen YTD 2025 y YTD 2026.
        La columna 'Var2025vs2024' representa el crecimiento YTD (Var YTD) calculado entre 2026 vs 2025.
        
        Si te preguntan por totales, calcula la suma de los datos proporcionados.
        Sé conciso, profesional y usa formato Markdown para resaltar números clave.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `DATOS DE CONTEXTO (Top clientes por volumen):
            ${dataString}
            
            Pregunta del usuario: ${query}`,
             config: {
                systemInstruction: systemInstruction,
                thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster response on flash model
            }
        });

        return response.text || "No se pudo generar una respuesta.";
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Lo siento, hubo un error al consultar a la IA. Verifica tu conexión o intenta de nuevo.";
    }
};