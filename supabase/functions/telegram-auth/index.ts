// ════════════════════════════════════════════════════════════════════════════
// MUSE — telegram-auth Edge Function
//
// Verifies Telegram Mini App initData with HMAC-SHA256, checks the owner
// allowlist, then returns a one-time magic-link token_hash that the browser
// exchanges for a Supabase session via supabase.auth.verifyOtp().
//
// Required secrets (supabase secrets set ...):
//   TELEGRAM_BOT_TOKEN
//   TELEGRAM_OWNER_ID      numeric Telegram user id
//   MUSE_OWNER_ID          Supabase Auth UUID of the library owner (same as bot)
//   MUSE_OWNER_EMAIL       optional: existing Supabase Auth email for the owner
//   SITE_URL               optional: https://you.github.io/MUSE
// ════════════════════════════════════════════════════════════════════════════

import { createClient } from 'npm:@supabase/supabase-js@2';

const MAX_AUTH_AGE_SECONDS = 60 * 60 * 24;

const corsHeaders = (origin: string | null): Record<string, string> => {
  const allowed = (Deno.env.get('SITE_URL') ?? '')
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const normalized = origin?.replace(/\/$/, '') ?? '';
  const isAllowed =
    allowed.length === 0 ||
    allowed.includes(normalized) ||
    /^http:\/\/localhost(:\d+)?$/.test(normalized);

  return {
    'Access-Control-Allow-Origin': isAllowed && normalized ? normalized : allowed[0] ?? '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
};

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacSha256(key: BufferSource, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
}

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

interface VerifiedInitData {
  user: TelegramUser;
  authDate: number;
}

async function verifyInitData(
  initData: string,
  botToken: string,
): Promise<VerifiedInitData> {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) throw new Error('Missing Telegram hash.');

  const pairs: string[] = [];
  for (const [key, value] of params.entries()) {
    if (key === 'hash' || key === 'signature') continue;
    pairs.push(`${key}=${value}`);
  }
  pairs.sort();
  const dataCheckString = pairs.join('\n');

  // secret_key = HMAC_SHA256(key="WebAppData", data=bot_token)
  const secretKey = await hmacSha256(encoder.encode('WebAppData'), botToken);
  const computed = toHex(await hmacSha256(secretKey, dataCheckString));

  if (computed.length !== hash.length) throw new Error('Invalid Telegram signature.');
  let mismatch = 0;
  for (let index = 0; index < computed.length; index += 1) {
    mismatch |= computed.charCodeAt(index) ^ hash.charCodeAt(index);
  }
  if (mismatch !== 0) throw new Error('Invalid Telegram signature.');

  const authDate = Number(params.get('auth_date'));
  if (!Number.isFinite(authDate)) throw new Error('Missing Telegram auth_date.');
  const age = Math.floor(Date.now() / 1000) - authDate;
  if (age > MAX_AUTH_AGE_SECONDS || age < -60) {
    throw new Error('Telegram session has expired. Reopen the Mini App.');
  }

  const rawUser = params.get('user');
  if (!rawUser) throw new Error('Missing Telegram user payload.');

  let user: TelegramUser;
  try {
    user = JSON.parse(rawUser) as TelegramUser;
  } catch {
    throw new Error('Malformed Telegram user payload.');
  }
  if (!user || typeof user.id !== 'number') {
    throw new Error('Malformed Telegram user payload.');
  }

  return { user, authDate };
}

Deno.serve(async (request) => {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed.' }, { status: 405, headers });
  }

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const ownerTelegramId = Deno.env.get('TELEGRAM_OWNER_ID');
  const ownerUserId = Deno.env.get('MUSE_OWNER_ID')?.trim() ?? '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!botToken || !supabaseUrl || !serviceRoleKey) {
    return Response.json(
      { error: 'Telegram sign-in is not configured on the server.' },
      { status: 500, headers },
    );
  }

  try {
    const body = (await request.json()) as { initData?: string };
    if (!body.initData || typeof body.initData !== 'string') {
      return Response.json({ error: 'initData is required.' }, { status: 400, headers });
    }

    const { user } = await verifyInitData(body.initData, botToken);

    if (ownerTelegramId && String(user.id) !== ownerTelegramId.trim()) {
      return Response.json(
        { error: 'This Telegram account is not allowed to access MUSE.' },
        { status: 403, headers },
      );
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const displayName =
      [user.first_name, user.last_name].filter(Boolean).join(' ') ||
      user.username ||
      'Listener';

    let email = Deno.env.get('MUSE_OWNER_EMAIL')?.trim() ?? '';
    let ownerExists = false;

    if (ownerUserId) {
      // Telegram sign-in must land in the SAME account the bot writes to,
      // otherwise the Mini App would see an empty library.
      const { data: ownerData, error: ownerError } =
        await admin.auth.admin.getUserById(ownerUserId);
      if (ownerError || !ownerData?.user) {
        throw new Error(
          'MUSE_OWNER_ID does not match an existing Supabase Auth user. Create the owner account first.',
        );
      }
      ownerExists = true;
      email = ownerData.user.email?.trim() || email;
    }

    if (!email) {
      email = `telegram-${user.id}@muse.local`;
    }

    if (!ownerExists) {
      // Fallback for setups without MUSE_OWNER_ID: create the account on first use.
      const { error: createError } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          display_name: displayName,
          telegram_user_id: user.id,
          telegram_username: user.username ?? null,
        },
      });

      if (createError && !/already/i.test(createError.message)) {
        throw createError;
      }
    }

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });
    if (linkError) throw linkError;

    const tokenHash = linkData?.properties?.hashed_token;
    if (!tokenHash) throw new Error('Could not create a sign-in token.');

    const userId = linkData.user?.id;
    if (ownerUserId && userId !== ownerUserId) {
      throw new Error(
        'Telegram sign-in resolved to a different account. Check MUSE_OWNER_EMAIL and MUSE_OWNER_ID.',
      );
    }
    if (userId) {
      await admin
        .from('profiles')
        .upsert(
          {
            id: userId,
            email,
            display_name: displayName,
            telegram_user_id: user.id,
          },
          { onConflict: 'id' },
        );
      await admin
        .from('user_settings')
        .upsert(
          {
            owner_id: userId,
            display_name: displayName,
            telegram_user_id: user.id,
          },
          { onConflict: 'owner_id' },
        );
    }

    return Response.json({ token_hash: tokenHash, email }, { headers });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Telegram sign-in failed.';
    return Response.json({ error: message }, { status: 401, headers });
  }
});
