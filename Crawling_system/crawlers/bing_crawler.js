import Crawler from './generic_crawler.js'

/**
 * Subclass for crawling the Bing search engine.
 *
 * This subclass extends the base `Crawler` class to implement crawling specific to the Bing search engine.
 *
 * @class Bing_Crawler
 * @extends Crawler
 */

export default class Bing_Crawler extends Crawler {

    /**
        * Create a new instance of the Bing_Crawler.
        *    
        * @constructor
        * @param {string} query - The search query to be used for crawling.
    */
    constructor(query) {
        super(query)
        this.browser = "chrome"
        this.search_engine = "https://www.bing.com/"
        this.search_input_id = "#sb_form_q"
        this.accept_button_id = "#bnp_btn_accept"

    }

  /**
   * Opens the browser instance and initializes the Bing search engine page.
   *
   * This function extends the base `open_browser` method by additionally clicking an accept button.
   *
   */
    async open_browser() {

        await super.open_browser()
        await new Promise(r => setTimeout(r, 2000));

        let accept_button = await this.page.$(this.accept_button_id)
        await accept_button.click()

    }


    /**
         * Extracts the description from a search result HTML object.
         *
         * This method attempts to extract and return the description text from a search result HTML object.
         * It searches for relevant elements such as <p> tags or specific class names that may contain
         * the description text. If no description is found, an empty string is returned.
         *
         * @param {Puppeteer.ElementHandle} html_object - The HTML object representing a search result.
         * @returns {string} The extracted description text or an empty string if not found.
     */
    async get_description(html_object) {

        let description_element = await html_object.$("p")
        if (description_element)
            return await (await description_element.getProperty("textContent")).jsonValue()
            
        description_element = await html_object.$(".b_rcSnippetGoBig")
        
        if (description_element)
            return await (await description_element.getProperty("textContent")).jsonValue()
    
        return ""
    
    }
     
    /**
         * Extracts information from a search result element.
         *
         * This method extracts and returns information about a search result element, such as its title, URL,
         * description, and potentially a landing URL. It uses the provided `element` parameter to locate and
         * capture the relevant information from the search result.
         *
         * @param {Puppeteer.ElementHandle} element - The element representing a search result.
         * @param {boolean} [get_landing_domain=false] - Whether to include the landing URL.
         * @returns {Object} An object containing title, URL, description, and landing URL (if available).
     */
    async get_element_information(element, get_landing_domain = false) {

        let result_top_element = await (await element.$("h2")).$("a")
        let result_title = await (await result_top_element.getProperty("textContent")).jsonValue()
        let result_url = await (await result_top_element.getProperty("href")).jsonValue()
        let result_description = this.get_description(element)
        
        let result_landing_url = ""

        if (get_landing_domain) {
            try {
                result_landing_url = await (await (await element.$(".b_adurl")).getProperty("textContent")).jsonValue()
            }
            catch(e) {
                console.log("couldn't get landing domain, continuing")
            }
        }


        return {
            "title": result_title,
            "url": result_url,
            "description": result_description,
            "landing_url" : result_landing_url
        }
    }

    /**
         * Extracts search results from the Bing search results page.
         *
         * This method extracts and populates the `results` array with information about search results
         * found on the Bing search results page. It identifies search results based on their class name
         * and captures their title, URL, and description using the `get_element_information` method.
         *
     */
    async get_results() {

        let results = []

        let raw_results = await (await this.page.$("#b_results")).$$(".b_algo")

        for(let i=0; i<raw_results.length; i++) {


            if(!await this.page.evaluate(el => el.getAttribute("data-bm"), raw_results[i])) {
                continue
            }

            results.push(await this.get_element_information(raw_results[i]))

        }
        this.results = results

    }

    /**
         * Extracts slide ads from the Bing search results page.
         *
         * This method extracts and populates the `slide_ads` array with URLs of slide ads found on the Bing search results page.
         * It identifies slide ads based on their container element and captures their URLs.
         *
     */
    async get_slide_ads() {
        let slide_ads = []
        let slide_ads_div = await this.page.$("#b_pole")
        

        if ((!slide_ads_div) || ((await (await slide_ads_div.getProperty("innerHTML")).jsonValue()).indexOf("Annonces") === -1)) {
            return
        }

        let slides = await slide_ads_div.$$(".slide")

        for (let i = 0; i<slides.length; i++) {

            let link = await slides[i].$("a")

            if(!link) {
                continue
            }

            if (i===0) {
                this.slide_ad_to_click = link
            }

            slide_ads.push(await (await link.getProperty("href")).jsonValue())
        }

        this.slide_ads = slide_ads

    }

    /**
         * Extracts ads from the Bing search results page.
         *
         * This method extracts and populates the `ads` array with information about ads found on the Bing search results page.
         * It identifies ads in both the top and bottom sections of the results and captures their title, URL, description,
         * position, and landing URL.
         *
         * @async
         * @function get_ads
         * @memberof Bing_Crawler
         * @instance
     */
    async get_ads() {
        let ads = []
        let raw_ads_list = []

        let top_ads = await this.page.$(".b_adTop")
        if(top_ads) {
            top_ads = await top_ads.$$("li")
        }
        else {
            top_ads = []
        }
        
        let bottom_ads = await this.page.$(".b_adBottom")
        if(bottom_ads) {
            bottom_ads = await bottom_ads.$$("li")
        }
        else {
            bottom_ads = []
        }
        
        raw_ads_list = [top_ads, bottom_ads]

        let positions = ["top", "bottom"]

        let clicked_ad_selected = false

        for (let index=0; index<raw_ads_list.length; index++) {
            let raw_ads = raw_ads_list[index]
            for (let j=0; j<raw_ads.length; j++) {
                
                if(!await this.page.evaluate(el => el.getAttribute("data-bm"), raw_ads[j])) {
                    continue
                }

                
                let information = await this.get_element_information(raw_ads[j], true)      
                
                if (information["title"].indexOf("Voir") !== -1) 
                    continue

                information["position"] = positions[index]
                

                if(!clicked_ad_selected) {
                    this.ad_to_click = await (await raw_ads[j].$("h2")).$("a")
                    clicked_ad_selected = true
                }

                ads.push(information)
            }
        }

        this.ads = ads


        await this.get_slide_ads()
    }

    /**
         * Extracts sidebar ads from the Bing search results page.
         *
         * This method extracts and populates the `sidebar_ads` array with information about the sidebar ads
         * found on the Bing search results page. It identifies sidebar ads based on their class name and
         * captures their title, URL, and description.
         *
     */
    async get_sidebar_ads() {
        let sidebar_ads = []
        this.sidebar_ads = sidebar_ads
       
        let raw_sidebar_ad = await this.page.$$(".sb_adBrandSidebar")
        if (raw_sidebar_ad.length !== 1)
            return
    
        raw_sidebar_ad = raw_sidebar_ad[0]

        let sidebar_ad_top_element = await (await raw_sidebar_ad.$("h2")).$("a")
        let sidebar_title = await (await sidebar_ad_top_element.getProperty("textContent")).jsonValue()
        let sidebar_url = await (await sidebar_ad_top_element.getProperty("href")).jsonValue()  
        let sidebar_description = await (await (await raw_sidebar_ad.$("p")).getProperty("textContent")).jsonValue()

        sidebar_ads.push({
            "title": sidebar_title,
            "url": sidebar_url,
            "description": sidebar_description
        })

        this.sidebar_ads = sidebar_ads
        
    }


}


