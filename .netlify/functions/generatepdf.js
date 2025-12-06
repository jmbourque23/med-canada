// netlify/functions/generatepdf.js
// Génère un PDF de mise en demeure professionnelle

const PDFDocument = require('pdfkit');

/**
 * Génère un PDF de mise en demeure
 * @param {Object} data - Les données du formulaire
 * @returns {Promise<Buffer>} - Le PDF en buffer
 */
async function generatePDF(data) {
  return new Promise((resolve, reject) => {
    try {
      // Créer le document PDF
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50,
        },
      });

      // Buffer pour stocker le PDF
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Date d'aujourd'hui
      const dateAujourdhui = new Date().toLocaleDateString('fr-CA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // En-tête
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('MISE EN DEMEURE', { align: 'center' })
        .moveDown(2);

      // Coordonnées
      doc
        .fontSize(12)
        .font('Helvetica')
        .text(`${data.nom || ''}`, { align: 'left' })
        .text(`${data.adresse || ''}`)
        .text(`Téléphone : ${data.telephone || ''}`)
        .text(`Courriel : ${data.email || ''}`)
        .moveDown()
        .text(`Date : ${dateAujourdhui}`)
        .moveDown(2);

      // Objet
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('OBJET : ' + getLabelTypeMiseEnDemeure(data.type_mise_en_demeure))
        .moveDown(1.5);

      // Corps de la lettre
      doc
        .fontSize(12)
        .font('Helvetica')
        .text('Madame, Monsieur,', { align: 'left' })
        .moveDown();

      // Introduction
      doc
        .text(
          'Par la présente, je vous adresse une mise en demeure formelle concernant la situation décrite ci-après.',
          {
            align: 'justify',
          }
        )
        .moveDown();

      // EXPOSÉ DES FAITS
      doc
        .fontSize(13)
        .font('Helvetica-Bold')
        .text('EXPOSÉ DES FAITS')
        .moveDown(0.5);

      doc
        .fontSize(11)
        .font('Helvetica')
        .text(data.description || '', { align: 'justify' })
        .moveDown(1.5);

      // FONDEMENT JURIDIQUE
      doc
        .fontSize(13)
        .font('Helvetica-Bold')
        .text('FONDEMENT JURIDIQUE')
        .moveDown(0.5);

      doc
        .fontSize(11)
        .font('Helvetica')
        .text(getFondementJuridique(data.type_mise_en_demeure), {
          align: 'justify',
        })
        .moveDown(1.5);

      // MES DEMANDES
      doc
        .fontSize(13)
        .font('Helvetica-Bold')
        .text('MES DEMANDES')
        .moveDown(0.5);

      doc
        .fontSize(11)
        .font('Helvetica')
        .text(data.objectif || '', { align: 'justify' })
        .moveDown(1.5);

      // DÉLAI
      const dateDelai = new Date();
      dateDelai.setDate(dateDelai.getDate() + 10);
      const dateDelaiStr = dateDelai.toLocaleDateString('fr-CA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`DÉLAI : ${dateDelaiStr}`)
        .moveDown(0.5);

      doc
        .font('Helvetica')
        .text(
          "Je vous accorde un délai de dix (10) jours ouvrables à compter de la réception de la présente pour donner suite à mes demandes.",
          {
            align: 'justify',
          }
        )
        .moveDown(1.5);

      // CONSÉQUENCES
      doc
        .fontSize(13)
        .font('Helvetica-Bold')
        .text('CONSÉQUENCES EN CAS DE NON-RESPECT')
        .moveDown(0.5);

      doc
        .fontSize(11)
        .font('Helvetica')
        .text(
          "À défaut de respecter ce délai et de donner suite à mes demandes, je me verrai contraint(e) d'entreprendre sans autre avis les recours judiciaires appropriés pour faire valoir mes droits, et ce, à vos frais et dépens.",
          {
            align: 'justify',
          }
        )
        .moveDown(2);

      // Formule de politesse
      doc
        .text(
          "Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées."
        )
        .moveDown(3);

      // Signature
      doc
        .text('_____________________________')
        .text(`${data.nom || ''}`)
        .text('Le demandeur / La demanderesse');

      // Pied de page
      doc
        .fontSize(9)
        .fillColor('gray')
        .text(
          'Document généré par med-canada.ca - Ce document ne constitue pas un conseil juridique.',
          50,
          doc.page.height - 40,
          { align: 'center' }
        );

      // Finaliser le PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Retourne le label du type de mise en demeure
 */
function getLabelTypeMiseEnDemeure(type) {
  const labels = {
    assurances: "Réclamation d'assurance",
    infiltration: "Infiltration d'eau et dommages",
    locataire: 'Litige locataire/propriétaire',
    travaux: 'Travaux mal exécutés',
    'vice-cache': 'Vice caché',
    'achat-garantie': 'Défaut de garantie',
    diffamation: 'Diffamation',
    voisin: 'Trouble de voisinage',
    factures: 'Factures impayées',
    retard: 'Retard de paiement',
    rupture: 'Rupture de contrat',
    'non-respect': 'Non-respect des conditions contractuelles',
    fournisseurs: 'Manquement du fournisseur',
    clients: 'Créances impayées',
    recouvrement: 'Recouvrement de créances',
    commerciale: 'Litige commercial',
  };
  return labels[type] || 'Mise en demeure';
}

/**
 * Retourne le fondement juridique selon le type
 */
function getFondementJuridique(type) {
  const fondements = {
    assurances:
      "Conformément aux dispositions de la Loi sur les assurances (RLRQ, c. A-32) et du contrat d'assurance en vigueur, l'assureur a l'obligation de verser les indemnités prévues dans les délais raisonnables.",
    infiltration:
      "En vertu des articles 1457 et suivants du Code civil du Québec, toute personne qui cause un préjudice à autrui par sa faute est tenue de le réparer. De plus, l'article 1077 C.c.Q. prévoit que le propriétaire d'un immeuble est responsable des dommages causés par un vice de construction.",
    locataire:
      'Selon les articles 1851 et suivants du Code civil du Québec ainsi que la Loi sur la Régie du logement, le propriétaire a l’obligation de fournir un logement en bon état d’habitabilité et le locataire doit respecter ses obligations contractuelles.',
    travaux:
      "En vertu de l’article 2100 du Code civil du Québec, l’entrepreneur est tenu d’exécuter le contrat selon les règles de l’art et dans le respect des délais convenus. L’article 2120 C.c.Q. prévoit la responsabilité pour les vices de construction.",
    'vice-cache':
      "Conformément aux articles 1726 et suivants du Code civil du Québec, le vendeur est tenu de garantir l’acheteur contre les vices cachés qui diminuent l’utilité du bien ou qui le rendent impropre à l’usage auquel on le destine.",
    'achat-garantie':
      'En vertu de la Loi sur la protection du consommateur (RLRQ, c. P-40.1) et des articles 1716 et suivants du Code civil du Québec, le vendeur doit respecter les garanties légales et conventionnelles.',
    diffamation:
      "Selon l’article 1457 du Code civil du Québec et la jurisprudence établie, toute atteinte à la réputation d’une personne constitue une faute civile engageant la responsabilité de son auteur.",
    voisin:
      "En vertu de l’article 976 du Code civil du Québec, les voisins doivent accepter les inconvénients normaux du voisinage qui n’excèdent pas les limites de la tolérance qu’ils se doivent.",
    factures:
      'Conformément aux articles 1553 et suivants du Code civil du Québec, le débiteur est tenu d’exécuter ses obligations contractuelles, incluant le paiement des sommes dues dans les délais convenus.',
    retard:
      "En vertu de l’article 1617 du Code civil du Québec, le créancier a droit, en cas de retard, aux dommages-intérêts et aux intérêts conformément au contrat et à la loi.",
    rupture:
      "Selon l’article 1590 du Code civil du Québec, l’obligation contractuelle doit être exécutée de bonne foi et la rupture abusive d’un contrat engage la responsabilité de son auteur.",
    'non-respect':
      "Conformément à l’article 1458 du Code civil du Québec, toute personne a le devoir d’honorer les engagements qu’elle a contractés.",
    fournisseurs:
      'En vertu des articles 1716 et suivants du Code civil du Québec, le vendeur ou le fournisseur est tenu de livrer un bien conforme au contrat et exempt de vices.',
    clients:
      'Selon les articles 1553 et suivants du Code civil du Québec et les dispositions de la Loi sur le recouvrement de certaines créances (RLRQ, c. R-2.2), le débiteur est tenu de payer les sommes dues.',
    recouvrement:
      'Conformément aux articles 1553, 1590 et 1617 du Code civil du Québec, le créancier peut réclamer le paiement des sommes dues, des intérêts et des frais de recouvrement raisonnables.',
    commerciale:
      'En vertu des dispositions du Code civil du Québec applicables aux contrats commerciaux, notamment les articles 1375, 1434 et 1590, les parties sont tenues d’exécuter leurs obligations de bonne foi.',
  };

  return (
    fondements[type] ||
    "Conformément aux dispositions applicables du Code civil du Québec et des lois en vigueur au Québec et au Canada, vous êtes tenu de respecter vos obligations contractuelles et légales."
  );
}

// Export pour utilisation dans d'autres fonctions (stripeWebhook, etc.)
module.exports = { generatePDF };

// Handler Netlify (optionnel - permet d’appeler directement / .netlify/functions/generatepdf)
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Méthode non autorisée' }),
    };
  }

  try {
    const data = JSON.parse(event.body);
    const pdfBuffer = await generatePDF(data);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=mise-en-demeure.pdf',
      },
      body: pdfBuffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error('Erreur génération PDF:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
