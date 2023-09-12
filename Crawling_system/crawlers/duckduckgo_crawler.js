import Crawler from './generic_crawler.js'

/**
 * Subclass for crawling the DuckDuckGo search engine.
 *
 * This subclass extends the base `Crawler` class to implement crawling specific to the DuckDuckGo search engine.
 *
 * @class DuckDuckGo_Crawler
 * @extends Crawler
 */
export default class DuckDuckGo_Crawler extends Crawler {

    /**
        * Create a new instance of the DuckDuckGo_Crawler.
        *    
        * @constructor
        * @param {string} query - The search query to be used for crawling.
    */
    constructor(query) {
        super(query)
        this.browser = "chrome"
        this.search_engine = "https://duckduckgo.com/"
//        this.search_input_id = "#search_form_input_homepage"
        this.search_input_id = "#searchbox_input"
        this.description_class = ".OgdwYG6KE2qthn9XQWFC"
    }

    /**
         * Extracts information from a search result element.
         *
         * This method extracts and returns information about a search result element, such as its title, URL,
         * description, and potentially a landing URL. It uses the provided `element` parameter to locate and
         * capture the relevant information from the search result.
         *
         * @param {Puppeteer.ElementHandle} element - The element representing a search result.
         * @param {boolean} [get_landing_domain=false] - Whether to include the landing domain.
         * @returns {Object} An object containing title, URL, description, and landing URL (if available).
     */    
    async get_element_information(element, get_landing_domain = false) {
        let element_top = await element.$("a[data-testid='result-title-a']")
        let element_title =  await (await element_top.getProperty("textContent")).jsonValue()
        let element_url = await (await element_top.getProperty("href")).jsonValue()

        let element_body = await element.$(this.description_class)
        let element_description = await (await element_body.getProperty("textContent")).jsonValue()

        let element_landing_domain = ""
        if (get_landing_domain) {
            try {
                element_landing_domain = await (await (await element.$("a[data-testid='result-extras-url-link']")).getProperty("textContent")).jsonValue()
            }
            catch(e) {
                console.log("couldn't get landing domain, continuing")
            }
        }

        return {
            "title" : element_title,
            "url" : element_url,
            "description" : element_description,
            "landing_url" : element_landing_domain
        }
    }


    /**
         * Extracts search results from the DuckDuckGo search results page.
         *
         * This method extracts information about search results, including their title, URL, description,
         * and potentially a landing URL. It identifies search results based on their data-testid attribute
         * and populates the `results` array with the extracted information.
         *
     */
    async get_results(){

        let results = []
        let raw_results = await (await this.page.$("#react-layout")).$$("article[data-testid='result']")
        
        for (let i = 0; i < raw_results.length; i++) {
            results.push(await this.get_element_information(raw_results[i]))
        }

        this.results = results
    }

    /**
         * Extracts ads from the DuckDuckGo search results page.
         *
         * This method extracts information about sidebar ads, including their title, URL, description,
         * and landing URL. It identifies ads based on their data-testid attribute and populates the `ads` array.
         * The method also selects the first ad to be clicked based on the `result-title-a` attribute.
         *
    */
    async get_ads() {
        let ads = []
        let raw_ads = await (await this.page.$("#react-layout")).$$("article[data-testid='ad']")

        for (let i = 0; i < raw_ads.length; i++) {
            ads.push(await this.get_element_information(raw_ads[i], true))
        }

        if (raw_ads.length > 0 ) {
            this.ad_to_click = await raw_ads[0].$("a[data-testid='result-title-a']")
        }

        this.ads = ads

    }


    /**
         * Extracts sidebar ads from the DuckDuckGo search results page.
         *
         * This method extracts information about sidebar ads, including their title, URL, description, and landing URL.
         * It identifies sidebar ads based on their data-testid attribute and populates the `sidebar_ads` array.
         *
     */
    async get_sidebar_ads() {
/**        let sidebar_ads = []
        let raw_sidebar_ads = await (await this.page.$("#ads")).$$("article[data-testid='ad']")

        for (let i = 0; i < raw_sidebar_ads.length; i++) {
            sidebar_ads.push(await this.get_element_information(raw_sidebar_ads[i]))
        }

        if (raw_sidebar_ads.length > 0 ) {
            this.sidebar_ads = await raw_sidebar_ads[0].$("a[data-testid='result-title-a']")
        }


        this.sidebar_ads = sidebar_ads
     */
        this.sidebar_ads = []

    }

}
