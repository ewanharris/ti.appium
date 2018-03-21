#!/usr/bin/env node

const { checkNodeVersion } = require('../lib/utils');
const { copySync, existsSync, mkdirsSync } = require('fs-extra');
const { join } = require('path');

try {
	checkNodeVersion();
} catch (e) {
	console.error(e.message);
	process.exit(1);
}

const templateDir = join(__dirname, '..', 'template', 'e2e');
const e2eDir = join(process.cwd(), 'e2e');

if (!existsSync(join(process.cwd(), 'tiapp.xml'))) {
	console.error(`Could not find tiapp.xml in cwd (${process.cwd()})`);
	console.error('Please run the "tiappium-init-project" command from the root of a Titanium project');
	process.exit(1);
}
if (existsSync(join(process.cwd(), 'e2e'))) {
	console.error(`A folder called "e2e" already exists at (${join(process.cwd(), 'e2e')})`);
	console.error('Please move it away');
	process.exit(1);
} else {
	console.log(`Creating "e2e" directory at ${e2eDir}`);
	mkdirsSync(e2eDir);
}
console.log('Copying template files across');
copySync(templateDir, e2eDir);
console.log('Files copied!');
