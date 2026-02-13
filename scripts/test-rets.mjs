// Quick RETS integration test
async function testRets() {
  const loginUrl = 'https://capemay-rets.paragonrels.com/rets/fnisrets.aspx/CAPEMAY/login?rets-version=rets/1.8';
  const authHeader = 'Basic ' + btoa('606500229:john03$');
  const baseHeaders = {
    Authorization: authHeader,
    'User-Agent': 'CompSearch/1.0',
    'RETS-Version': 'RETS/1.8',
    Accept: '*/*',
  };

  console.log('Step 1: Login...');
  const loginRes = await fetch(loginUrl, { headers: baseHeaders });
  console.log('Login status:', loginRes.status);
  const loginBody = await loginRes.text();

  const setCookies = loginRes.headers.getSetCookie() || [];
  const sessionCookies = setCookies.map(c => c.split(';')[0]).join('; ');
  console.log('Cookies:', sessionCookies.substring(0, 80));

  const searchMatch = loginBody.match(/Search\s*=\s*(.+)/i);
  if (!searchMatch) throw new Error('No search URL');
  let searchBase = searchMatch[1].trim();
  const base = new URL(loginUrl);
  if (!searchBase.startsWith('http')) searchBase = base.origin + searchBase;
  console.log('Search URL:', searchBase);

  const params = new URLSearchParams({
    SearchType: 'Property',
    Class: 'RE_1',
    Query: '(L_City=|SeaIsleC),(L_StatusCatID=|2),(L_Keyword1=2-4),(L_Keyword2=1-3),(L_StatusDate=2024-01-01+)',
    QueryType: 'DMQL2',
    Format: 'COMPACT-DECODED',
    Limit: '25',
    Count: '1',
    StandardNames: '0',
    Select: 'L_ListingID,L_Address,L_City,L_Zip,L_Keyword1,L_Keyword2,LM_Dec_13,L_SquareFeet,LM_Char10_1,L_SoldPrice,L_StatusDate,LMD_MP_Latitude,LMD_MP_Longitude,L_Type_,L_PictureCount,L_AskingPrice',
  });

  const searchHeaders = { ...baseHeaders };
  if (sessionCookies) searchHeaders['Cookie'] = sessionCookies;

  console.log('\nStep 2: Search...');
  const searchRes = await fetch(searchBase + '?' + params, { headers: searchHeaders });
  console.log('Search status:', searchRes.status);
  const searchBody = await searchRes.text();

  const replyMatch = searchBody.match(/ReplyCode\s*=\s*"(\d+)"/i);
  console.log('Reply code:', replyMatch?.[1]);
  const countMatch = searchBody.match(/Records="(\d+)"/i);
  console.log('Record count:', countMatch?.[1]);

  // Parse results
  const dataRows = searchBody.match(/<DATA>([\s\S]*?)<\/DATA>/gi) || [];
  console.log('\nResults found:', dataRows.length);
  dataRows.slice(0, 5).forEach(row => {
    const inner = row.replace(/<\/?DATA>/gi, '');
    const fields = inner.split('\t').filter(Boolean);
    console.log(`  ${fields[1]} | ${fields[2]} | $${fields[9]} | ${fields[10]}`);
  });
}

testRets().catch(e => console.error('FAILED:', e));
