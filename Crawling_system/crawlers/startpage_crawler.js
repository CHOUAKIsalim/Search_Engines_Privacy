import Crawler from './generic_crawler.js'

/**
 * Subclass for crawling the StartPage search engine.
 *
 * This subclass extends the base `Crawler` class to implement crawling specific to the StartPage search engine.
 *
 * @class StartPage_Crawler
 * @extends Crawler
 */
export default class StartPage_Crawler extends Crawler {
 
    /**
        * Create a new instance of the StartPage_Crawler.
        *    
        * @constructor
        * @param {string} query - The search query to be used for crawling.
    */
    constructor(query) {
        super(query)
        this.browser = "chrome"
        this.search_engine = "https://www.startpage.com/"
        this.search_input_id = "#q"

    }

    /**
     * Extracts search results from the Startpage search engine results page.
     *
     * This method locates the elements containing search result information,
     * including titles, URLs, and descriptions. It then iterates through these elements
     * and extracts the relevant information for each search result. The extracted
     * information is stored in the `results` property of the class.
     */
    async get_results() {
        let results = []
        let raw_results = await this.page.$$(".w-gl__result__main")

        for (let i=0; i<raw_results.length; i++) {
            let result_top_element = await raw_results[i].$(".w-gl__result-title")
            let result_title =  await (await result_top_element.getProperty("textContent")).jsonValue()
            let result_url = await (await result_top_element.getProperty("href")).jsonValue()

            let result_body_element = await raw_results[i].$(".w-gl__description")
            let result_description =  await (await result_body_element.getProperty("textContent")).jsonValue()

            results.push({
                "title" : result_title,
                "url" : result_url,
                "description" : result_description
            })
        }

        this.results = results
    }

    /**
         * Extracts ads from the search results page.
         *
         * This method identifies and retrieves the iframe containing sponsored ads,
         * then iterates through the ad elements within the iframe to extract ad information.
         * For each ad, it extracts the title, URL, description, and landing URL if available.
         * The method populates the `ads` property with the extracted ad information.
         * It also sets the `ad_to_click` property to the first ad's title element for future clicking.
         *
     */
    async get_ads() {


        let ads_iframe =  await this.page.$x(".//iframe[contains(@title, 'Sponsored Links')]")

        if (ads_iframe.length == 0) {
            this.ads = []
            return
        }

        ads_iframe = ads_iframe[0]
        ads_iframe = await ads_iframe.contentFrame()

        let ads = []
        let raw_ads = await ads_iframe.$$(".si101")

        for (let i=0; i<raw_ads.length; i++) {

            let ad_title_element = await raw_ads[i].$(".si27")
            let ad_title = await (await ad_title_element.getProperty("textContent")).jsonValue()
            let ad_url = await (await ad_title_element.getProperty("href")).jsonValue()

            let ad_body_element = await raw_ads[i].$(".si29")
            let ad_description = await (await ad_body_element.getProperty("textContent")).jsonValue()

            let result_landing_url = ""

            try {
                result_landing_url = await (await (await raw_ads[i].$(".si28")).getProperty("textContent")).jsonValue()
            }
            catch(e) {
                console.log("couldn't get landing domain, continuing")
            }

            ads.push({
                "title" : ad_title,
                "url": ad_url,
                "description": ad_description,
                "landing_url" : result_landing_url
            })

            if (i===0) {
                this.ad_to_click = ad_title_element

            }
    
        }

        this.ads = ads

    }

    /**
         * Sets an empty array for sidebar ads.
         *
         * We do not extract sidebar ads for Startpage as normal ads are frequently visible. 
         * 
     */
    async get_sidebar_ads() {
        this.sidebar_ads = []
    }


    /**
         * Clicks on the first ad identified for the current query.
         *
         * This method retrieves the ad element to click on using the `get_ad_to_click` method.
         * If an ad element is found, it records the clicking time and the URL of the clicked ad.
         * The method then navigates to the ad's URL using Puppeteer's `page.goto` function
         * and waits for 2 seconds.
         *
     */
    async click_on_first_ad(){

        let element_to_click = this.get_ad_to_click()

        if (element_to_click === undefined) {
            console.log("no ad for ", this.query)
            return
        }

        this.clicking_time = (new Date()).getTime()
        this.clicked_url = await (await element_to_click.getProperty("href")).jsonValue()

        await this.page.goto(this.clicked_url)
        await new Promise(r => setTimeout(r, 2000));        

    }

}
