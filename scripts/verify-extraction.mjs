// Verifies Gemini structured extraction with the same schema/prompt the
// service uses, against a sample certificate (text/plain inline data).
import { GoogleGenAI, Type } from "@google/genai";
import { config } from "dotenv";

config({ path: ".env.local" });

const SAMPLE = `CERTIFICATE OF REGISTRATION
ISO/IEC 27001:2022 — Information Security Management System
This is to certify that: Razorpay Software Private Limited
Certification Body: BSI Assurance UK Ltd
Original Registration Date: 15 January 2024
Certificate Expiry Date: 14 January 2027`;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const res = await ai.models.generateContent({
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  contents: [
    {
      role: "user",
      parts: [
        { text: "Extract documentType, issuer, issuedOn, expiresOn, summary. Dates as YYYY-MM-DD, null if absent. Do not guess." },
        { inlineData: { mimeType: "text/plain", data: Buffer.from(SAMPLE).toString("base64") } },
      ],
    },
  ],
  config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        documentType: { type: Type.STRING, nullable: true },
        issuer: { type: Type.STRING, nullable: true },
        issuedOn: { type: Type.STRING, nullable: true },
        expiresOn: { type: Type.STRING, nullable: true },
        summary: { type: Type.STRING, nullable: true },
      },
      required: ["documentType", "issuer", "issuedOn", "expiresOn", "summary"],
    },
    temperature: 0,
  },
});

console.log("Gemini structured extraction:");
console.log(JSON.parse(res.text));
