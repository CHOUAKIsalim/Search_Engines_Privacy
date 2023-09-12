import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth"
puppeteer.use(StealthPlugin())



let drivers_by_browsers = {
    "chrome" : "drivers/chromedriver",
    "brave" : "drivers/chromedriver",
    "edge" : "drivers/msedgedriver"
}

/**
 * The `Crawler` class serves as a generic foundation for creating web crawlers specific to various search engines.
 * It encapsulates common functionalities and outlines abstract methods that should be implemented by its subclasses.
 *
 * @class Crawler
 */

export default class Crawler {

    /**
         * Creates an instance of the `Crawler` class.
         * This constructor should not be directly instantiated as it's meant to be inherited from.
         * Initializes the Puppeteer instance, sets query, and initializes clicked URL properties.
         *
         * @constructor
         * @param {string} query - The search query for the crawler.
     */
    constructor(query) {
        this.puppeteer = puppeteer
        this.query = query
        this.slide_ads = []
        this.clicking_time = 0
        this.clicked_url = ""
    }


    /**
         * Get the result object containing various data from the web crawling process.
         *
         * @returns The result object containing crawling data.
         * @property {string} query - The search query used for crawling.
         * @property {Array<Object>} searchResults - An array of search result objects.
         * @property {Array<Object>} searchAds - An array of search ad objects.
         * @property {Array<Object>} sideBarAds - An array of search sidebar ad objects.
         * @property {string} rawHTML - The raw HTML body of the crawled page.
         * @property {Array<Object>} networkRequests - An array of network requests made during crawling.
         * @property {Array<Object>} slideAds - An array of slide ad objects.
         * @property {timestamp} adClickTime - The time delay for clicking on ads (in milliseconds).
         * @property {string} clickedURL - The URL accessed after clicking on an ad.
    */
    get_result_object() { 
        return {
            "query" : this.query,
            "results" : this.results,
            "ads" : this.ads,
            "side_bar_ads" : this.sidebar_ads,
            "raw_body" : this.body,
            "requests" : this.requests,
            "slide_ads":  this.slide_ads,
            "clicking_time" : this.clicking_time,
            "clicked_url" : this.clicked_url
        }

    }

    /**
         * Get the options and properties used for creating a web driver instance with Puppeteer.
         *
         * @returns {Object} The options for the web driver instance.
         * @property {boolean} headless - Whether to run the browser in headless mode.
         * @property {Array<string>} args - Additional command-line arguments for the browser.
         * @property {Array<string>} ignoreDefaultArgs - Command-line arguments to ignore.
     */
    get_driver_options() { 
        return {
            "headless" : true, 
            "args" : ["--no-sandbox"],
            "args": ['--start-maximized', `--window-size=1920,1080`], 
            "ignoreDefaultArgs": ["--enable-automation"]
        }
    } 


    /**
         * Opens a browser instance and initializes a search engine page.
         *
         * This function determines the browser type based on the specified browser option and creates
         * an appropriate driver instance. It then sets the created driver to the instance's `driver` property
         * and initializes the search engine page by calling the `open_search_engine_page` function.
         *
    */
    async open_browser() { 
        
        let driver = undefined;
        if (this.browser == "chrome")
            driver = await this.create_chrome_driver()

        else if (this.browser == "edge")
            driver = this.create_edge_driver()

        else if (this.browser == "brave")
            driver = this.create_brave_driver()

        this.driver = driver
        this.page = await this.open_search_engine_page()        
    }

    /**
         * Closes the browser instance.
     */
    async close_browser() {
        await this.driver.close()
    }

    /**
         * Starts tracing network requests on a the crawler instance.
         *
         * This function enables request interception on the provided page and attaches event listeners
         * to capture information about requests and their responses. It populates the `requests` array
         * with detailed information about each intercepted request, including headers, response status,
         * timestamps, and more.
         *
         * @param {Puppeteer.Page} page - The page instance on which to start tracing network requests.
    */
    async start_tracing(page) {
        this.requests = []

        await page.setRequestInterception(true);

        page.on('request', (request) => {
            request["timestamp"] = (new Date()).getTime()
            request.continue()
        })

        page.on('requestfinished', async (request) => {

            const response = await request.response();
            const responseHeaders = response.headers();
                             
            let chain = request.redirectChain()
            let redirectChain = []

            for (var index = 0; index < chain.length; index ++) {
                redirectChain.push({
                    "url" : chain[index].url(),
                    "interceptionId" : chain[index]._interceptionId,
                    "requestId" : chain[index]._requestId
                })
            }

            let responseStatus = await response.status()
            let responseText;

            if (responseStatus == 200) {
                try {
                    responseText = await response.text()
                }
                catch{
                    responseText = ""
                }
            }
            
            this.requests.push({
              url: request.url(),
              requestHeaders: request.headers(),
              responseHeaders: responseHeaders,
              status : responseStatus,
              interceptionId : request._interceptionId,
              requestId : request._requestId,
              timestamp : request.timestamp,
              method : request.method(),
              redirectChain : redirectChain,
              responseText : responseText == ""
            })


        })
        
    }

    /**
         * Opens the search engine page using a new page instance.
         *
         * This function creates a new page instance using the crawler's driver, navigates to the specified
         * search engine URL (`this.search_engine`), and returns the page instance.
         * If an error occurs during the process, it logs the exception and returns `undefined`.
         *
         * @returns {Promise<?Puppeteer.Page>} The opened search engine page or `undefined` if an error occurs.
     */
    async open_search_engine_page() {
        try {
            let page = await this.driver.newPage()
            await this.start_tracing(page)
            await page.goto(this.search_engine)
            return page    

        }
        catch(e) {
            console.log("exception\n", e)
            return undefined
        }
    }

    /**
         * Creates a Chrome browser driver instance with specified options.
         *
         * This function creates a Chrome browser driver instance using the provided options
         * obtained from the `get_driver_options` function.
         *
         * @returns {Promise<Puppeteer.Browser>} The created Chrome browser driver instance.
     */
    async create_chrome_driver(){ 
        let options = this.get_driver_options()
        let browser = await this.puppeteer.launch(options)
        return browser
    }

    /**
         * Searches for the specified query on the search engine page.
         *
         * This function performs a search for the given query on the search engine page.
         * It types the query into the search input, presses the 'Enter' key, waits for a short delay,
         * captures the inner HTML of the page's body, and assigns it to the crawler's `body` property.
         *
         * @param {string} [query=undefined] - The search query to perform.
         * @throws {Error} If an error occurs during the search process.
     */
    async search_query(query = undefined){

        if (query !== undefined)
            this.query = query

        try {
            let search_input = await this.get_search_input()

            await search_input.type(this.query)

            await search_input.press('Enter');

            await new Promise(r => setTimeout(r, 2000));

            let body = await this.page.$("body")

            let body_html = await body.getProperty("innerHTML")

            let text_body_html = await body_html.jsonValue()

            this.body = text_body_html


        }
        catch (e){
            console.log("exception\n", e)
        }

    }

    /**
         * Returns the HTML element representing the search input on the search engine page.
         *
         * This function retrieves the HTML element representing the search input field on the search engine page
         * using the provided selector (`this.search_input_id`).
         *
         * @returns {Promise<?ElementHandle>} The ElementHandle representing the search input, or `null` if not found.
     */
    async get_search_input() {
        return await this.page.$(this.search_input_id)
    }

    /**
         * Extracts results from the search results page.
         *
         * This function is meant to be implemented in subclasses, for each search engine, to extract results from the search results page.
         * It throws an error indicating that the method must be implemented and logs an exception message.
         *
         * @throws {Error} Always throws an error indicating that the method must be implemented.
     */
    async get_results(){
        try {
            throw new Error('Method must be implemented.')

        }
        catch (e) {
            console.log("exception\n", e)
        }
    }

    /**
         * Extracts ads from the search results page.
         *
         * This function is meant to be implemented in subclasses, for each search engine, to extract ads from the search results page.
         * It throws an error indicating that the method must be implemented and logs an exception message.
         *
         * @throws {Error} Always throws an error indicating that the method must be implemented.
     */
    async get_ads(){
        try {
            throw new Error('Method must be implemented.')

        }
        catch (e) {
            console.log("exception\n", e)
        }
    }

    /**
         * Extracts sidebar ads from the search results page.
         *
         * This function is meant to be implemented in subclasses, for each search engine, to extract sidebar ads from the search results page.
         * It throws an error indicating that the method must be implemented and logs an exception message.
         *
         * @throws {Error} Always throws an error indicating that the method must be implemented.
     */
    async get_sidebar_ads(){
        try {
            throw new Error('Method must be implemented.')
        }
        catch (e) {
            console.log("exception\n", e)
        }
    }

    /**
         * Takes a screenshot of the current page and saves it with the specified image name.
         *
         * This function captures a screenshot of the current page using Puppeteer's `page.screenshot` method
         * and saves it to the specified image file.
         *
         * @param {string} img_name - The name of the image file to save the screenshot.
     */
    async take_screenshot(img_name) {
        await this.page.screenshot({path: img_name})
    }

    /**
         * Clicks on the specified ad object obtained from the `get_ad_to_click` function.
         *
         * This function clicks on the first available ad returned by the `get_ad_to_click` function.
         * If no suitable ad is found, it logs a message indicating that no ad is available for the query.
         *
    */
    async click_on_first_ad(){

        let element_to_click = this.get_ad_to_click()
        if (element_to_click === undefined) {
            console.log("no ad for ", this.query)
            return
        }
        
        this.clicking_time = (new Date()).getTime()
        let url_to_click = this.ads[0]["url"]
        this.clicked_url = url_to_click
       // this.page.goto(url_to_click)
        await this.page.evaluate(el => el.target = "", element_to_click)
        await element_to_click.click()
        await new Promise(r => setTimeout(r, 2000));        
    }

    /**
         * Determines the ad object on which the crawler should click.
         *
         * This function evaluates the available ad options and selects an ad object for the crawler to click on.
         * It first checks if there are regular search ads, and if none are present, it considers slide ads.
         * If neither regular ads nor slide ads are available, it returns `undefined`.
         *
         * @instance
         * @returns {Object|undefined} The ad object to click on, or `undefined` if no suitable ad is found.
    */
    get_ad_to_click() {

        if ((!this.ads) || (this.ads.length== 0)) {

            if ((!this.slide_ads) || (this.slide_ads.length== 0)) {
                return undefined                   
            } 
            else {
                return this.slide_ad_to_click
            }
        }
        else {
            return this.ad_to_click
        }

    }

    /**
         * Handles the web crawling process for a specific query.
         *
         * This function goes through the entire crawling process, including opening a browser instance,
         * searching for the query, capturing screenshots, extracting search results, ads, and sidebar ads,
         * clicking on an ad and accessing the landing URL, waiting, closing the browser, and returning
         * the result of the crawling.
         *
         * @param {string} [query=undefined] - The search query to be crawled.
         * @throws {Error} If any step in the crawling process encounters an error.
         * @returns {Promise<Object>} The result object containing crawling data.
    */
    async handle_query(query = undefined) {
        await this.open_browser()
        await new Promise(r => setTimeout(r, 5000));        
        await this.search_query() 
        await new Promise(r => setTimeout(r, 3000));  
        await this.take_screenshot("screenshots/"+ this.constructor.name + "/" + this.query+".png")
        await this.get_results()
        await this.get_ads()
        await this.get_sidebar_ads()
        await this.click_on_first_ad()
        await new Promise(r => setTimeout(r, 15000));     
        await this.close_browser()
        return this.get_result_object()
    }
}



