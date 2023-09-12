import Crawler from './generic_crawler.js'

/**
 * Subclass for crawling the Google search engine.
 *
 * This subclass extends the base `Crawler` class to implement crawling specific to the Google search engine.
 *
 * @class Google_Crawler
 * @extends Crawler
 */
export default class Google_Crawler extends Crawler {
    
    /**
        * Create a new instance of the Google_Crawler.
        *    
        * @constructor
        * @param {string} query - The search query to be used for crawling.
    */
    constructor(query) {
        super(query)
        this.browser = "chrome"
        this.search_engine = "https://www.google.com/"
        this.search_input_id = "#sb_form_q"
        this.accept_button_id = "#L2AGLb"

    }

    /**
         * Retrieves the search input HTML element from the search engine page.
         *
         * This method locates and returns the HTML input element used for entering search queries on the search engine page.
         *
         * @returns {Puppeteer.ElementHandle | null} The HTML input element for entering search queries, or null if not found.
    */
    async get_search_input() {
        return await this.page.$("input")
    }

    /**
         * Retrieves information from a search result element.
         *
         * This method extracts relevant information from a given search result element.
         * It locates the anchor element within the element to retrieve the title and URL.
         * Additionally, it calls the `get_result_description` method to retrieve the description of the result.
         *
         * @param {ElementHandle} element - The search result element to retrieve information from.
         * @returns {Object} An object containing the extracted title, URL, and description.
     */
    async get_result_information(element) {
        let element_top = await element.$("a")
        let element_title = await (await element_top.getProperty("textContent")).jsonValue()
        let element_url = await (await element_top.getProperty("href")).jsonValue()
        let element_description = await this.get_result_description(element)

        return {
            "title" : element_title, 
            "url" : element_url,
            "description" : element_description
        }
    }
    
    /**
         * Retrieves the description of a search result element.
         *
         * This method attempts to locate and extract the description of a given search result element.
         * It looks for a specific div element with the attribute 'data-content-feature' set to '1', indicating the description section.
         * If found, the method retrieves the text content of the description element; otherwise, it returns an empty string.
         *
         * @param {ElementHandle} element - The search result element to retrieve the description from.
         * @returns {string} The description text or an empty string if not found.
     */
    async get_result_description(element) {
            
        let description_element = await element.$("div[data-content-feature='1']")

        if (description_element) {
            return await (await description_element.getProperty("textContent")).jsonValue()  
        }

        return ""
    }

    /**
         * Opens the web browser instance for Google search and handles any initial pop-ups.
         *
         * This method overrides the base class method to perform additional actions specific to Google search.
         * It opens the browser instance, waits for a brief period, locates and clicks on the acceptance button (if present)
         * to handle any initial pop-up prompts or notifications on the search engine page.
         *
     */
    async open_browser() {

        await super.open_browser()
        await new Promise(r => setTimeout(r, 2000));

        let accept_button = await this.page.$(this.accept_button_id)
        await accept_button.click()

    }

    /**
         * Extracts search results from the search engine page.
         *
         * This method identifies and extracts search results from the page by analyzing div elements with a specific attribute.
         * For each result element, the method retrieves its information using the `get_result_information` method and adds it to the `results` array.
         *
     */
    async get_results() {

        let results = []

        let raw_results = await (await this.page.$$("div[data-sokoban-container]"))

        for(let i=0; i<raw_results.length; i++) {

            results.push(await this.get_result_information(raw_results[i]))
     
        }
        this.results = results
    }

    /**
         * Extracts slide ads from the search engine page.
         *
         * This method identifies and extracts slide ads from the page by analyzing anchor elements (a elements) associated with slide ads.
         * If slide ads are found, their URLs are added to the `slide_ads` array. The first slide ad element is also selected as the `slide_ad_to_click`.
         *
    */
    async get_slide_ads() {
        let slide_ads = []
        let slide_ads_div = await this.page.$("#taw")
        
    
        if ((!slide_ads_div) || ((await (await slide_ads_div.getProperty("innerHTML")).jsonValue()).indexOf("Annonces") === -1)) {
            return
        }

        let slides = await slide_ads_div.$$("a.pla-unit-title-link")

        for (let i = 0; i<slides.length; i++) {
            slide_ads.push(await (await slides[i].getProperty("href")).jsonValue())

        }

        if(slides.length > 0) {
            this.slide_ad_to_click = slides[0]
        } 

        this.slide_ads = slide_ads

    }


    /**
         * Extracts ads from the search engine page.
         *
         * This method identifies and extracts ads from the page by analyzing anchor elements (a elements) and their attributes.
         * If the anchor element has attributes indicating it is an ad, the method adds information about the ad to the `ads` array.
         * Additionally, the method selects the first ad element to be clicked and sets it as `ad_to_click`.
         *
         * @async
         * @function get_ads
         * @memberof Bing_Crawler
         * @instance
     */
    async get_ads() {

        let ads = []
        let a_elements = await this.page.$$("a")

        let added = false

        for (let i=0; i < a_elements.length; i++) {
            let a_element = a_elements[i]

            let data_rw = await this.page.evaluate(el => el.getAttribute("data-rw"), a_element);

            let href = await (await a_element.getProperty("href")).jsonValue()


            if ((data_rw !== null)  && ((data_rw.indexOf("googleadservices.com") > 0) || (data_rw.indexOf("www.google.com/aclk") > 0))) {
                ads.push({
                    "url" : data_rw,
                    "title" : "",
                    "landing_url" : ""
                })
                if (added == false){
                    this.ad_to_click = a_element
                    added = true
                }

                continue
            }


            if ((href !== null)  && ((href.indexOf("googleadservices.com") > 0) || (href.indexOf("www.google.com/aclk") > 0))) {
                ads.push({
                    "url" : data_rw,
                    "title" : "",
                    "landing_url" : ""
                })
                if (added == false){
                    this.ad_to_click = a_element
                    added = true
                }
            }

        }
        this.ads = ads

    }


    /**
         * Resets the sidebar ads array to an empty state.
         *
         * We do not extract side_bar ads for Google as normal and slide ads are frequently displayed.
         * 
     */
    async get_sidebar_ads() {
        this.sidebar_ads = []
    }


}
