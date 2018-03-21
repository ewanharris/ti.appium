# ti.appium

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]


***Warning this project is purely for investigatory purposes in my own time, so please do not expect any advanced support other than being pointed to examples. However, if you do use it, awesome! :)***

This is a Titanium CLI hook, that abstracts away the need for managing appium, webdriver bindings etc (all the horrible bits) when doing UI automation. All you need to worry about is deciding your webdriver package, and writing your tests. 

- If you can think of any features that you'd like, file an issue. But there are no guarantees it would be implemented.
- If you find bugs, please file an issue, with as much information as you can.
- If you'd like to contribute, message me on [ti-slack](http://tislack.org/). 

## Usage

### Getting started

To get started:

1. Install the package using `[sudo] npm install -g @awam/ti.appium`
    - This will install the package for use
2. Run `tiappium-init-hook`
    - This will add the CLI hook into your Titanium config
3. Run `tiappium-init-project`(In a Titanium project root) 
	- This will copy across a basic template into your project.

### Writing tests

- You can choose from two webdriver implementations [wd](http://admc.io/wd/), and [webdriverio](http://webdriver.io/). You can specify which one to use in the main config file at `e2e/config.json`,  by setting the `driver` property to either `wd` or `webdriverio`
- There are currently two examples for the (standard Titanium template)[] and [KitchenSink-v2]()


### Running the tests

- Building with the `--appium` flag with make the tests run at the end of the build process, under the hood this will add the `--build-only` flag for you as we need to hand off the app to appium for installation.
- You will need to setup the desired targets for the platform in the platform specific config at `e2e/<platform>/config.json`, this will eventually become a CLI option too.
- It's not pretty, but yes you do need to run the build every time. Eventually I foresee a command that is solely designed to run the tests when you're just writing tests and not actually making edits to your app.

## Resources

[Appium site](http://appium.io/) - Look here for getting started tips, you do not need to install appium itself as it is contained in this package.
[appium-doctor](https://www.npmjs.com/package/appium-doctor) - Check if you're actually set up for doing this
 [wd](http://admc.io/wd/) - One of the possible binding choices
 [webdriverio](http://webdriver.io/) - The other binding choice

 ## Possible plans

This is just a brain dump of stuff that I'd like to try and implement, it should probably become GitHub issues.

- `ti appium` command that will only run the tests with the existing app.
- Maybe move the webdriver/appium packages out of the dependencies and into peerDependencies/the app
    - It takes forever to install this package (`added 1809 packages in 360.666s`....)
    - It's all overridable anyway

[npm-image]: https://img.shields.io/npm/v/@awam/ti.appium.svg
[npm-url]: https://npmjs.org/package/@awam/ti.appium
[downloads-image]: https://img.shields.io/npm/dm/@awam/ti.appium.svg
[downloads-url]: https://npmjs.org/package/@awam/ti.appium
