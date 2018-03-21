const AppiumServer = require('../lib/appium-server');
const Driver = require('../lib/driver');
const {
	checkNodeVersion,
	getCommands,
	getConfig,
	getTestFiles,
	requireWithOverride
} = require('../lib/utils');

exports.id = 'com.awam.appiumplugin';

exports.cliVersion = '>=3.2';
let appiumServer;
exports.init = function (logger, config, cli) {
	let testConfig;
	let platform;
	let projectDir;

	cli.addHook('build.config', function (data, finished) {
		const r = data.result[1] || {};
		r.flags || (r.flags = {});
		r.flags['appium'] = {
			default: false,
			desc: 'enable appium e2e testing'
		};
		finished(null, data);
	});

	cli.addHook('build.pre.construct', function (data, finished) {
		if (cli.argv['appium']) {
			cli.argv['build-only'] = true;

			platform = cli.argv.platform || cli.argv.p;
			projectDir = cli.argv['project-dir'] || cli.argv.d;
			testConfig = getConfig(projectDir, platform);
			testConfig.projectDir = projectDir;

			appiumServer = new AppiumServer({ config: testConfig });
		}
		finished();
	});

	cli.addHook('build.finalize', async function (builder, finished) {
		if (cli.argv['appium']) {
			logger.info('TiAppium starting');
			try {
				checkNodeVersion();

				// Can we start this without blocking? Or, maybe do a
				// Promise.all for the server start and driver setup
				await appiumServer.start();

				const testFiles = getTestFiles(projectDir, platform);

				if (platform === 'ios') {
					testConfig.appium.app = builder.xcodeAppDir;
					testConfig.appium.platformName = 'iOS';
				} else if (platform === 'android') {
					testConfig.appium.app = builder.apkFile;
					testConfig.appium.platformName = 'Android';
				} else if (platform === 'windows') {
					// TODO:
					// 1. Need to either have the app accessible off builder
					//    or make pull in the code from ti.windows-remote-deployment
					// 2. Investigate the options needed
					// 3. Validate what's supported by appium, iirc only ws-local is
				}
				logger.debug('testConfig is %O', testConfig);

				// Setup the driver instance
				// TODO: testConfig.driver === 'custom' ?
				logger.debug(`Using driver type ${testConfig.driver}`);
				const driver = new Driver(testConfig);
				global.driver = await driver.init({ port: 4723, host: 'localhost', desiredCapabilities: testConfig.appium });
				const commands = getCommands(projectDir);
				for (const command of commands) {
					const com = require(command); // eslint-disable-line security/detect-non-literal-require
					logger.debug(`Loading command ${com.name} for ${platform}`);
					driver.addCommand(com, platform);
				}
				// Setup mocha instance
				// TODO: Allow overriding the mocha opts mocha object in main testConfig.json?
				// TODO: Could we speed up test writing by watching the e2e dir
				// and then restarting on change, rather than requiring a rebuild?
				const Mocha = requireWithOverride('mocha', projectDir);
				const mocha = new Mocha();
				for (const file of testFiles) {
					logger.debug(`Adding ${file} to mocha instance`);
					mocha.addFile(file);
				}
				mocha.run()
					.on('end', async () => {
						logger.info('Test finished, stopping appium server');
						await driver.quit();
						appiumServer.stop();
					});
			} catch (e) {
				logger.error(e);
				// TODO: Handle these to make nicer error logs
				switch (e.code) {
					case 'ETIMEDOUT':
						break;
					case 'ESPAWNFAILED':
						break;
					case 'ENOTSUPPORTED':
						break;
					default:
						break;
				}
				appiumServer.started && appiumServer.stop();
			}
		}
		finished();
	});
};
