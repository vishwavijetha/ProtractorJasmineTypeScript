import { browser, element, by, protractor, ElementFinder, $$, $, Key } from 'protractor';
const EC = protractor.ExpectedConditions

export class LoginPage {
    async login(username: string, password: string) {
        await browser.get(browser.params.ui.envUrl)
        // await browser.wait(EC.visibilityOf(await element(by.id("txtUsername"))), 30000)
        await element(by.id("txtUsername")).sendKeys(browser.params.ui.username);
        await element(by.id("txtPassword")).sendKeys(browser.params.ui.password);
        await element(by.id("btnLogin")).click()
    }
}