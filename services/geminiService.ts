import { GoogleGenAI } from "@google/genai";
import { Order, NotificationConfig } from "../types";

// Initialize the Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a friendly SMS notification message for a customer when their laundry is ready.
 */
export const generateCustomerNotification = async (order: Order, config?: NotificationConfig): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const tone = config?.tone || 'Friendly';
    const signature = config?.signature || 'SparkleFlow Laundry';
    
    const prompt = `
      Write a short, ${tone} SMS text message (max 160 chars) to a customer named ${order.customerName}.
      Inform them that their laundry order #${order.id} is now READY for pickup.
      The total amount due is $${order.totalAmount.toFixed(2)}.
      Payment Status: ${order.paymentStatus}.
      Sign off exactly as: "${signature}".
      Do not include placeholders.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    const text = response.text;
    return text || `Your laundry is ready! Total: $${order.totalAmount.toFixed(2)}. - ${signature}`;
  } catch (error) {
    console.error("Error generating notification:", error);
    const signature = config?.signature || 'SparkleFlow Laundry';
    return `Hello ${order.customerName}, your order #${order.id} is ready. Total: $${order.totalAmount}. - ${signature}`;
  }
};

/**
 * Analyzes a raw note to suggest order items (Simulated for this demo, but structure is here).
 */
export const analyzeOrderNotes = async (note: string): Promise<string> => {
    try {
        const model = 'gemini-2.5-flash';
        const response = await ai.models.generateContent({
            model,
            contents: `Extract laundry items from this text and return a JSON array of objects with 'item' and 'quantity': "${note}"`
        });
        return response.text || "";
    } catch (e) {
        return "";
    }
}