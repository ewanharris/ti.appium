#!/usr/bin/env node

const { checkNodeVersion } = require('../lib/utils');
const { join } = require('path');
const { execSync } = require('child_process'); // eslint-disable-line security/detect-child-process

try {
	checkNodeVersion();
} catch (e) {
	console.error(e.message);
	process.exit(1);
}

const hookPath = join(__dirname, '..', 'hook');
let command;
try {
	execSync('appc');
	command = 'appc ti config -a';
} catch (e) {
	command = 'ti config -a';
}
const hookCmd = `${command} paths.hooks ${hookPath}`;
try {
	console.log('Adding hook path to titanium config');
	execSync(hookCmd);
	console.log('Wrote hook');
} catch (e) {
	console.log(e);
	console.error('Failed to add hook');
	console.error(`Please run ${hookCmd} yourself`);
}
