#!/usr/bin/env node
const { build } = require('esbuild');
const fs = require('fs/promises');
const path = require('path');
const zipDir = require('zip-dir');

(async () => {
    await build({
        entryPoints: ['src/content/index.ts', 'src/background/timechimp.ts'],
        outdir: 'build',
        minify: true,
        bundle: true,
        sourcemap: true,
    });

    await buildChrome('build_chrome');
    await buildFirefox('build_firefox');

    await fs.mkdir('artifacts', { recursive: true });
    zipDir('build_chrome', { saveTo: path.resolve('artifacts', 'chrome.zip') });
    zipDir('build_firefox', {
        saveTo: path.resolve('artifacts', 'firefox.zip'),
    });
})().catch((e) => {
    console.error(e);
    process.exit(1);
});

async function buildChrome(dir) {
    await fs.mkdir(dir, { recursive: true });
    await copyDir('build', path.resolve(dir, 'build'));
    await fs.copyFile('icon.png', path.join(dir, 'icon.png'));

    const manifestJson = JSON.parse(
        (await fs.readFile('manifest.json')).toString(),
    );
    manifestJson.browser_specific_settings = undefined;
    await fs.writeFile(
        path.join(dir, 'manifest.json'),
        JSON.stringify(manifestJson, null, 2),
    );
}

async function buildFirefox(dir) {
    await fs.mkdir(dir, { recursive: true });
    await copyDir('build', path.resolve(dir, 'build'));
    await fs.copyFile('icon.png', path.join(dir, 'icon.png'));

    // Firefox doesn't use `background.service_worker`,
    // but `background.script` to define the background worker.
    const manifestJson = JSON.parse(
        (await fs.readFile('manifest.json')).toString(),
    );
    manifestJson.background.scripts = [manifestJson.background.service_worker];
    manifestJson.background.service_worker = undefined;
    await fs.writeFile(
        path.join(dir, 'manifest.json'),
        JSON.stringify(manifestJson, null, 2),
    );
}

async function copyDir(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            await copyDir(srcPath, destPath);
        } else {
            await fs.copyFile(srcPath, destPath);
        }
    }
}
