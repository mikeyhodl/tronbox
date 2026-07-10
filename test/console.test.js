// Requires TRE running on http://127.0.0.1:9090.

const { expect } = require('chai');
const path = require('path');
const fs = require('fs-extra');
const { runCli, runCliRepl, FIXTURE_DIR } = require('./helpers');

const cwd = FIXTURE_DIR;

describe('tronbox console', function () {
  this.timeout(60_000);

  it('starts a REPL with the development network prompt and exits cleanly', () => {
    const r = runCli(['console'], { cwd, input: '.exit\n' });
    expect(r.status, r.stderr).to.equal(0);
    expect(r.stdout).to.include('tronbox(development)>');
  });

  it('prints console.log output and records it in the history file', () => {
    const historyFile = path.join(cwd, '.console_history');
    fs.removeSync(historyFile);
    const r = runCli(['console'], {
      cwd,
      isTTY: true,
      input: 'console.log("hello-from-repl")\n'
    });
    expect(r.status, r.stderr).to.equal(0);
    // A terminal REPL echoes its input, so `include` would match the echo.
    expect(r.stdout).to.match(/^hello-from-repl$/m);
    expect(fs.readFileSync(historyFile, 'utf-8')).to.include('console.log("hello-from-repl")');
  });

  it('reports a ReferenceError for an unknown identifier', () => {
    const r = runCli(['console'], { cwd, input: 'nosuchidentifier\n.exit\n' });
    expect(r.status, r.stderr).to.equal(0);
    expect(r.stdout + r.stderr).to.match(/nosuchidentifier is not defined/);
  });

  it('built-in `help` prints the command list', () => {
    const r = runCli(['console'], { cwd, input: 'help\n.exit\n' });
    expect(r.status, r.stderr).to.equal(0);
    // Yargs writes the help banner to stderr.
    expect(r.stderr).to.include('Usage: tronbox <command> [options]');
    ['compile', 'migrate', 'test'].forEach(c => expect(r.stderr).to.include(c));
  });

  it('--network changes the prompt label', () => {
    const r = runCli(['console', '--network', 'shasta'], {
      cwd,
      input: '.exit\n'
    });
    expect(r.status, r.stderr).to.equal(0);
    expect(r.stdout).to.include('tronbox(shasta)>');
  });

  it('--network for an unknown network is rejected', () => {
    const r = runCli(['console', '--network', 'nope'], { cwd, input: '.exit\n' });
    expect(r.status).to.not.equal(0);
    expect(r.stderr).to.include('does not exist in your "tronbox-config.js"');
  });

  it('runs `test` from inside the REPL', async function () {
    this.timeout(60_000);
    const r = await runCliRepl(['console'], {
      cwd,
      steps: [{ input: 'test\n', expect: 'passing' }, { input: '.exit\n' }]
    });
    expect(r.status, r.stderr).to.equal(0);
    expect(r.stdout).to.match(/\d+ passing/);
    expect(r.stdout).to.not.match(/\d+ failing/);
  });

  it('rejects `test --evm` from a non-EVM REPL', () => {
    const r = runCli(['console'], { cwd, input: 'test --evm\n.exit\n' });
    expect(r.status, r.stderr).to.equal(0);
    expect(r.stdout + r.stderr).to.include('the current REPL is not in EVM mode');
  });
});
