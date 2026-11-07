const allowedOrigins = new Set([
  'https://psihologcarmendrobota.ro',
  'https://www.psihologcarmendrobota.ro'
]);

function response(body, status, origin) {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Vary': 'Origin'
  };

  if (allowedOrigins.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return new Response(JSON.stringify(body), { status, headers });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (!allowedOrigins.has(origin)) {
      return response({ error: 'Cerere nepermisă.' }, 403, origin);
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
          'Vary': 'Origin'
        }
      });
    }

    if (request.method !== 'POST') {
      return response({ error: 'Metodă neacceptată.' }, 405, origin);
    }

    const contentLength = Number(request.headers.get('Content-Length') || 0);
    if (contentLength > 10_000) {
      return response({ error: 'Mesajul este prea mare.' }, 413, origin);
    }

    let submission;
    try {
      submission = await request.json();
    } catch {
      return response({ error: 'Datele trimise nu sunt valide.' }, 400, origin);
    }

    if (typeof submission._gotcha === 'string' && submission._gotcha.trim()) {
      return response({ success: true }, 200, origin);
    }

    const name = typeof submission.name === 'string' ? submission.name.trim() : '';
    const email = typeof submission.email === 'string' ? submission.email.trim() : '';
    const phone = typeof submission.phone === 'string' ? submission.phone.trim() : '';
    const message = typeof submission.message === 'string' ? submission.message.trim() : '';

    if (submission.consent !== true
      || !name || name.length > 120 || !phone || phone.length > 40
      || !email || email.length > 254
      || !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)*\.[^\s@.]{2,}$/.test(email)
      || !message || message.length > 5000) {
      return response({ error: 'Verifică datele completate și încearcă din nou.' }, 400, origin);
    }

    if (!env.RESEND_API_KEY || !env.CONTACT_EMAIL) {
      console.error('Email function is missing required configuration.');
      return response({ error: 'Trimiterea nu este configurată momentan.' }, 500, origin);
    }

    let resendResponse;
    try {
      resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Formular site <site@contact.psihologcarmendrobota.ro>',
          to: [env.CONTACT_EMAIL],
          reply_to: email,
          subject: 'Mesaj nou de pe site',
          text: `Consimțământ prelucrare date: Da\nNume: ${name}\nTelefon: ${phone}\nE-mail: ${email}\n\nMesaj:\n${message}`
        })
      });
    } catch {
      console.error('Could not connect to the email provider.');
      return response({ error: 'Mesajul nu a putut fi trimis. Încearcă din nou.' }, 502, origin);
    }

    if (!resendResponse.ok) {
      console.error('Email provider rejected the message:', resendResponse.status);
      return response({ error: 'Mesajul nu a putut fi trimis. Încearcă din nou.' }, 502, origin);
    }

    return response({ success: true }, 200, origin);
  }
};
