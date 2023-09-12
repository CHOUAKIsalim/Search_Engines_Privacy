
# Search_Engines_Privacy

This repository contains the source code and data we used for understanding the privacy properties of five popular search engines, namely Google, Bing, StartPage, DuckDuckGo, and Qwant. The description of the methodology and the results can be found on https://arxiv.org/abs/2308.15309. 



The crawling process entails initiating search queries, detecting search results and advertisements on the search engine results page, interacting with displayed advertisements, and accessing their landing URLs. For each crawling instance, our web driver captures the corresponding search query, displayed advertisements, and all network requests sent by the browser. Furthermore, we have developed mechanisms to detect tracking requests using the EasyPrivacy and EasyList tracking lists. Lastly, we evaluate instances of bounce tracking and UID smuggling upon clicking on advertisements, assessing the privacy implications of using different search engines.


# Repository Structure

The repository is organized into four top-level directories:

## 1. **Crawling System:** 
This directory contains Puppeteer-based crawlers designed to perform the following crawling process on each search engine: initiating search queries, detecting search results and advertisements on the search engine results page, interacting with one of the displayed advertisements, and accessing its landing URL. The Crawling System has been implemented using an object-oriented approach, with a dedicated crawler class for each supported search engine.

### Usage:
To initiate a crawler for a specific search engine, execute the following command:

```bash
$ node run_se.js 'search_engine_name'
```

Replace 'search_engine_name' with one of the following options: google, bing, ddg, startpage, or qwant.

### Output:
After each crawling iteration, a screenshot of the search engine's results page will be saved in the "screenshots/search_engine" directory. Additionally, the results file will be stored in the "files/" directory.


## 2. Preprocessing
This folder contains a collection of scripts designed to transform raw crawling results from each search engine into a well-structured dataset, complete with all the necessary fields required for analysis.

- combine_crawling_results.py: This script reads crawling results stored in the Crawling_system/files/" directory and writes them into a single JSON file, named "Data/all_se_results.json"
- add_job_id.py: This script extracts the "job_id" field for all network requests. This field is essential for accurately sorting network requests. 
- add_is_tracker: This script employes EasyPrivacy and EasyList to identify potential tracking requests among all network requests.
- extract_requests_before_when_and_after_clicking.py: This script categorizes network requests into those sent before clicking on an ad, those sent when clicking on an ad, and those sent after clicking on an ad. Additionally, this script extracts the navigation path and the redirectors bounced through when clicking the ad
- extract_user_identifiers.py: This script extracts user identifiers found in query parameters and first-party storage during redirection events.

### Usage:
You can execute these scripts in the order presented above. Ensure that you have the crawler-generated files located in the "Crawling_system/files" directory.

```bash
$ python 'script_name'
```

### Output: 
Each script will update the dataset file, overwriting it with a new JSON file that includes the newly computed fields. 


## 3. Analysis:** This directory holds the data sources used for analysis, the JSON file generated by the tracking detection script, a Jupyter notebook file (`analysis.ipynb`) that performs detailed analysis, and the resulting tables and plots.

## Contact
For any inquiries or further information regarding this project, please contact salim.chouaki@inria.fr.
