import Crawler from './generic_crawler.js'

/**
 * Subclass for crawling the Qwant search engine.
 *
 * This subclass extends the base `Crawler` class to implement crawling specific to the Qwant search engine.
 *
 * @class Qwant_Crawler
 * @extends Crawler
 */
export default class Qwant_Crawler extends Crawler {

    /**
        * Create a new instance of the Qwant_Crawler.
        *    
        * @constructor
        * @param {string} query - The search query to be used for crawling.
    */
    constructor(query) {
        super(query)
        this.browser = "chrome"
        this.search_engine = "https://www.qwant.com/"
        this.search_input_id = "input[type='search']"
    }

    
    /**
         * Sets an empty results array for Qwant search.
         *
         * We do not extract search results for Qwant yet. It is not important for the current study.
     */
    async get_results(){
        this.results = []
    }

    /**
         * Retrieves and stores ads from Qwant search results.
         *
         * This method extracts advertisement information from Qwant search result elements
         * identified by the "div[data-testid='adResult']" attribute. For each ad element,
         * it retrieves the title, URL, description, and landing domain (if available). It
         * then stores this information in the `ads` array. Additionally, it selects the
         * first ad element to click on.
         *
         * @async
         * @function get_ads
         * @memberof Qwant_Crawler
         * @instance
     */
    async get_ads() {
        let ads = []
        let raw_ads = await this.page.$$("div[data-testid='adResult']")

        for (let i = 0; i < raw_ads.length; i++) {

            let element_top = await raw_ads[i].$("a")
            let element_title = await (await element_top.getProperty("textContent")).jsonValue()
            let element_url = await (await element_top.getProperty("href")).jsonValue()
            let element_body = await raw_ads[i].$("p")
    //        let element_description = await (await element_body.getProperty("textContent")).jsonValue()
    
            let element_description = ""
            let element_landing_domain = ""
            try {
                element_landing_domain = await (await (await raw_ads[i].$("span")).getProperty("textContent")).jsonValue()
            }
            catch(e) {
                console.log("couldn't get landing domain, continuing")
            }

            ads.push({
                "title" : element_title,
                "url" : element_url,
                "description" : element_description,
                "landing_url" : element_landing_domain    
            })

        }

        if (raw_ads.length > 0 ) {
            this.ad_to_click = await raw_ads[0].$("a")
        }
        this.ads = ads

    }

    /**
         * Sets an empty array for sidebar ads.
         *
         * We do not extract sidebar ads for Qwant as normal ads are frequently visible. 
         * 
     */
    async get_sidebar_ads() {
        this.sidebar_ads = []
    }

}
