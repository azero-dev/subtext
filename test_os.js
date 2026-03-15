const https = require('https');

function testEndpoint(path) {
  const options = {
    hostname: 'api.opensubtitles.com',
    port: 443,
    path: path,
    method: 'GET',
    headers: {
      'Api-Key': 'dummy_key',
      'User-Agent': 'SubTextApp v1.0'
    }
  };

  const req = https.request(options, (res) => {
    console.log(`${path} -> Status: ${res.statusCode}`);
  });

  req.on('error', (e) => {
    console.error(`Error with ${path}: ${e.message}`);
  });

  req.end();
}

testEndpoint('/api/v1/features/search?query=matrix');
testEndpoint('/api/v1/features?query=matrix');
testEndpoint('/api/v1/subtitles?query=matrix');
