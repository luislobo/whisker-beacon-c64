// Adapted from Luis Lobo’s c64-demo-kit VICE monitor harness.
// Run one isolated VICE process and serialize text-monitor commands. Memory
// dumps verify actual 6510 execution, not just host-generated assets. A private
// port/process group and finally cleanup keep tests from touching a user's VICE.
// Linux without DISPLAY uses xvfb-run. VICE_BIN overrides the emulator path.
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');

function readSymbols(file) {
  return Object.fromEntries(fs.readFileSync(file, 'utf8').trim().split(/\r?\n/).map(line => {
    const [, address, name] = line.trim().split(/\s+/);
    return [name.replace(/^\./, ''), parseInt(address, 16)];
  }));
}

class Monitor {
  constructor(socket, directory) {
    this.socket = socket; this.directory = directory; this.buffer = ''; this.serial = 0;
    socket.on('data', data => { this.buffer += data; this.pump(); });
    socket.on('error', error => this.pending?.reject(error));
    socket.on('close', () => this.pending?.reject(Error('VICE monitor closed')));
  }
  pump() {
    clearTimeout(this.quiet);
    if (this.pending && /\(C:\$[0-9a-f]+\)\s*$/i.test(this.buffer)) {
      this.quiet = setTimeout(() => {
        const { resolve, reject, timeout } = this.pending;
        const output = this.buffer; this.buffer = ''; this.pending = null; clearTimeout(timeout);
        if (/ERROR --|Unknown command/i.test(output)) reject(Error(output));
        else resolve(output);
      }, 15);
    }
  }
  command(text) {
    if (this.pending) throw Error('VICE commands must be sequential');
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { this.pending = null; reject(Error('VICE timeout: ' + this.buffer.slice(-500))); }, 15000);
      this.pending = { resolve, reject, timeout };
      // VICE file operands accept forward slashes on Windows.
      const command = process.platform === 'win32'
        ? text.replace(/"[^"]*"/g, operand => operand.replaceAll('\\', '/'))
        : text;
      this.socket.write(command + '\n'); this.pump();
    });
  }
  until(address) { return this.command('until ' + address.toString(16)); }
  async bytes(start, length) {
    const file = path.join(this.directory, 'memory-' + this.serial++ + '.bin');
    await this.command(`bsave "${file}" 0 ${start.toString(16)} ${(start + length - 1).toString(16)}`);
    return fs.readFileSync(file);
  }
  async write(address, bytes) {
    if (!Number.isInteger(address) || address < 0 || address + bytes.length > 65536) throw Error('Write exceeds C64 memory');
    // The text monitor has a short command-line limit. Keep each write below
    // it, including binary fixtures with 127/255-byte run boundaries.
    let result;
    for (let at = 0; at < bytes.length; at += 32) {
      result = await this.command('> ' + (address + at).toString(16) + ' ' + [...bytes.slice(at, at + 32)].map(b => b.toString(16).padStart(2, '0')).join(' '));
    }
    return result;
  }
}

async function runVice(mode, name, run) {
  const directory = path.join(root, 'build/validation', name + '-' + mode);
  fs.mkdirSync(directory, { recursive: true });
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port; await new Promise(resolve => server.close(resolve));
  const executable = process.env.VICE_BIN || 'x64sc';
  const args = ['-console', '-warp', '+sound', '-' + mode, '-remotemonitor', '-remotemonitoraddress', 'ip4://127.0.0.1:' + port];
  const headless = process.platform === 'linux' && !process.env.DISPLAY;
  const log = fs.openSync(path.join(directory, 'vice.log'), 'w');
  const child = spawn(headless ? 'xvfb-run' : executable, headless ? ['-a', executable, ...args] : args, { detached: true, stdio: ['ignore', log, log] });
  let startupError; child.on('error', error => { startupError = error; });
  let monitor;
  try {
    let socket;
    const deadline = Date.now() + 15000;
    while (!socket && Date.now() < deadline) {
      if (startupError) throw startupError;
      if (child.exitCode !== null) throw Error('VICE exited; inspect ' + directory + '/vice.log');
      socket = await new Promise(resolve => {
        const connection = net.connect(port, '127.0.0.1');
        connection.once('connect', () => resolve(connection));
        connection.once('error', () => { connection.destroy(); resolve(null); });
      });
      if (!socket) await new Promise(resolve => setTimeout(resolve, 50));
    }
    if (!socket) throw Error('VICE did not open its monitor; inspect ' + directory + '/vice.log');
    monitor = new Monitor(socket, directory); await monitor.command('');
    return await run(monitor, directory);
  } finally {
    if (monitor?.pending) clearTimeout(monitor.pending.timeout);
    clearTimeout(monitor?.quiet); monitor?.socket.destroy();
    try {
      if (child.pid !== undefined) {
        if (process.platform === 'win32') child.kill('SIGTERM');
        else process.kill(-child.pid, 'SIGTERM');
      }
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
    }
    fs.closeSync(log);
  }
}

module.exports = { runVice, readSymbols };
