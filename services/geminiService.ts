import { GoogleGenAI } from "@google/genai";
import { SalesRecord } from "../types";

export const generateSalesAnalysis = async (
    query: string, 
    contextData: SalesRecord[]
): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        // PRE-PROCESAMIENTO: 
        // 1. Limpieza de nombres de GEC para el chat (ej: "58 - LATON" -> "LATON")
        // 2. EXCLUSIÓN DE ID: Se elimina el campo 'id' (ej: "row-51") para que la IA no lo mencione.
        const cleanedData = contextData.map(({ id, ...record }) => {
            const newRecord = { ...record };
            if (newRecord.GEC) {
                // Regex mejorado: Elimina espacios iniciales opcionales, digitos, guiones y espacios excedentes.
                // Cubre "51 - ORO", "50-DIAMANTE", "99 - CUSTOMIZADO", etc.
                newRecord.GEC = newRecord.GEC.replace(/^\s*\d+\s*[-]\s*/, '').trim();
            }
            return newRecord;
        });

        // CÁLCULO DE TOTALES PARA CONTEXTO (Preventivo para alucinaciones de conteo)
        // Se calcula aquí para inyectarlo como "Verdad Absoluta" en el prompt
        const totalCount = cleanedData.length;
        const totalVolume = cleanedData.reduce((acc, curr) => acc + (Number(curr.UC12mm) || 0), 0);

        // Se envía la totalidad de los datos (ya limpios y sin ID)
        const dataString = JSON.stringify(cleanedData);

        // MODIFICACIÓN: Prompt de Sistema "Analista Experto"
        const systemInstruction = `Actúa como un Analista de Información Experto y Senior.
        Tu objetivo es proveer inteligencia de negocios precisa basada en los datos adjuntos.

        Tus Directrices de Comportamiento son:
        1. RESPUESTAS CONCRETAS Y SIN RODEOS: Ve directo al grano.
        2. VERACIDAD TOTAL: Responde basándote ÚNICAMENTE en el JSON adjunto.
        3. ANÁLISIS INTEGRAL: Realiza cálculos sobre todos los registros.
        4. LIMPIEZA DE IDENTIFICADORES: Jamás muestres IDs internos o números de fila. Usa solo el nombre del cliente (RazonSocial).

        5. FORMATO VISUAL (ESTRICTO - LIMPIEZA Y LEGIBILIDAD): 
           - **ESTRUCTURA JERÁRQUICA**: Usa Títulos Markdown (##) para separar la idea principal de los detalles.
           - **SEPARADORES DE SECCIÓN**: Usa OBLIGATORIAMENTE una línea horizontal Markdown (\`---\`) antes de cada nuevo título principal o cambio de tema (excepto el primero) para crear una división visual sutil.
           - **PROHIBIDO TABLAS**: No uses tablas markdown ni separadores '|'.
           - **FICHA DESTACADA**: Si preguntas por un "Mayor/Menor/Mejor", presenta al ganador claramente separado del resto usando negritas para etiquetas.
           - **LISTAS LIMPIAS**: Para listados secundarios, usa viñetas (*) compactas.
           - **USO DE EMOJIS**: Usa emojis relevantes (🏆, 📉, ⚠️, 📊) al inicio de los títulos para guia visual.
           
           - **NORMALIZACIÓN DE GEC (SEGMENTACIÓN)**:
             Usa SIEMPRE solo el nombre textual, ignorando códigos numéricos.
             Ejemplos de normalización obligatoria:
             * "50 - DIAMANTE" -> "DIAMANTE"
             * "51 - ORO" -> "ORO"
             * "52 - PLATA" -> "PLATA"
             * "53 - BRONCE" -> "BRONCE"
             * "58 - LATON" -> "LATON"
             * "99 - CUSTOMIZADO" -> "CUSTOMIZADO"
           
           6. MANEJO DE CONTEOS Y SEGMENTACIÓN (CRÍTICO):
           - El dataset adjunto contiene un TOTAL GLOBAL de ${totalCount} clientes activos.
           - **FILTRADO POR CANAL**: Si el usuario pregunta "¿cuántos almacenes?", "¿cuántas bodegas?", "¿cuántos supermercados?", DEBES filtrar los datos basándote en la columna 'GrupoCanal'.
             * Busca valores como "ALMACEN", "ALMACENES", "BODEGA", "TRADICIONAL" dentro de 'GrupoCanal' para responder esa pregunta específica.
             * NO confundas "Almacén" (segmento) con el Total de Clientes. Son cosas distintas.
           - SOLO responde con el Total Global (${totalCount}) si la pregunta es genérica (ej: "total de clientes", "total de puntos de venta", "cuántos hay en total").

           Ejemplo de Estructura de Respuesta Ideal:
           
           ## 🏆 [Concepto Principal]
           **[NOMBRE DEL CLIENTE]**
           * **Segmento:** [NOMBRE GEC LIMPIO]
           * **TP Red:** [Valor]%
           * **Volumen:** [Valor] UC

           ---
           
           ## 📊 [Contexto / Otros]
           * **Cliente B:** [Valor]%
           * **Cliente C:** [Valor]%

        Diccionario de Datos:
        - UC12mm: Volumen Anual (Cajas Unitarias).
        - Var2025vs2024: Crecimiento YTD (decimal, ej: 0.10 es 10%).
        - ShareREFRESCOS: Participación de mercado. NOTA: Si el valor es 0, vacío o muy bajo, significa que NO TIENE MEDICIÓN. No es un mal resultado, simplemente no hay datos de auditoría.
        - TP_RED: "Total Ponderado, Right Execution Daily". Mide la ejecución en PDV. IMPORTANTE: El valor en la base es DECIMAL (ej: 0.51) pero DEBE MOSTRARSE SIEMPRE COMO PORCENTAJE (ej: 51%). Si el campo está vacío o es 0, significa que el cliente NO TIENE MEDICIÓN/RELEVAMIENTO (no implica mala ejecución).
        - GrupoCanal: Canal de venta o tipo de negocio (Ej: Bodega, Supermercado, Almacén, etc.).
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-preview',
            contents: `RESUMEN DE AUDITORÍA DE DATOS (VERDAD DE CAMPO):
            - Total Clientes/Registros: ${totalCount}
            - Volumen Total: ${Math.round(totalVolume)}

            BASE DE DATOS DE VENTAS (JSON):
            ${dataString}
            
            SOLICITUD DE ANÁLISIS: ${query}`,
             config: {
                systemInstruction: systemInstruction
            }
        });

        return response.text || "No se pudo generar una respuesta.";
    } catch (error) {
        console.error("Gemini Error:", error);
        return `Error crítico en el análisis. Detalles: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
};