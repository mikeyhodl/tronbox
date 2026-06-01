const { expect } = require('chai');
const path = require('path');
const fs = require('fs-extra');
const { runCli, artifact, FIXTURE_DIR } = require('./helpers');

const cwd = FIXTURE_DIR;
const buildDir = path.join(cwd, 'build');
const buildInfoDir = path.join(buildDir, 'build-info');

// Returns hashes for which both <hash>.json and <hash>.output.json exist.
const buildInfoPairs = () => {
  const files = new Set(fs.readdirSync(buildInfoDir));
  return [...files]
    .filter(f => f.endsWith('.json') && !f.endsWith('.output.json'))
    .map(f => f.replace(/\.json$/, ''))
    .filter(hash => files.has(`${hash}.output.json`));
};

describe('tronbox compile', function () {
  this.timeout(120_000);

  describe('flags', () => {
    it('default run compiles contracts and writes artifacts', () => {
      fs.removeSync(buildDir);
      const r = runCli(['compile'], { cwd });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Compiling ./contracts/Empty.sol');
      expect(r.stdout).to.include('Writing artifacts');
      expect(r.stdout).to.include('Compiled successfully');
      expect(fs.existsSync(artifact(buildDir, 'Empty'))).to.equal(true);
      expect(buildInfoPairs()).to.have.lengthOf(1);
    });

    it('second run with no changes short-circuits', () => {
      const r = runCli(['compile'], { cwd });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Everything is up to date');
      expect(r.stdout).to.not.include('Compiling ./contracts/');
    });

    it('--all forces a full rebuild', () => {
      const r = runCli(['compile', '--all'], { cwd });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Compiling ./contracts/Empty.sol');
      expect(r.stdout).to.not.include('Everything is up to date');
    });

    it('--quiet suppresses stdout and exits 0', () => {
      const r = runCli(['compile', '--quiet', '--all'], { cwd });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.equal('');
    });

    it('positional file argument compiles only that file', () => {
      fs.removeSync(buildDir);
      const r = runCli(['compile', 'contracts/Empty.sol'], { cwd });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Compiling ./contracts/Empty.sol');
      expect(r.stdout).to.not.include('Compiling ./contracts/Migrations.sol');
      expect(fs.existsSync(artifact(buildDir, 'Empty'))).to.equal(true);
      expect(fs.existsSync(artifact(buildDir, 'Migrations'))).to.equal(false);
    });

    it('different compilation contexts accumulate distinct build-info entries', () => {
      fs.removeSync(buildDir);
      const r1 = runCli(['compile', '--all'], { cwd });
      expect(r1.status, r1.stderr).to.equal(0);
      expect(buildInfoPairs()).to.have.lengthOf(1);

      const r2 = runCli(['compile', 'contracts/Empty.sol'], { cwd });
      expect(r2.status, r2.stderr).to.equal(0);
      expect(buildInfoPairs()).to.have.lengthOf(2);
    });
  });

  describe('running from a subdirectory', () => {
    [
      { subdir: 'migrations', singleArg: '../contracts/Empty.sol' },
      { subdir: 'contracts', singleArg: 'Empty.sol' }
    ].forEach(({ subdir, singleArg }) => {
      const subCwd = path.join(cwd, subdir);

      it(`from ${subdir}, --all rebuilds all contracts`, () => {
        fs.removeSync(buildDir);
        const r = runCli(['compile', '--all'], { cwd: subCwd });
        expect(r.status, r.stderr).to.equal(0);
        expect(r.stdout).to.include('Compiling ./contracts/Empty.sol');
        expect(r.stdout).to.include('Compiling ./contracts/Migrations.sol');
        expect(fs.existsSync(artifact(buildDir, 'Empty'))).to.equal(true);
        expect(fs.existsSync(artifact(buildDir, 'Migrations'))).to.equal(true);
      });

      it(`from ${subdir}, a file argument compiles only that file`, () => {
        fs.removeSync(buildDir);
        const r = runCli(['compile', singleArg], { cwd: subCwd });
        expect(r.status, r.stderr).to.equal(0);
        expect(r.stdout).to.include('Compiling ./contracts/Empty.sol');
        expect(r.stdout).to.not.include('Compiling ./contracts/Migrations.sol');
        expect(fs.existsSync(artifact(buildDir, 'Empty'))).to.equal(true);
        expect(fs.existsSync(artifact(buildDir, 'Migrations'))).to.equal(false);
      });
    });
  });

  describe('contracts directory variants', () => {
    it('CONTRACTS_DIR=contracts_imports resolves relative, scoped npm, and unscoped npm imports', () => {
      fs.removeSync(buildDir);
      const r = runCli(['compile', '--all'], { cwd, env: { CONTRACTS_DIR: 'contracts_imports' } });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Compiling ./contracts_imports/Main.sol');
      expect(r.stdout).to.include('Compiling ./contracts_imports/B.sol');
      expect(r.stdout).to.include('Compiling ./contracts_imports/utils/Math.sol');
      expect(r.stdout).to.include('Compiling @openzeppelin/contracts/token/ERC20/IERC20.sol');
      expect(r.stdout).to.include('Compiling sol-mock/Foo.sol');
      ['Main', 'B', 'Math', 'IERC20', 'Foo'].forEach(name => {
        expect(fs.existsSync(artifact(buildDir, name))).to.equal(true);
      });
    });

    it('single-file argument transitively pulls in dependencies', () => {
      fs.removeSync(buildDir);
      const r = runCli(['compile', 'contracts_imports/Main.sol'], {
        cwd,
        env: { CONTRACTS_DIR: 'contracts_imports' }
      });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Compiling ./contracts_imports/Main.sol');
      expect(r.stdout).to.include('Compiling ./contracts_imports/B.sol');
      expect(r.stdout).to.include('Compiling ./contracts_imports/utils/Math.sol');
      expect(r.stdout).to.include('Compiling @openzeppelin/contracts/token/ERC20/IERC20.sol');
      expect(r.stdout).to.include('Compiling sol-mock/Foo.sol');
      ['Main', 'B', 'Math', 'IERC20', 'Foo'].forEach(name => {
        expect(fs.existsSync(artifact(buildDir, name))).to.equal(true);
      });
    });

    it('CONTRACTS_DIR=contracts_syntax_error reports a ParserError', () => {
      const r = runCli(['compile', '--all'], { cwd, env: { CONTRACTS_DIR: 'contracts_syntax_error' } });
      expect(r.status).to.not.equal(0);
      expect(r.stderr).to.include('ParserError');
    });

    it('CONTRACTS_DIR=contracts_missing_npm reports the missing package', () => {
      const r = runCli(['compile', '--all'], { cwd, env: { CONTRACTS_DIR: 'contracts_missing_npm' } });
      expect(r.status).to.not.equal(0);
      expect(r.stderr).to.include('Package "@nonexistent/pkg" is not installed');
    });

    it('CONTRACTS_DIR=contracts_missing_relative reports the missing source file', () => {
      const r = runCli(['compile', '--all'], { cwd, env: { CONTRACTS_DIR: 'contracts_missing_relative' } });
      expect(r.status).to.not.equal(0);
      expect(r.stderr).to.match(/could not find .*notExist\.sol/i);
    });

    it('CONTRACTS_DIR=contracts_outside rejects sources outside the dir', () => {
      const r = runCli(['compile', '--all'], { cwd, env: { CONTRACTS_DIR: 'contracts_outside' } });
      expect(r.status).to.not.equal(0);
      expect(r.stderr).to.match(/outside the contracts directory/i);
      expect(r.stderr).to.include('shared_lib/Lib.sol');
    });

    it('CONTRACTS_DIR outside the project directory is rejected', () => {
      const r = runCli(['compile', '--all'], {
        cwd,
        env: { CONTRACTS_DIR: '/tmp/tronbox_contracts_outside_project' }
      });
      expect(r.status).to.not.equal(0);
      expect(r.stderr).to.include('contracts_directory is outside the project directory');
    });
  });

  describe('compilers.solc.settings', () => {
    it('settings flow into build-info and toggling the optimizer changes the deployed bytecode', () => {
      const readBuildInfoSettings = () => {
        const pairs = buildInfoPairs();
        expect(pairs).to.have.lengthOf(1);
        return JSON.parse(fs.readFileSync(path.join(buildInfoDir, `${pairs[0]}.json`), 'utf8')).settings;
      };

      fs.removeSync(buildDir);
      runCli(['compile', '--all'], { cwd, env: { CONTRACTS_DIR: 'contracts_advanced' } });
      const baselineSettings = readBuildInfoSettings();
      expect(baselineSettings.optimizer).to.equal(undefined);
      expect(baselineSettings.evmVersion).to.equal(undefined);
      const baseline = JSON.parse(fs.readFileSync(artifact(buildDir, 'Roster'), 'utf8')).deployedBytecode;

      fs.removeSync(buildDir);
      runCli(['compile', '--all'], {
        cwd,
        env: {
          CONTRACTS_DIR: 'contracts_advanced',
          SOLC_SETTINGS_JSON: '{"optimizer":{"enabled":true,"runs":200},"evmVersion":"istanbul"}'
        }
      });
      const optimizedSettings = readBuildInfoSettings();
      expect(optimizedSettings.optimizer).to.deep.equal({ enabled: true, runs: 200 });
      expect(optimizedSettings.evmVersion).to.equal('istanbul');
      const optimized = JSON.parse(fs.readFileSync(artifact(buildDir, 'Roster'), 'utf8')).deployedBytecode;

      expect(baseline).to.be.a('string').and.not.empty;
      expect(optimized).to.be.a('string').and.not.empty;
      expect(optimized).to.not.equal(baseline);
    });

    it('invalid evmVersion fails compilation', () => {
      fs.removeSync(buildDir);
      const r = runCli(['compile', '--all'], {
        cwd,
        env: { SOLC_SETTINGS_JSON: '{"evmVersion":"nonsense"}' }
      });
      expect(r.status).to.not.equal(0);
      expect(r.stderr).to.include('Invalid EVM version');
    });
  });

  describe('EVM mode', () => {
    const env = { BUILD_DIR: 'build_evm' };
    const altBuildDir = path.join(cwd, env.BUILD_DIR);

    it('compiles using EVM config and downloads the EVM solc on demand', () => {
      fs.removeSync(altBuildDir);
      const r = runCli(['compile', '--evm', '--all'], { cwd, env });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include('Compiling ./contracts/Empty.sol');
      expect(r.stdout).to.include('Compiled successfully');
      expect(fs.existsSync(artifact(altBuildDir, 'Empty'))).to.equal(true);
    });
  });
});
