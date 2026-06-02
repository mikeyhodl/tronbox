const { spawn, spawnSync } = require('child_process');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const TRONBOX_BIN = path.join(REPO_ROOT, 'tronbox.dev');
const FIXTURE_DIR = path.join(__dirname, 'fixture');
const LOCAL_TMP_ROOT = path.join(__dirname, '.temp');

const artifact = (buildDir, name) => path.join(buildDir, 'contracts', `${name}.json`);

// Spawn the dev tronbox CLI. Default timeout exceeds the longest file-level
// mocha timeout (300s) so a single CLI call never silently undercuts a test.
function runCli(args, { cwd = FIXTURE_DIR, env = {}, input, timeout = 300_000 } = {}) {
  return spawnSync(TRONBOX_BIN, args, {
    cwd,
    encoding: 'utf-8',
    timeout,
    input,
    // FORCE_COLOR last so a stray caller can't re-enable ANSI codes and break stdout assertions.
    env: { ...process.env, ...env, FORCE_COLOR: '0' }
  });
}

// Drive the REPL line-by-line, only sending the next line once `expect` appears
// in stdout. Required for any input that triggers a spawned subcommand —
// spawnSync closes stdin on EOF, which makes the REPL exit and kill the child
// before it can produce output.
function runCliRepl(args, { cwd = FIXTURE_DIR, env = {}, steps = [], timeout = 180_000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(TRONBOX_BIN, args, {
      cwd,
      env: { ...process.env, ...env, FORCE_COLOR: '0' }
    });
    let stdout = '';
    let stderr = '';
    const pending = steps.slice();
    let waitingFor = null;

    const trySendNext = () => {
      while (pending.length && (!waitingFor || stdout.includes(waitingFor))) {
        const step = pending.shift();
        waitingFor = step.expect || null;
        child.stdin.write(step.input);
      }
      if (!pending.length && !waitingFor) child.stdin.end();
    };

    child.stdout.on('data', d => {
      stdout += d.toString();
      if (waitingFor && stdout.includes(waitingFor)) {
        waitingFor = null;
        trySendNext();
      }
    });
    child.stderr.on('data', d => (stderr += d.toString()));

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`runCliRepl timeout after ${timeout}ms\nstdout:\n${stdout}\nstderr:\n${stderr}`));
    }, timeout);

    child.on('close', (status, signal) => {
      clearTimeout(timer);
      resolve({ status, signal, stdout, stderr });
    });

    trySendNext();
  });
}

function makeTmp(prefix = 'tronbox-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function makeLocalTmp(prefix = 'tronbox-test-') {
  fs.ensureDirSync(LOCAL_TMP_ROOT);
  return fs.mkdtempSync(path.join(LOCAL_TMP_ROOT, prefix));
}

function removeTmp(dir) {
  if (dir && (dir.startsWith(os.tmpdir()) || dir.startsWith(LOCAL_TMP_ROOT))) fs.removeSync(dir);
}

module.exports = {
  runCli,
  runCliRepl,
  makeTmp,
  makeLocalTmp,
  removeTmp,
  artifact,
  REPO_ROOT,
  TRONBOX_BIN,
  FIXTURE_DIR
};
