// Run with `npm run test:testnet`. Broadcasts real transactions; assumes
// test/.env supplies the credentials.

const { expect } = require('chai');
const path = require('path');
const fs = require('fs-extra');
const { runCli, artifact, FIXTURE_DIR } = require('./helpers');

const cwd = FIXTURE_DIR;
const TEN_MINUTES = 10 * 60 * 1000;

describe('tronbox migrate against public testnets', function () {
  this.timeout(TEN_MINUTES);

  describe('Tron Nile testnet', () => {
    const env = { BUILD_DIR: 'build_nile' };
    const buildDir = path.join(cwd, env.BUILD_DIR);

    it('compiles and deploys all migrations to nile', () => {
      fs.removeSync(buildDir);
      const r = runCli(['migrate', '--network', 'nile', '--reset'], { cwd, env, timeout: TEN_MINUTES });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include("Using network 'nile'");
      expect(r.stdout).to.include('Running migration: 1_initial_migration.js');
      expect(r.stdout).to.include('Running migration: 2_deploy_contracts.js');
      expect(r.stdout).to.include('Deploying Empty');
      expect(fs.existsSync(artifact(buildDir, 'Migrations'))).to.equal(true);
      expect(fs.existsSync(artifact(buildDir, 'Empty'))).to.equal(true);
    });
  });

  describe('BTTC Donau EVM testnet', () => {
    const env = { BUILD_DIR: 'build_donau' };
    const buildDir = path.join(cwd, env.BUILD_DIR);

    it('compiles and deploys all migrations to donau via --evm', () => {
      fs.removeSync(buildDir);
      const r = runCli(['migrate', '--network', 'donau', '--evm', '--reset'], { cwd, env, timeout: TEN_MINUTES });
      expect(r.status, r.stderr).to.equal(0);
      expect(r.stdout).to.include("Using network 'donau'");
      expect(r.stdout).to.include('Running migration: 1_initial_migration.js');
      expect(r.stdout).to.include('Running migration: 2_deploy_contracts.js');
      expect(r.stdout).to.include('Deploying Empty');
      expect(fs.existsSync(artifact(buildDir, 'Migrations'))).to.equal(true);
      expect(fs.existsSync(artifact(buildDir, 'Empty'))).to.equal(true);
    });
  });
});
