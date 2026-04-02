const json = (data, status = 200, origin = '*') =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': origin,
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
    },
  });

const LEAD_MAGNETS = {
  'Ultimate SOP Framework': 'ultimate-sop-framework.pdf',
  'Business Systems Guide': 'business-systems-guide.pdf',
  'Partnership Blueprint': 'partnership-blueprint.pdf',
  'Faith Blueprint': 'faith-blueprint.pdf',
  'Revenue Playbook': 'revenue-playbook.pdf',
};

function normalizeName(name = '') {
  const trimmed = String(name || '').trim();
  if (!trimmed) return { firstName: '', lastName: '' };
  const [firstName, ...rest] = trimmed.split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}

async function upsertContact(env, payload) {
  const { firstName, lastName } = normalizeName(payload.name);
  const tags = Array.isArray(payload.tags) ? payload.tags.filter(Boolean) : [];

  const body = {
    locationId: env.GHL_LOCATION_ID,
    firstName,
    lastName,
    email: payload.email,
    source: payload.source || 'website',
    tags,
    customFields: [
      {
        key: 'lead_magnet',
        field_value: payload.leadMagnet || '',
      },
      {
        key: 'source_page',
        field_value: payload.sourcePage || '',
      },
    ],
  };

  const response = await fetch('https://services.leadconnectorhq.com/contacts/upsert', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GHL_TOKEN}`,
      Version: '2021-07-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  return { ok: response.ok, status: response.status, data };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('origin') || env.ALLOWED_ORIGIN || '*';

    if (request.method === 'OPTIONS') {
      return json({ ok: true }, 200, origin);
    }

    if (request.method !== 'POST') {
      return json({ ok: false, error: 'Method not allowed' }, 405, origin);
    }

    if (!env.GHL_TOKEN || !env.GHL_LOCATION_ID) {
      return json(
        {
          ok: false,
          error: 'Missing GHL_TOKEN or GHL_LOCATION_ID in worker environment',
        },
        500,
        origin,
      );
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ ok: false, error: 'Invalid JSON body' }, 400, origin);
    }

    if (!payload?.email) {
      return json({ ok: false, error: 'Email is required' }, 400, origin);
    }

    const result = await upsertContact(env, payload);
    if (!result.ok) {
      return json(
        {
          ok: false,
          error: 'Failed to upsert contact in HighLevel',
          details: result.data,
        },
        result.status || 502,
        origin,
      );
    }

    const filename = LEAD_MAGNETS[payload.leadMagnet] || '';
    const downloadUrl = filename && env.DOWNLOAD_BASE_URL
      ? `${env.DOWNLOAD_BASE_URL.replace(/\/$/, '')}/${filename}`
      : null;

    return json(
      {
        ok: true,
        contact: result.data?.contact || result.data,
        downloadUrl,
      },
      200,
      origin,
    );
  },
};
