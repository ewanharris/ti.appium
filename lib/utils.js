const debug  = require('debug')('tiappium:util');
const semver = require('semver');

const { existsSync, readdirSync, readJSONSync }  = require('fs-extra');
const { join } = require('path');

function getTestFiles(projectDir, platform) {
	const testsDirectory = join(projectDir, 'e2e');
	const platformTestsDirectory = join(testsDirectory, platform);
	const files = [];
	if (existsSync(testsDirectory)) {
		files.push(...readdirSync(testsDirectory).map(file => join(testsDirectory, file)));
		existsSync(platformTestsDirectory) && files.push(...readdirSync(platformTestsDirectory).map(file => join(platformTestsDirectory, file)));
		return files.filter(file => /\w+\.test\.js/.test(file));
	} else {
		const err = new Error(`Test directory does not exist in ${projectDir}, please create a directory called "e2e"`);
		err.code = 'ETESTDIRNOTEXIST';
		throw err;
	}
}

function getCommands(projectDir) {
	const commandsDirectory = join(projectDir, 'e2e', 'commands');
	const files = [];
	if (existsSync(commandsDirectory)) {
		files.push(...readdirSync(commandsDirectory).map(file => join(commandsDirectory, file)));
		return files.filter(file => /\w+\.js/.test(file));
	}
}

function requireWithOverride(moduleName, projectDir) {
	try {
		debug('Trying to load %s from %s', moduleName, projectDir);
		const moduleFile =  require.resolve(moduleName, { paths: [ projectDir ] });
		debug('Loading module %s from %s', moduleName, moduleFile);
		return require(moduleFile); // eslint-disable-line security/detect-non-literal-require
	} catch (e) {
		if (e.code === 'MODULE_NOT_FOUND') {
			debug('Trying to load %s from %s', moduleName, projectDir);
			const moduleFile = require.resolve(moduleName);
			debug('Loading module %s from %s', moduleName, moduleFile);
			return require(moduleFile); // eslint-disable-line security/detect-non-literal-require
		} else {
			// Rethrow if it's some other error
			throw e;
		}
	}
}

function getConfig(projectDir, platform) {
	const mainConfigFile = join(projectDir, 'e2e', 'config.json');
	const platformConfigFile = join(projectDir, 'e2e', platform, 'config.json');
	let config;

	if (existsSync(mainConfigFile)) {
		config = readJSONSync(mainConfigFile);
	}

	if (existsSync(platformConfigFile)) {
		// Allow stuff to be overriden by the platform configs
		Object.assign(config, readJSONSync(platformConfigFile));
	}

	return config;
}

function checkNodeVersion() {
	const pkg = readJSONSync(join(__dirname, '..', 'package.json'));
	const { engines } = pkg;
	const nodeVersion = process.versions.node;
	if (engines.node && !semver.satisfies(nodeVersion, engines.node)) {
		const err = new Error(`Unsupported node.js version: wanted: ${engines.node} (current: ${nodeVersion})`);
		err.code = 'ENOTSUPPORTED';
		throw err;
	}
}

module.exports = {
	checkNodeVersion,
	getCommands,
	getConfig,
	getTestFiles,
	requireWithOverride
};
