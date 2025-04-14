import * as admin from "firebase-admin";
import { settlementEmailTemplate } from "../original-project/app/lib/email-templates/settlement.js";

// Initialize Firebase Admin SDK with service account key
try {
  admin.initializeApp({
    credential: admin.credential.cert("../serviceAccountKey.json")
  });
} catch (e) {
  console.warn("Admin SDK already initialized or initialization failed:", e);
}

const db = admin.firestore();
const templateId = "settlementNotification";
const templatesCollection = db.collection("templates");

async function createSettlementTemplate() {
  console.warn(`Checking for template '${templateId}'...`);
  const templateRef = templatesCollection.doc(templateId);
  const templateSnap = await templateRef.get();

  if (templateSnap.exists) {
    console.warn(`Template '${templateId}' already exists.`);
    return;
  }

  console.warn(`Creating template '${templateId}'...`);
  const templateData = {
    subject: settlementEmailTemplate.subject,
    textBody: settlementEmailTemplate.textBody,
    htmlBody: settlementEmailTemplate.htmlBody,
    // Add other template fields if needed by your logic
  };

  try {
    await templateRef.set(templateData);
    console.warn(`Successfully created template '${templateId}'.`);
  } catch (error) {
    console.error(`Error creating template '${templateId}':`, error);
  }
}

createSettlementTemplate().catch(console.error);
