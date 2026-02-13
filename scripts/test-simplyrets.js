/**
 * SimplyRETS Connection Test
 * Run with: node scripts/test-simplyrets.js
 */

const DEMO_URL = 'https://api.simplyrets.com';
const DEMO_USER = 'simplyrets';
const DEMO_PASS = 'simplyrets';

async function testSimplyRets() {
  console.log('Testing SimplyRETS Demo API...\n');

  const auth = 'Basic ' + Buffer.from(`${DEMO_USER}:${DEMO_PASS}`).toString('base64');

  try {
    // Test basic connection
    const response = await fetch(`${DEMO_URL}/properties?limit=5&status=Closed`, {
      headers: {
        'Authorization': auth,
        'Accept': 'application/json',
      },
    });

    console.log('Status:', response.status, response.statusText);

    if (!response.ok) {
      console.error('Failed to connect');
      return;
    }

    const listings = await response.json();
    console.log(`\n✓ Connected! Got ${listings.length} listings\n`);

    // Show sample listing
    if (listings.length > 0) {
      const sample = listings[0];
      console.log('Sample listing:');
      console.log('  MLS ID:', sample.mlsId);
      console.log('  Address:', sample.address?.full);
      console.log('  City:', sample.address?.city);
      console.log('  Price:', sample.listPrice ? `$${sample.listPrice.toLocaleString()}` : 'N/A');
      console.log('  Beds:', sample.property?.bedrooms);
      console.log('  Baths:', sample.property?.bathsFull);
      console.log('  Sqft:', sample.property?.area?.toLocaleString());
      console.log('  Year:', sample.property?.yearBuilt);
      console.log('  Photos:', sample.photos?.length || 0);
      console.log('  Lat/Lng:', sample.geo?.lat, sample.geo?.lng);
    }

    console.log('\n✓ SimplyRETS is working! Restart the dev server to use it.');

  } catch (error) {
    console.error('✗ Connection failed:', error.message);
  }
}

testSimplyRets();
