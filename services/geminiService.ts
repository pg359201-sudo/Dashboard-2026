import { GoogleGenAI } from "@google/genai";
import { SalesRecord } from "../types";

export const generateSalesAnalysis = async (
    query: string, 
    contextData: SalesRecord[]
): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // MODIFICACIÓN: Se elimina el límite de 50 registros.
        // Se envía la totalidad de los datos para aprovechar la ventana de contexto de Gemini Flash.
        // Esto permite análisis reales de "El peor cliente", "Total compañía", etc.
        const dataString = JSON.stringify(contextData);

        // MODIFICACIÓN: Prompt de Sistema "Analista Experto"
        // ACTUALIZACIÓN: Se prohíben tablas y se exige formato de bullets limpios.
        const systemInstruction = `Actúa como un Analista de Información Experto y Senior.
        Tu objetivo es proveer inteligencia de negocios precisa basada en los datos adjuntos.

        Tus Directrices de Comportamiento son:
        1. RESPUESTAS CONCRETAS Y SIN RODEOS: Ve directo al grano. No uses saludos floridos ni despedidas genéricas. Dame el dato duro.
        2. VERACIDAD TOTAL: Responde basándote ÚNICAMENTE en el JSON adjunto. NO inventes información. Si el dato no existe, di claramente: "No tengo información sobre eso en la base de datos".
        3. ANÁLISIS INTEGRAL: Tienes acceso a la base de datos COMPLETA. Realiza cálculos (sumas, promedios, máximos, mínimos) considerando todos los registros proporcionados.
        4. FORMATO VISUAL (ESTRICTO): 
           - PROHIBIDO USAR TABLAS MARKDOWN ni separadores de barra vertical (|). El usuario considera que "no aportan nada" y dificultan la lectura.
           - USA EXCLUSIVAMENTE LISTAS CON VIÑETAS (BULLETS) para presentar rankings, listados o comparativas.
           - Evita encabezados de columna repetitivos.
           - Formato sugerido para items: "• Cliente: Dato 1, Dato 2".
           - Mantén la respuesta limpia, minimalista y fácil de leer en móvil.
        
        Diccionario de Datos:
        - UC12mm: Volumen Anual (Cajas Unitarias).
        - Var2025vs2024: Crecimiento YTD (decimal, ej: 0.10 es 10%).
        - ShareREFRESCOS: Participación de mercado.
        - TP: Precio Promedio.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `BASE DE DATOS DE VENTAS (JSON):
            ${dataString}
            
            SOLICITUD DE ANÁLISIS: ${query}`,
             config: {
                systemInstruction: systemInstruction,
                thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster response on flash model
            }
        });

        return response.text || "No se pudo generar una respuesta.";
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Error crítico en el análisis. Es posible que el volumen de datos exceda el límite momentáneo o haya problemas de conexión.";
    }
};