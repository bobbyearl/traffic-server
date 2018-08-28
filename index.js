const fs = require('fs-extra');
const url = require('url');
const https = require('https');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({});
const options = {
    key: fs.readFileSync('./ssl/localhost.key'),
    cert: fs.readFileSync('./ssl/localhost.crt'),
    requestCert: false,
    rejectUnauthorized: false
  };

const server = https.createServer(options, function(req, res) {
  const uri = url.parse(req.url, true);
  const origin = decodeURIComponent(uri.query['origin']);
  const directory = decodeURIComponent(uri.query['directory']);

  // TODO: Set this to relevant values
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Initial request, just change target to server.
  // All subsequent requests (come to root), change target to prefix.
  proxy.web(req, res, { 
    target: uri.pathname.indexOf('rtplive') > -1 ? origin : (origin + directory)
  });
});

console.log("listening on port 5050")
server.listen(5050);
