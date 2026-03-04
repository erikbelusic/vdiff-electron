const path = require('node:path');
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    icon: path.resolve(__dirname, 'assets', 'icon'),
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  hooks: {
    postMake: async (_config, makeResults) => {
      if (process.platform !== 'darwin') return makeResults;

      for (const result of makeResults) {
        if (result.platform !== 'darwin') continue;

        const appPath = path.join(
          __dirname,
          'out',
          `vdiff-${result.platform}-${result.arch}`,
          'vdiff.app'
        );

        if (!fs.existsSync(appPath)) continue;

        const dmgDir = path.join(__dirname, 'out', 'make');
        fs.mkdirSync(dmgDir, { recursive: true });
        const dmgPath = path.join(dmgDir, `vdiff-${result.arch}.dmg`);

        // Remove existing DMG if present
        if (fs.existsSync(dmgPath)) fs.unlinkSync(dmgPath);

        // Create a temporary directory for DMG contents
        const tmpDir = path.join(__dirname, 'out', '.dmg-tmp');
        if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });
        fs.mkdirSync(tmpDir, { recursive: true });

        // Copy app and create Applications symlink
        execSync(`cp -R "${appPath}" "${tmpDir}/vdiff.app"`);
        execSync(`ln -s /Applications "${tmpDir}/Applications"`);

        // Create DMG using hdiutil
        execSync(
          `hdiutil create "${dmgPath}" -volname "vdiff" -srcfolder "${tmpDir}" -ov -format UDZO`
        );

        // Clean up
        fs.rmSync(tmpDir, { recursive: true });

        result.artifacts.push(dmgPath);
      }
      return makeResults;
    },
  },
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'erikbelusic',
          name: 'vdiff-electron',
        },
        draft: true,
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        build: [
          {
            entry: 'src/main/main.js',
            config: 'vite.main.config.mjs',
            target: 'main',
          },
          {
            entry: 'src/main/preload.js',
            config: 'vite.preload.config.mjs',
            target: 'preload',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.mjs',
          },
        ],
      },
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
