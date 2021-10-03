import { browser, element, by, protractor, ElementFinder, $$, $, Key } from 'protractor';

export class AssignLeavePage {
    async assignLeave() {
        browser.sleep(10000)
        await element(by.xpath("//span[.='Assign Leave']")).click()
        await element(by.id("assignleave_txtEmployee_empName")).sendKeys("Joe Root" + Key.TAB)
        await element(by.id("assignleave_txtLeaveType")).click()
        await element(by.xpath("(//select[@id='assignleave_txtLeaveType']/option)[2]")).click()
        await element(by.id("assignleave_txtFromDate")).clear()
        await element(by.id("assignleave_txtFromDate")).sendKeys("2021-10-03")
        await element(by.id("assignBtn")).click()
        await element(by.xpath("//a[@id='menu_dashboard_index']")).click()
    }
}