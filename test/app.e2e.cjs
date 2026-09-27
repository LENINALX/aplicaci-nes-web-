const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { createServer } = require('node:net');
const { once } = require('node:events');
const { setTimeout: delay } = require('node:timers/promises');

test('arranca con PostgreSQL y conserva las rutas de base y órdenes', { timeout: 90000 }, async () => {
  // La prueba usa la conexión configurada en .env; solo consulta, no crea órdenes.
  const reservation = createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));

  const api = spawn(process.execPath, ['dist/main.js'], {
    cwd: require('node:path').resolve(__dirname, '..'),
    env: { ...process.env, PORT: String(port) },
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  api.stdout.on('data', (chunk) => { logs += chunk; });
  api.stderr.on('data', (chunk) => { logs += chunk; });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 120; attempt++) {
      if (api.exitCode !== null) throw new Error(`La API terminó durante el inicio:\n${logs}`);
      try {
        const response = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(1000) });
        assert.equal(response.status, 200);
        assert.equal(await response.text(), 'Hello World!');
        ready = true;
        break;
      } catch {
        await delay(500);
      }
    }
    assert.ok(ready, `La API no estuvo disponible:\n${logs}`);
    const response = await fetch(`http://127.0.0.1:${port}/ordenes`, { signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 200);
    assert.ok(Array.isArray(await response.json()));
  } finally {
    if (api.exitCode === null) {
      const closed = once(api, 'close');
      api.kill();
      await closed;
    }
  }
});
