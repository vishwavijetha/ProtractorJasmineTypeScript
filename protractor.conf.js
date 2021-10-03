// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

const CustomLogger = require('./e2e/utils/customLogger.ts')
const { SpecReporter } = require('jasmine-spec-reporter');
const ProtractorJasmineRetry = require('protractor-jasmine-retry');
const path = require('path');
const xmldoc = require('xmldoc');
const fs = require('fs-extra');
var HTMLReport = require('protractor-html-reporter-2');
var jasmineReporters = require('jasmine-reporters');
var today = new Date()
var timeStamp = today.getDate() + '-' + (Number(today.getMonth()) + 1) + '-' + today.getFullYear()
const reportDir = path.join(__dirname, './reports/' + timeStamp);

var browserName = 'chrome'
const screenshotsOnlyOnFailure = false;
const shardTestFiles = true;
const maxBrowserInstances = 1;
const rerunFailedSpecMaxAttempts = 0;

const chromeOptions = {
  //'debuggerAddress': 'localhost:55232',
  'excludeSwitches': ['enable-automation'],
  args: ['--no-sandbox', '--disable-infobars', '--disable-popup-blocking', 'start-maximized', '--disable-features=NetworkService',
    '--log-level=3', '--disable-extensions', '--disable-plugins', '--enable-webgl', '--disable-gpu', // '--ignore-ssl-errors',
    '--ignore-certificate-errors', '--disable-dev-shm-usage', '--window-size=1920,720', // '--incognito'
    // '--headless',
  ],
  prefs: {
    'download': {
      'prompt_for_download': false,
      'directory_upgrade': true,
      'default_directory': 'Downloads'
    }
  },
}

exports.config = {

  plugins: [
    // Re-run failed specs for 'maxAttempts' number of times
    ProtractorJasmineRetry({ maxAttempts: rerunFailedSpecMaxAttempts, resultPath: reportDir + '/failedSpecs' })
  ],
  allScriptsTimeout: 1800000,
  getPageTimeout: 180000,
  seleniumServerStartTimeout: 120000,

  params: {
    ui:
    {
      envUrl: 'https://opensource-demo.orangehrmlive.com',
      username: 'Admin',
      password: 'admin123',
    },
  },

  suites: {
    smoke: ['./**/**/*_SMOKE.ts'],
  },

  capabilities: {
    browserName: browserName,
    shardTestFiles: shardTestFiles,
    maxInstances: maxBrowserInstances,
    chromeOptions: chromeOptions,
  },

  verboseMultiSessions: false,
  directConnect: true,
  SELENIUM_PROMISE_MANAGER: false,
  //seleniumAddress:'http://localhost:4444/wd/hub',
  framework: 'jasmine2',
  resultJsonOutputFile: 'junitResults.json',
  jasmineNodeOpts: {
    random: false,
    showColors: true,
    defaultTimeoutInterval: 1800000,
    print: function () { }
  },

  beforeLaunch: async function () {
    require('ts-node').register({
      project: './tsconfig.e2e.json'
    });
  },

  onPrepare: async function () {
    require('ts-node').register({
      project: './tsconfig.e2e.json'
    });

    browser.waitForAngularEnabled(false);
    fs.mkdirSync(reportDir + '/htmlReports/screenshots/', { recursive: true }, err => { });
    fs.mkdirSync(reportDir + '/xmlReports', { recursive: true }, err => { });

    jasmine.getEnv().addReporter(terminalReporter);

    jasmine.getEnv().addReporter(new SpecReporter(
      {
        spec: {
          displayStacktrace: false,
          displayErrorMessages: true,
          displayDuration: true,
          displayFailed: true,
          displaySuccessful: true
        },
        summary: {
          displayDuration: true,
          displayFailed: true,
          displaySuccessful: true
        }
      }
    ));

    jasmine.getEnv().addReporter({
      specDone: async function (result) {
        if (result.status === 'failed' || result.status === 'passed') {
          browser.getCapabilities().then(async function (caps) {
            var browserName = caps.get('browserName');
            await browser.takeScreenshot().then(function (png) {
              var stream = fs.createWriteStream(reportDir + '/htmlReports/screenshots/' + browserName + '-' + result.fullName + '.png')
              stream.write(new Buffer.from(png, 'base64'));
              stream.end();
            }).catch((err) => { });
          });
        }
      }
    });

    return browser.getProcessedConfig().then((config) => {
      jasmine.getEnv().addReporter(new jasmineReporters.JUnitXmlReporter({
        consolidateAll: true,
        savePath: reportDir + '/xmlReports',
        filePrefix: 'spec-' + path.basename(config.specs[0], '.ts')
      }));

    })
  },

  afterLaunch: async (exitCode) => {
    return ProtractorJasmineRetry.afterLaunch(exitCode)
  },

  onComplete: async function () {
    await generateHTMLReport()
  }
};

var generateHTMLReport = async function () {
  const files = fs.readdirSync(reportDir + '/xmlReports').filter(fn => fn.startsWith('spec'));
  let disabledSum = 0;
  let errorsSum = 0;
  let failuresSum = 0;
  let testsSum = 0;
  let timeSum = 0;
  const allTestSuiteNodes = [];
  for (const file of files) {
    const pathToXml = reportDir + '/xmlReports/' + file;
    const xml = fs.readFileSync(pathToXml);
    const xmlDoc = new xmldoc.XmlDocument(xml);
    const disabled = parseInt(xmlDoc.attr.disabled);
    const errors = parseInt(xmlDoc.attr.errors);
    const failures = parseInt(xmlDoc.attr.failures);
    const tests = parseInt(xmlDoc.attr.tests);
    const time = parseFloat(xmlDoc.attr.time);
    // const timeStamp = (xmlDoc.firstChild.attr.timestamp)
    disabledSum += disabled;
    errorsSum += errors;
    failuresSum += failures;
    testsSum += tests;
    timeSum += time;
    const testSuiteNodes = xmlDoc.childrenNamed('testsuite');
    allTestSuiteNodes.push(testSuiteNodes);
    console.log(delimiter + '\nReading Spec xml report file: ' + pathToXml.substring(pathToXml.lastIndexOf('spec')) + ' -----> ' + (failures > 0 ? 'FAILED' : 'passed') + '\n' + delimiter);
  }

  let startXml = `<?xml version="1.0" encoding="UTF-8" ?>`;
  startXml += `<testsuites disabled="` + disabledSum + `" errors="` + errorsSum + `" failures="` + failuresSum + `" tests="` + testsSum + `" time="` + timeSum + `">`;
  const endXml = '</testsuites>';
  allTestSuiteNodes.push(endXml);
  const finalXml = startXml + allTestSuiteNodes.join('\n');
  fs.writeFileSync(reportDir + '/xmlReports/consolidatedXMLResults.xml', finalXml, 'utf8');

  var browserName, browserVersion, platform;
  var capsPromise = browser.getCapabilities();
  capsPromise.then(async function (caps) {
    browserName = caps.get('browserName');
    browserVersion = caps.get('version');
    platform = caps.get('platform');

    testConfig = {
      reportTitle: 'Protractor Automation Test Execution Report',
      outputPath: reportDir + '/htmlReports',
      outputFilename: 'Protractor Test Execution Report',
      screenshotPath: 'screenshots',
      testBrowser: browserName,
      browserVersion: browserVersion,
      modifiedSuiteName: false,
      screenshotsOnlyOnFailure: screenshotsOnlyOnFailure,
      testPlatform: platform
    };
    new HTMLReport().from(reportDir + '/xmlReports/consolidatedXMLResults.xml', testConfig)
  });
}

var terminalReporter = {

  jasmineStarted: async function (suiteInfo) {
    CustomLogger.logger.info(delimiter);
    CustomLogger.logger.info('Running TestSuite with total TestCases defined --> ' + suiteInfo.totalSpecsDefined);
    CustomLogger.logger.info(delimiter);
  },

  suiteStarted: function (result) {
    CustomLogger.logger.info(delimiter);
    CustomLogger.logger.info('TestSuite started: ' + result.fullName);
    CustomLogger.logger.info(delimiter);
  },

  specStarted: function (result) {
    CustomLogger.logger.info(delimiter);
    CustomLogger.logger.info('TestCase started: ' + result.description);
    CustomLogger.logger.info(delimiter);
  },

  specDone: function (result) {
    CustomLogger.logger.info(delimiter);
    if (result.status === 'passed') {
      CustomLogger.logger.info((result.status).toUpperCase() + ' :---> ' + result.description);
      CustomLogger.logger.info('Total Passed expectations --> ' + result.passedExpectations.length);
    } else if (result.status === 'pending') {
      CustomLogger.logger.alert((result.status).toUpperCase() + ' :---> ' + result.description);
      CustomLogger.logger.alert('Total Passed expectations --> ' + result.passedExpectations.length);
    } else {
      CustomLogger.logger.error((result.status).toUpperCase() + ' :---> ' + result.description);
      CustomLogger.logger.error('Total Passed expectations --> ' + result.passedExpectations.length);
      CustomLogger.logger.error('Total Failed expectations --> ' + result.failedExpectations.length);
    }

    for (var i = 0; i < result.failedExpectations.length; i++) {
      CustomLogger.logger.error('Failed expectation ' + (i + 1) + ': ' + result.failedExpectations[i].message);
      // CustomLogger.logger.error('Spec Failed expectations --> ' + result.failedExpectations[i].stack);
    }
    CustomLogger.logger.info(delimiter);
  },

  suiteDone: function (result) {
    CustomLogger.logger.info(delimiter);
    CustomLogger.logger.info('TestSuite completed: ' + result.description + ' was ' + result.status);
    for (var i = 0; i < result.failedExpectations.length; i++) {
      CustomLogger.logger.error('TestSuite Failures: ' + result.failedExpectations[i].message);
      // CustomLogger.logger.error('Suite Failed expectations --> ' + result.failedExpectations[i].stack);
    }
    CustomLogger.logger.info(delimiter);
  },

  jasmineDone: function (result) {
  }
};

var delimiter = '----------------------------------------------------------------------------------------------------------------'
