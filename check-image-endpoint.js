const https = require('https');

https.get('https://www.fidly.ma/api/wallet/stamp-image?token=dce97d10ce0b0cf22f70c461463fff01', (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);
}).on('error', (e) => {
    console.error(e);
});
