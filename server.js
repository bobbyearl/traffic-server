const fs = require('fs-extra');
const url = require('url');
const http = require('http');
const https = require('https');
const httpProxy = require('http-proxy');

const isProduction = !!process.env.ENVIRONMENT;
const PORT = process.env.PORT || 5050;
const proxy = httpProxy.createProxyServer({});

const requestHandler = (request, response) => {
  const uri = url.parse(request.url, true);

  // Shortcircuit test
  if (uri.pathname === '/ping') {
    return response.end('Traffic, nice.');
  }

  const origin = decodeURIComponent(uri.query['origin']);
  const directory = decodeURIComponent(uri.query['directory']);
  response.setHeader('Access-Control-Allow-Origin', '*');

  // Initial request, just change target to server.
  // All subsequent requests (come to root), change target to prefix.
  proxy.web(request, response, { 
    target: uri.pathname.indexOf('rtplive') > -1 ? origin : (origin + directory)
  });
};

// Azure doesn't need SSL
const getServer = () => {

  if (isProduction) {
    return http.createServer(requestHandler);
  }

  return https.createServer(
    {
      key: fs.readFileSync('./ssl/localhost.key'),
      cert: fs.readFileSync('./ssl/localhost.crt'),
      requestCert: false,
      rejectUnauthorized: false
    },
    requestHandler
  );
};

const server = getServer();

server.listen(PORT, () => {
  console.log('Production:', isProduction);
  console.log(server.address());
});
