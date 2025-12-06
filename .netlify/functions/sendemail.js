// netlify/functions/sendemail.js
// Envoie le PDF généré par email au client

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(to, name, pdfBuffer) {
  return await resend.emails.send({
    from: "MED Canada <noreply@med-canada.ca>",
    to: to,
    subject: "Votre mise en demeure est prête",
    html: `
      <p>Bonjour ${name},</p>
      <p>Veuillez trouver en pièce jointe votre mise en demeure personnalisée.</p>
      <p><strong>Ce document ne constitue pas un avis juridique.</strong></p>
      <p>— med-canada.ca</p>
    `,
    attachments: [
      {
        filename: "mise-en-demeure.pdf",
        content: pdfBuffer.toString("base64"),
        encoding: "base64",
      },
    ],
  });
}

module.exports = { sendEmail };
