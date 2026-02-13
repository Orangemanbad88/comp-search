/**
 * Lightweight RETS client using raw fetch.
 *
 * Flow: login → search → logout (stateless per-request).
 * Parses COMPACT-DECODED response format (tab-delimited).
 */

export interface RetsConfig {
  loginUrl: string;
  username: string;
  password: string;
  userAgent?: string;
}

interface CapabilityUrls {
  search: string;
  getObject: string;
  logout: string;
}

// ---------------------------------------------------------------------------
// XML / response parsers
// ---------------------------------------------------------------------------

/** Extract capability URLs from RETS login response XML. */
export function parseLoginResponse(xml: string, baseUrl: string): CapabilityUrls {
  const base = new URL(baseUrl);

  const extract = (key: string): string => {
    // Capabilities come as Key = /path lines inside the XML body
    const re = new RegExp(`${key}\\s*=\\s*(.+)`, 'i');
    const m = xml.match(re);
    if (!m) return '';
    const value = m[1].trim();
    // Could be absolute or relative
    if (value.startsWith('http')) return value;
    return `${base.origin}${value}`;
  };

  return {
    search: extract('Search'),
    getObject: extract('GetObject'),
    logout: extract('Logout'),
  };
}

/**
 * Parse a COMPACT-DECODED RETS response into an array of records.
 *
 * Format:
 *   <DELIMITER value="09"/>          (hex code of delimiter char)
 *   <COLUMNS>\tField1\tField2\t</COLUMNS>
 *   <DATA>\tVal1\tVal2\t</DATA>
 *   ...
 */
export function parseCompactDecoded(text: string): Record<string, string>[] {
  // Determine delimiter (default tab = 0x09)
  const delimMatch = text.match(/<DELIMITER\s+value\s*=\s*"([^"]+)"/i);
  const delim = delimMatch ? String.fromCharCode(parseInt(delimMatch[1], 16)) : '\t';

  // Extract COLUMNS
  const colMatch = text.match(/<COLUMNS>([\s\S]*?)<\/COLUMNS>/i);
  if (!colMatch) return [];
  const columns = colMatch[1].split(delim).filter(Boolean);

  // Extract DATA rows
  const rows: Record<string, string>[] = [];
  const dataRe = /<DATA>([\s\S]*?)<\/DATA>/gi;
  let m: RegExpExecArray | null;
  while ((m = dataRe.exec(text)) !== null) {
    const values = m[1].split(delim);
    // Strip leading/trailing empty strings caused by leading/trailing delimiters
    if (values.length > 0 && values[0] === '') values.shift();
    if (values.length > 0 && values[values.length - 1] === '') values.pop();

    const row: Record<string, string> = {};
    columns.forEach((col, i) => {
      row[col] = values[i] ?? '';
    });
    rows.push(row);
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Photo fetching
// ---------------------------------------------------------------------------

/**
 * Fetch a property photo via RETS GetObject.
 *
 * @param config    RETS credentials
 * @param listingId MLS listing ID
 * @param photoIdx  Photo index (0 = primary)
 * @returns         { data: Buffer, contentType: string } or null if not found
 */
export async function retsGetPhoto(
  config: RetsConfig,
  listingId: string,
  photoIdx = 0,
): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  const authHeader = 'Basic ' + btoa(`${config.username}:${config.password}`);
  const baseHeaders: Record<string, string> = {
    Authorization: authHeader,
    'User-Agent': config.userAgent || 'CompSearch/1.0',
    'RETS-Version': 'RETS/1.8',
    Accept: '*/*',
  };

  let capabilities: CapabilityUrls | null = null;
  let sessionCookies = '';

  try {
    // --- LOGIN ---
    const loginRes = await fetch(config.loginUrl, { headers: baseHeaders, redirect: 'manual' });
    if (!loginRes.ok && loginRes.status !== 302) {
      throw new Error(`RETS login failed: ${loginRes.status}`);
    }
    const loginBody = await loginRes.text();

    const setCookies = loginRes.headers.getSetCookie?.() || [];
    sessionCookies = setCookies.map(c => c.split(';')[0]).join('; ');

    const replyCodeMatch = loginBody.match(/ReplyCode\s*=\s*"(\d+)"/i);
    if (replyCodeMatch && replyCodeMatch[1] !== '0') {
      return null;
    }

    capabilities = parseLoginResponse(loginBody, config.loginUrl);
    if (!capabilities.getObject) return null;

    // --- GET OBJECT ---
    const objectParams = new URLSearchParams({
      Type: 'Photo',
      Resource: 'Property',
      ID: `${listingId}:${photoIdx}`,
    });

    const objectHeaders = { ...baseHeaders };
    if (sessionCookies) objectHeaders['Cookie'] = sessionCookies;

    const objectUrl = `${capabilities.getObject}?${objectParams.toString()}`;
    const objectRes = await fetch(objectUrl, { headers: objectHeaders });

    if (!objectRes.ok) return null;

    const contentType = objectRes.headers.get('content-type') || 'image/jpeg';

    // Check if it's actually an image (not a RETS error XML)
    if (contentType.includes('text/xml') || contentType.includes('text/html')) {
      return null;
    }

    const data = await objectRes.arrayBuffer();
    if (data.byteLength < 100) return null; // Too small to be a real image

    return { data, contentType };
  } finally {
    if (capabilities?.logout) {
      const logoutHeaders = { ...baseHeaders };
      if (sessionCookies) logoutHeaders['Cookie'] = sessionCookies;
      fetch(capabilities.logout, { headers: logoutHeaders }).catch(() => {});
    }
  }
}

// ---------------------------------------------------------------------------
// Main search function
// ---------------------------------------------------------------------------

/**
 * Perform a full RETS login → search → logout cycle.
 *
 * @param config       RETS credentials
 * @param resource     e.g. "Property"
 * @param className    e.g. "Residential"
 * @param query        DMQL2 query string
 * @param selectFields Optional list of fields to return
 * @param limit        Max rows (default 25)
 */
export async function retsSearch(
  config: RetsConfig,
  resource: string,
  className: string,
  query: string,
  selectFields?: string[],
  limit = 25,
): Promise<Record<string, string>[]> {
  const authHeader = 'Basic ' + btoa(`${config.username}:${config.password}`);
  const baseHeaders: Record<string, string> = {
    Authorization: authHeader,
    'User-Agent': config.userAgent || 'CompSearch/1.0',
    'RETS-Version': 'RETS/1.8',
    Accept: '*/*',
  };

  let capabilities: CapabilityUrls | null = null;
  let sessionCookies = '';

  try {
    // --- LOGIN ---
    const loginRes = await fetch(config.loginUrl, { headers: baseHeaders, redirect: 'manual' });
    if (!loginRes.ok && loginRes.status !== 302) {
      throw new Error(`RETS login failed: ${loginRes.status} ${loginRes.statusText}`);
    }
    const loginBody = await loginRes.text();

    // Capture session cookies from login response
    const setCookies = loginRes.headers.getSetCookie?.() || [];
    sessionCookies = setCookies.map(c => c.split(';')[0]).join('; ');

    // Check for RETS error
    const replyCodeMatch = loginBody.match(/ReplyCode\s*=\s*"(\d+)"/i);
    if (replyCodeMatch && replyCodeMatch[1] !== '0') {
      const replyText = loginBody.match(/ReplyText\s*=\s*"([^"]+)"/i);
      throw new Error(`RETS login error ${replyCodeMatch[1]}: ${replyText?.[1] || 'Unknown'}`);
    }

    capabilities = parseLoginResponse(loginBody, config.loginUrl);

    if (!capabilities.search) {
      throw new Error('RETS login succeeded but no Search capability URL found');
    }

    // --- SEARCH ---
    const searchParams = new URLSearchParams({
      SearchType: resource,
      Class: className,
      Query: query,
      QueryType: 'DMQL2',
      Format: 'COMPACT-DECODED',
      Limit: String(limit),
      Count: '1',
      StandardNames: '0',
    });

    if (selectFields?.length) {
      searchParams.set('Select', selectFields.join(','));
    }

    const searchHeaders = { ...baseHeaders };
    if (sessionCookies) {
      searchHeaders['Cookie'] = sessionCookies;
    }

    const searchUrl = `${capabilities.search}?${searchParams.toString()}`;
    const searchRes = await fetch(searchUrl, { headers: searchHeaders });

    if (!searchRes.ok) {
      throw new Error(`RETS search failed: ${searchRes.status} ${searchRes.statusText}`);
    }

    const searchBody = await searchRes.text();

    // Check for RETS-level errors in search response
    const searchReplyMatch = searchBody.match(/ReplyCode\s*=\s*"(\d+)"/i);
    if (searchReplyMatch && searchReplyMatch[1] !== '0') {
      const searchReplyText = searchBody.match(/ReplyText\s*=\s*"([^"]+)"/i);
      // ReplyCode 20201 = No Records Found — not an error
      if (searchReplyMatch[1] === '20201') {
        return [];
      }
      throw new Error(`RETS search error ${searchReplyMatch[1]}: ${searchReplyText?.[1] || 'Unknown'}`);
    }

    return parseCompactDecoded(searchBody);
  } finally {
    // --- LOGOUT (fire-and-forget) ---
    if (capabilities?.logout) {
      const logoutHeaders = { ...baseHeaders };
      if (sessionCookies) logoutHeaders['Cookie'] = sessionCookies;
      fetch(capabilities.logout, { headers: logoutHeaders }).catch(() => {});
    }
  }
}
