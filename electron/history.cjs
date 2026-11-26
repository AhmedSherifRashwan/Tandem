const fs = require('node:fs/promises');
const { constants } = require('node:fs');
const path = require('node:path');

// Copy once: never move the old history or overwrite the new app's history.
async function migrateHistory(destination, legacyDirectories) {
  await fs.mkdir(destination, { recursive: true });
  for (const directory of legacyDirectories) {
    try {
      await fs.copyFile(path.join(directory, 'history.json'), path.join(destination, 'history.json'), constants.COPYFILE_EXCL);
      await fs.chmod(path.join(destination, 'history.json'), 0o600);
      return true;
    } catch (error) {
      if (error.code === 'EEXIST') return false;
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return false;
}
module.exports = { migrateHistory };
