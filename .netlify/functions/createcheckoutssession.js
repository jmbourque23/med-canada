// netlify/functions/createCheckoutSession.js
// Crée une session Stripe Checkout et redirige le client

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
  // Gérer OPTIONS pour CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Méthode non autorisée' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    
    // Validation des champs obligatoires
    const requiredFields = ['nom', 'adresse', 'email', 'telephone', 'type_client', 'type_mise_en_demeure', 'description', 'objectif'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Champs manquants: ' + missingFields.join(', ')
        })
      };
    }

    // Calculer le prix
    let amount = 2999; // 29.99$ en cents
    if (data.type_client === 'entreprise') {
      amount = 4999; // 49.99$
    }
    if (data.revision_manuelle === 'Oui') {
      amount += 2999; // +29.99$
    }

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: data.type_client === 'particulier' 
                ? 'Mise en demeure - Particulier' 
                : 'Mise en demeure - Entreprise',
              description: `Type: ${data.type_mise_en_demeure}${data.revision_manuelle === 'Oui' ? ' (Révision manuelle incluse)' : ''}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.URL || 'https://med-canada-ca.netlify.app'}?success=true`,
      cancel_url: `${process.env.URL || 'https://med-canada-ca.netlify.app'}?canceled=true`,
      customer_email: data.email,
      metadata: {
        nom: data.nom,
        adresse: data.adresse,
        telephone: data.telephone,
        type_client: data.type_client,
        type_mise_en_demeure: data.type_mise_en_demeure,
        description: data.description.substring(0, 500), // Stripe limite à 500 caractères
        objectif: data.objectif.substring(0, 500),
        revision_manuelle: data.revision_manuelle || 'Non'
      }
    });

    console.log('✅ Session Stripe créée:', session.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        sessionId: session.id,
        url: session.url
      })
    };

  } catch (error) {
    console.error('❌ Erreur création session:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Erreur lors de la création de la session de paiement: ' + error.message
      })
    };
  }
};
