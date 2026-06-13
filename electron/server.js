const http = require('http');
const next = require('next');
const path = require('path');

const port = parseInt(process.env.PORT, 10) || 3000;
const dir = path.resolve(__dirname, '..'); // The Next.js project directory is the parent directory

console.log('Next.js starting from directory:', dir);
console.log('Using database:', process.env.DATABASE_URL);

const app = next({ dev: false, dir });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    http.createServer((req, res) => {
      handle(req, res);
    }).listen(port, '127.0.0.1', (err) => {
      if (err) {
        console.error('Failed to start HTTP server:', err);
        process.exit(1);
      }
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Error preparing Next.js app:', err);
    process.exit(1);
  });
