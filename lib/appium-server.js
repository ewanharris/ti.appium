const debug = require('debug')('tiappium:AppiumServer');
const fetch  = require('node-fetch');

const { existsSync } = require('fs');
const { join } = require('path');
const { spawn } = require('child_process');  // eslint-disable-line security/detect-child-process

let appiumStarted;

/**
 * Represents an Appium Server
 *
 * @class AppiumServer
 */
class AppiumServer {
	/**
	 * Creates an instance of AppiumServer.
	 *
	 * @param {Object} 	config - Various config settings.
	 * @param {Boolean} config.overrideAppium - Override the appium instance with a local one.
	 */
	constructor({ config }) {

		if (config.overrideAppium) {
			this.binary = this.resolveBinary(config.projectDir);
		} else {
			this.binary = this.resolveBinary(join(__dirname, '..'));
		}

		this.started = false;
	}

	/**
	 * Start the appium server.
	 *
	 * @param {Number} [port] -  Port to start the Appium server on.
	 */
	async start(port) {
		this.port = port || '4723';
		debug('Starting server on %s', this.port);

		this.spawnServer();

		await monitorOutput(this.appiumServer, 60000);
		this.started = true;
		appiumStarted = true;
	}

	/**
	 * Spawn the Appium process.
	 *
	 * @private
	 */
	spawnServer() {
		const args =  [ '-p', this.port ];
		debug('Starting appium with args %o', args);
		debug('Using appium binary at %s', this.binary);
		this.appiumServer = spawn(this.binary, args, { shell: true, detached: true });
	}

	/**
	 * Stop the Appium server.
	 */
	stop() {
		debug('Stopping server');
		if (process.platform === 'win32') {
			// TODO
		} else {
			this.appiumServer.kill();
		}
		this.started = false;
	}

	/**
	 * Look up the Appium binary located in node_modules relative to a directory
	 *
	 * @param {String} dir - Directory to look up the Appium binary relative to.
	 * @returns {String} - Path to the appium binary
	 * @private
	 */
	resolveBinary(dir) {
		const binaryPath = join(dir, 'node_modules', '.bin', 'appium');
		if (!existsSync(binaryPath)) {
			throw new Error(`Could not find the "appium" binary in ${dir}`);
		}
		return binaryPath;
	}
}

/**
 * Watch a spawned process for a specific string(s), resolving or rejecting a promise once seen. Or
 * erroring after a timeout if not seen.
 *
 * @param {any} proc Result of calling `child_process.spawn`.
 * @param {Number} timeout Length of time to wait for.
 * @returns {Promise}
 */
function monitorOutput (proc, timeout) {
	const successRegex = /listener started on/i;
	const errorRegex = /Error: listen/i;
	const alreadyRunningRegex = /Could not start REST http interface listener/i;
	let testingIfRunning = false;
	return new Promise((resolve, reject) => {
		const abortIt = setTimeout(() => {
			proc.kill();
			debug('Timed out waiting for %s'.successRegex);
			const err = new Error('Did not see debug before timeout elapsed');
			err.code = 'ETIMEDOUT';
			reject(err);
		}, timeout || 3000);
		proc.stdout.on('data', async (data) => {
			data = data.toString();
			!appiumStarted && debug(data);

			if (successRegex.test(data)) {
				clearTimeout(abortIt);
				debug('Saw success, resolving');
				resolve(true);
			}

			// Just incase wires get crossed
			if (errorRegex.test(data)) {
				clearTimeout(abortIt);
				const err = new Error('Saw error debug in output');
				err.code = 'ESPAWNFAILED';
				reject(err);
			} else if (alreadyRunningRegex.test(data)) {
				clearTimeout(abortIt);
				debug('Saw that server is already running attempting to determine if Appium server');
				try {
					const res = await fetch('http://0.0.0.0:4723/wd/hub/status');
					const json = await res.json();
					if (json.value && json.value.build && json.value.build.version) {
						debug('Server running on port looks like an appium server, here we go');
						resolve(true);
					} else {
						const err = new Error('Port is taken and it does not look like an appium server');
						err.code = 'EPORTINUSE';
						reject(err);
					}
				} catch (e) {
					const err = new Error('Port is taken and it does not look like an appium server');
					err.code = 'EPORTINUSE';
					reject(err);
				}
			}
		});

		proc.stderr.on('data', async (data) => {
			data = data.toString();
			!appiumStarted && debug(data);

			if (errorRegex.test(data) && !testingIfRunning) {
				clearTimeout(abortIt);
				const err = new Error('Saw error debug in output');
				err.code = 'ESPAWNFAILED';
				reject(err);
			} else if (alreadyRunningRegex.test(data)) {
				clearTimeout(abortIt);
				debug('Saw that server is already running attempting to determine if Appium server');
				testingIfRunning = true;
				try {
					const res = await fetch('http://0.0.0.0:4723/wd/hub/status');
					const json = await res.json();
					console.log(json);
					if (json.value && json.value.build && json.value.build.version) {
						debug('Server running on port looks like an appium server, here we go');
						resolve(true);
					} else {
						const err = new Error('Port is taken and it does not look like an appium server');
						err.code = 'EPORTINUSE';
						reject(err);
					}
				} catch (e) {
					const err = new Error('Port is taken and it does not look like an appium server');
					err.code = 'EPORTINUSE';
					reject(err);
				}
			}
		});
	});
}

module.exports =  AppiumServer;
