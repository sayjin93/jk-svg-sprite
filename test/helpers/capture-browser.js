import { chromium } from 'playwright-chromium';

let browser;

const getBrowser = () => {
  return browser;
};

const launchBrowser = async() => {
  const currentBrowserInstance = getBrowser();
  if (currentBrowserInstance) {
    return currentBrowserInstance;
  }

  browser = await chromium.launch();
  return browser;
};

const closeBrowser = async() => {
  const currentBrowserInstance = getBrowser();

  if (!currentBrowserInstance) {
    return;
  }

  await currentBrowserInstance.close();
};

export { launchBrowser, closeBrowser };
