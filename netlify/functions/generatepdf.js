// netlify/functions/generatepdf.js
// Helper: génère un PDF et retourne un Buffer

const PDFDocument = require("pdfkit");

// ===============================
// 📄 GÉNÉRATION DU PDF
// ===============================
async function generatePDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "LETTER",
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50,
        },
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const dateAujourdhui = new Date().toLocaleDateString("fr-CA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // ===== TITRE =====
      doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .text("MISE EN DEMEURE", { align: "center" })
        .moveDown(2);

      // ===== IDENTITÉ =====
      doc
        .font("Helvetica")
        .fontSize(12)
        .text(data.nom || "")
        .text(data.adresse || "")
        .text(`Téléphone : ${data.telephone || ""}`)
        .text(`Courriel : ${data.email || ""}`)
        .moveDown()
        .text(`Date : ${dateAujourdhui}`)
        .moveDown(2);

      // ===== OBJET =====
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .text(
          "OBJET : " + getLabelTypeMiseEnDemeure(data.type_mise_en_demeure)
        )
        .moveDown(1.5);

      // ===== TEXTE =====
      doc
        .font("Helvetica")
        .fontSize(12)
        .text("Madame, Monsieur,")
        .moveDown()
        .text(
          "Par la présente, je vous adresse une mise en demeure formelle concernant la situation décrite ci-après.",
          { align: "justify" }
        )
        .moveDown();

      // ===== FAITS =====
      section(doc, "EXPOSÉ DES FAITS", data.description);

      // ===== FONDEMENT =====
      section(
        doc,
        "FONDEMENT JURIDIQUE",
        getFondementJuridique(data.type_mise_en_demeure)
      );

      // ===== DEMANDES =====
      section(doc, "MES DEMANDES", data.objectif);

      // ===== DÉLAI =====
      const delai = new Date();
      delai.setDate(delai.getDate() + 10);
      const delaiStr = delai.toLocaleDateString("fr-CA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      doc
        .font("Helvetica-Bold")
        .text(`DÉLAI : ${delaiStr}`)
        .moveDown(0.5);

      doc
        .font("Helvetica")
        .text(
          "Un délai de dix (10) jours vous est accordé afin de donner suite à la présente.",
          { align: "justify" }
        )
        .moveDown(1.5);

      // ===== CONSÉQUENCES =====
      section(
        doc,
        "CONSÉQUENCES EN CAS DE NON-RESPECT",
        "À défaut de respecter ce délai, des recours judiciaires pourraient être entrepris sans autre avis."
      );

      // ===== SIGNATURE =====
      doc
        .moveDown(2)
        .text("Veuillez agréer, Madame, Monsieur, mes salutations distinguées.")
        .moveDown(3)
        .text("_____________________________")
        .text(data.nom || "")
        .moveDown(2);

      // ===== FOOTER =====
      doc
        .fontSize(9)
        .fillColor("gray")
        .text(
          "Document généré par med-canada.ca — Ce document ne constitue pas un avis juridique.",
          50,
          doc.page.height - 40,
          { align: "center" }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ===============================
// 🔧 OUTILS
// ===============================
function section(doc, title, content = "") {
  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .text(title)
    .moveDown(0.5);

  doc
    .font("Helvetica")
    .fontSize(11)
    .text(content || "", { align: "justify" })
    .moveDown(1.5);
}

function getLabelTypeMiseEnDemeure(type) {
  const labels = {
    assurances: "Réclamation d’assurance",
    infiltration: "Infiltration d’eau",
    locataire: "Litige locataire / propriétaire",
    travaux: "Travaux mal exécutés",
    factures: "Factures impayées",
    retard: "Retard de paiement",
    commerciale: "Litige commercial",
  };

  return labels[type] || "Mise en demeure";
}

function getFondementJuridique(type) {
  const fondements = {
    assurances:
      "Conformément à la Loi sur les assurances et au contrat en vigueur, l’assureur a l’obligation d’indemniser.",
    infiltration:
      "En vertu des articles 1457 et suivants du Code civil du Québec.",
    locataire:
      "Selon les dispositions du Code civil du Québec relatives au bail.",
    travaux:
      "Selon l’article 2100 du Code civil du Québec relatif aux obligations de l’entrepreneur.",
    factures:
      "Conformément aux articles 1553 et suivants du Code civil du Québec.",
    commerciale:
      "Conformément aux obligations contractuelles prévues au Code civil du Québec.",
  };

  return (
    fondements[type] ||
    "Conformément aux dispositions applicables du Code civil du Québec."
  );
}

// ✅ EXPORT UNIQUE (IMPORTANT)
module.exports = { generatePDF };
