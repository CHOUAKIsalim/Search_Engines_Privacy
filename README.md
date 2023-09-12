
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


## 3. Analysis:
This directory contains an in-depth analysis of the dataset stored in "Data/all_se_results.json". This analysis is within a Jupyter notebook file. It is divided into three distinct sections, each dedicated to a specific phase: before clicking on an ad, during the ad click, and after the ad click.

The resulting figures are saved within the "plots/" directory and the structured tables in the "tables/" directory.

## 4. Data:
This folder contains a link to the dataset, which exceeds the GitHub file size limits. This dataset is structured as a JSON file containing a list of elements. Each element in the list corresponds to a list of crawling instances for each search engine, appearing in the following sequence: Bing, Google, DuckDuckGo, StartPage, and Qwant.

Each of these crawling instances includes the following key fields:

- clicking_time: A timestamp indicating when the advertisement was clicked.
- clicked_url: The landing_url of the clicked ad.
- requests_before_clicking: A list of network requests sent before clicking the ad.
- tracker_requests_before_clicking: A list of tracking requests sent before clicking the ad.
- requests_after_clicking: A list of network requests sent when clicking the ad.
- tracker_requests_after_clicking: A list of tracking network requests sent when clicking the ad.
- requests_after_reaching_destination: A list of network requests sent after clicking the ad.
- tracker_requests_after_reaching_destination: A list of tracking network requests sent after clicking the ad.
- redirectors: A list of redirectors bounced through during the ad click.
- path: The navigation path traversed during the ad click.
- redirecting request: A list of network requests involved in the navigation.
- set-cookies_after_clicking: A list of User identifiers extracted from the first-party storage after clicking the ad.
- parameters_after_clicking: A list of User identifiers extracted from query parameters after clicking the ad.


## Contact
For any inquiries or further information regarding this project, please contact salim.chouaki@inria.fr.
