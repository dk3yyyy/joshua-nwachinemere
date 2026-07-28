import net from 'node:net';

const MIN_PORT = 1;
const MAX_PORT = 65535;
const PORT_ERROR = 'PORT must be an integer between 1 and 65535';

function parseExplicitPort(value) {
  if (!/^[0-9]+$/.test(value)) throw new Error(PORT_ERROR);
  const port = Number(value);
  if (!Number.isSafeInteger(port) || port < MIN_PORT || port > MAX_PORT) {
    throw new Error(PORT_ERROR);
  }
  return port;
}

function findFreeLocalhostPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen({ host: '127.0.0.1', port: 0 }, () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : null;
      server.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

export function resolvePreviewPort(env = process.env) {
  if (Object.hasOwn(env, 'PORT')) return parseExplicitPort(env.PORT);
  return findFreeLocalhostPort();
}
