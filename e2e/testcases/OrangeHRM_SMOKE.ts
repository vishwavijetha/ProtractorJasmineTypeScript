import { AssignLeavePage } from "../pages/AssignLeavePage"
import { browser } from "protractor"
import { LoginPage } from "../pages/LoginPage"

describe("Orange HRM Suite", () => {
    it("Assign Leave", async() => {
        let loginPage: LoginPage = new LoginPage()
        await loginPage.login(browser.params.ui.username, browser.params.ui.password)
        let assignLeavePage: AssignLeavePage = new AssignLeavePage()
        await assignLeavePage.assignLeave()
    })
})