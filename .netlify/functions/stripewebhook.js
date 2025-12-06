// netlify/functions/stripeWebhook.js

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { generatePDF } = require("./generatePDF");
const { sendEmail } = require("./sendEmail");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Méthode non autorisée" };
  }

  const sig = event.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    if (webhookSecret) {
      stripeEvent = stripe.webhooks.constructEvent(
        event.body,
        sig,
        webhookSecret
      );
    } else {
      stripeEvent = JSON.parse(event.body);
    }

    if (stripeEvent.type === "checkout.session.completed") {
      const session = stripeEvent.data.object;

      const pdfData = {
        nom: session.metadata.nom,
        adresse: session.metadata.adresse,
        email: session.customer_email,
        telephone: session.metadata.telephone,
        type_client: session.metadata.type_client,
        type_mise_en_demeure: session.metadata.type_mise_en_demeure,
        description: session.metadata.description,
        objectif: session.metadata.objectif,
        revision_manuelle: session.metadata.revision_manuelle
      };

      const pdfBuffer = await generatePDF(pdfData);

      await sendEmail(
        session.customer_email,
        pdfData.nom,
        pdfBuffer
      );

      return { statusCode: 200, body: "PDF envoyé" };
    }

    return { statusCode: 200, body: "Event ignoré" };

  } catch (err) {
    console.error("Erreur webhook:", err);
    return { statusCode: 400, body: "Webhook error" };
  }
};
