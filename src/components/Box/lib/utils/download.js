const axios = require('axios');
const os = require('os');
const path = require('path');
const { pipeline } = require('stream/promises');
const fs = require('fs-extra');
const yauzl = require('yauzl');

function parseParams(params) {
  if (typeof params === 'string') {
    const [repoPart, ref] = params.split('#');
    const parts = repoPart.replace(/\.git$/, '').split(/[:/]/);
    return { user: parts[parts.length - 2], repo: parts[parts.length - 1], ref };
  }
  if (params && typeof params === 'object') {
    return params;
  }
  throw new Error('Invalid parameter type. Should be repo URL string or object containing repo and user.');
}

function streamToFile(stream, file) {
  return pipeline(stream, fs.createWriteStream(file));
}

function extractZip(zipFile, outputDir) {
  return new Promise((resolve, reject) => {
    yauzl.open(zipFile, { lazyEntries: true }, (err, zipfile) => {
      if (err) return reject(err);

      const normalizedOutputDir = path.resolve(outputDir);
      let folderName = null;
      let pending = 0;
      let ended = false;
      let failed = false;

      const fail = e => {
        if (failed) return;
        failed = true;
        zipfile.close();
        reject(e);
      };

      const maybeFinish = () => {
        if (failed || !ended || pending !== 0) return;
        resolve(folderName || path.basename(zipFile, '.zip'));
      };

      zipfile.on('entry', entry => {
        if (failed) return;

        if (!folderName && entry.fileName.includes('/')) {
          folderName = entry.fileName.split('/')[0];
        }

        if (/\/$/.test(entry.fileName)) {
          zipfile.readEntry();
          return;
        }

        const file = path.resolve(outputDir, entry.fileName);
        const relative = path.relative(normalizedOutputDir, file);
        if (relative.startsWith('..') || path.isAbsolute(relative)) {
          return fail(new Error(`Refusing to extract unsafe zip entry outside destination: ${entry.fileName}`));
        }

        pending++;
        zipfile.openReadStream(entry, (err, readStream) => {
          if (err) return fail(err);

          fs.ensureDir(path.dirname(file), err => {
            if (err) return fail(err);

            pipeline(readStream, fs.createWriteStream(file)).then(() => {
              pending--;
              maybeFinish();
            }, fail);
          });
        });
        zipfile.readEntry();
      });

      zipfile.on('end', () => {
        ended = true;
        maybeFinish();
      });

      zipfile.on('error', fail);
      zipfile.readEntry();
    });
  });
}

module.exports = async function downloadRepo(params, dir) {
  const { user, repo, ref } = parseParams(params);
  const targetRef = ref || 'master';
  const targetDir = dir || process.cwd();

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tronbox-download-'));
  const zipFile = path.join(tmpDir, `${repo}-${targetRef}.zip`);
  const zipUrl = `https://github.com/${user}/${repo}/archive/${targetRef}.zip`;

  try {
    const response = await axios.get(zipUrl, { responseType: 'stream' });
    await streamToFile(response.data, zipFile);

    const extractedFolder = await extractZip(zipFile, tmpDir);
    await fs.move(path.join(tmpDir, extractedFolder), targetDir, { overwrite: true });
  } finally {
    try {
      fs.removeSync(tmpDir);
    } catch (e) {}
  }
};
