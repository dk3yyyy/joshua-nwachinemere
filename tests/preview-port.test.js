import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { resolvePreviewPort } from '../scripts/preview-port.js';

function listen(socket, host = '127.0.0.1') {
  return new Promise((resolve, reject) => {
    socket.once('error', reject);
    socket.listen({ host, port: 0 }, () => resolve(socket.address().port));
  });
}

function close(socket) {
  return new Promise((resolve, reject) => socket.close((error) => error ? reject(error) : resolve()));
}

test('uses an explicitly supplied valid port deterministically', () => {
  assert.equal(resolvePreviewPort({ PORT: '43123' }), 43123);
});

test('rejects invalid, non-integer, and out-of-range explicit ports clearly', () => {
  for (const value of ['', 'abc', '43123.5', '0', '65536', ' 43123 ']) {
    assert.throws(() => resolvePreviewPort({ PORT: value }), /PORT must be an integer between 1 and 65535/);
  }
});

test('selects a free localhost port when PORT is absent', async () => {
  const port = await resolvePreviewPort({});
  assert.ok(Number.isInteger(port));
  assert.ok(port >= 1 && port <= 65535);

  const socket = net.createServer();
  await listen(socket, '127.0.0.1');
  await close(socket);
});

test('default resolver does not select a port already bound by a test socket', async () => {
  const socket = net.createServer();
  const occupied = await listen(socket);
  try {
    assert.notEqual(await resolvePreviewPort({}), occupied);
  } finally {
    await close(socket);
  }
});
