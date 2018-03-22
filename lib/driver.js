
const { requireWithOverride } = require('./utils');

const supportedDrivers = [ 'wd', 'webdriverio' ];
let driverPackage;

/**
 * Helper class designed to normalize the interactions with different webdriver bindings
 *
 * @class Driver
 */
class Driver {

	/**
	 * Creates an instance of Driver.
	 * @param {Object} config - Config object.
	 * @param {String} config.driver - The type of driver to use, valid options are "wd" and "webdriverio"
	 * @param {Stirng} config.projectDir - The directory of the Titanium project.
	 * @memberof Driver
	 */
	constructor(config) {

		if (!supportedDrivers.includes(config.driver)) {
			throw new Error(`Unsupported driver type ${config.driver}`);
		}
		this.type = config.driver;
		driverPackage = requireWithOverride(this.type, config.projectDir);
		this.driver = null;
	}

	/**
	 * Add a command to the driver.
	 *
	 * @param {Object} command - Object representing the command to add.
	 * @param {String} [command.type] - Type of command to add, only valid when driver is "wd".
	 * @param {String} command.name - The name of the command.
	 * @param {Function} [command.android] - The Android implementation for the command. Required when platform is Android
	 * @param {Function} [command.ios] - The iOS implementation of the command. Required when platform is iOS.
	 * @param {String} platform - The platform the tests are currently being ran on.
	 * @memberof Driver
	 */
	addCommand(command, platform) {
		if (this.type === 'wd') {
			// TODO: There's another two types here, should add them
			switch (command.type) {
				case 'promiseChain':
					driverPackage.addPromiseChainMethod(command.name, command[platform]);
					break;
			}
		} else if (this.type === 'webdriverio') {
			driverPackage.addCommand(command.name, command[platform]);
		}
	}

	/**
	 * Close the driver instance.
	 *
	 * @memberof Driver
	 */
	async quit() {
		if (this.type === 'wd') {
			await this.driver.quit();
		} else if (this.type === 'webdriverio') {
			await this.driver.end();

		}
	}

	/**
	 * Init the driver instance.
	 *
	 * @param {Object} opts - Various option;
	 * @param {String} [opts.host] - The host to start the server on. Only required when driver is "wd".
	 * @param {Number|String} opt.sport - The port to listen on.
	 * @param {Object} desiredCapabilities - Desired capabilities to pass to the driver.
	 * @memberof Driver
	 */
	async init({ host, port, desiredCapabilities }) {
		// It's generally bad to be assigning the globals here, and I really don't like it
		// but returning the webdriverio instance from here just doesn't play nice
		if (this.type === 'wd') {
			this.driver = driverPackage.promiseChainRemote({ host, port });
			await this.driver.init(desiredCapabilities);
			global.wd = driverPackage;
			global.driver = this.driver;
		} else if (this.type === 'webdriverio') {
			this.driver = driverPackage.remote({ port, desiredCapabilities });
			global.driver = this.driver;
			await global.driver.init();
		}
	}
}

module.exports = Driver;
