import os, json, tldextract
from urllib.parse import urlparse
from  collections import OrderedDict

from utils.read_and_write_crawling_results import read_crawling_results, write_crawling_results, ALL_SE_NAMES
from utils.urls import get_url_domain, get_url_etld


"""
Receives a list of requests, and returns only ones sent between time_1 and time_2

Returns:
    list of requests between time_1 and time_2
"""
def get_requests_between_times(requests, time_1, time_2):
    return [item for item in requests if time_1 <= item["timestamp"] < time_2]



"""
Extracts network requests, domain of network requests, tracker requests, and domain of trackers requests
before clicking on ads.
Saves the results in requests_before_clicking, domains_before_clicking, tracker_requests_before_clicking, tracker_domains_before_clicking

"""
def get_requests_before_clicking(ALL_SE_RESULTS):

    for se_searches in ALL_SE_RESULTS:
        for idx, search in enumerate(se_searches):
            requests_before_clicking = get_requests_between_times(search["requests"], 0, search["clicking_time"])
            domains_before_clicking = [urlparse(item["url"]).netloc for item in requests_before_clicking]
            tracker_requests_before_clicking = [item for item in requests_before_clicking if item["is_tracker"] is True]
            tracker_domains_before_clicking = [urlparse(item["url"]).netloc for item in tracker_requests_before_clicking]

            search["requests_before_clicking"] = requests_before_clicking
            search["domains_before_clicking"] = domains_before_clicking
            search["tracker_requests_before_clicking"] = tracker_requests_before_clicking
            search["tracker_domains_before_clicking"] = tracker_domains_before_clicking


    return ALL_SE_RESULTS


"""
Puts the landing URLs of DuckDuckGo crawling occurences in the correct format. 
On DuckDuckGo, the landing URL is not displayed as URL but just a string containing the domain of the landing URL
"""
def format_duckduckgo_urls(ALL_SE_RESULTS):

    for search in ALL_SE_RESULTS[2]:
        if len(search["ads"]) > 0:
             search["ads"][0]["landing_url"] = "https://" + search["ads"][0]["landing_url"] +"/"

    return ALL_SE_RESULTS




"""
Extracts network requests, domain of network requests, tracker requests, and domain of trackers requests
after clicking on ads and after reaching destination.
Saves the results for after clicking on ads in requests_after_clicking, domains_after_clicking, tracker_requests_after_clicking, tracker_domains_after_clicking
Saves the results for after reaching destination in requests_after_reaching_destination, domains_after_reaching_destination, tracker_requests_after_reaching_destination, tracker_domains_after_reaching_destination

The first request sent to the landing URL sets the separation between requests before and after reaching the destination
"""
def get_requests_after_clicking_and_after_reaching_destination(ALL_SE_RESULTS):

     for index, se_searches in enumerate(ALL_SE_RESULTS):
          for idx, search in enumerate([item for item in se_searches if item["clicked_url"] != ""]):

               if len(search["ads"]) == 0:
                    continue

               if ">" in search["ads"][0]["landing_url"]:
                    search["ads"][0]["landing_url"] = search["ads"][0]["landing_url"].split(">")[0].replace(" ", "")

               clicked_url_domain = get_url_domain(search["ads"][0]["landing_url"])
               found = False

               requests_after_clicking = []
               requests_after_reaching_destination = []
               domains_after_clicking = []
               domains_after_reaching_destination = []

               requests_to_consider = get_requests_between_times(search["requests"], search["clicking_time"], 9999999999999)

               for request in requests_to_consider:
                    # We use request_domain for detecting when we arrive to landing url
                    # because its the same as the one extracted from the clicked url 
                    # Then we use etld domain for later analysis

                    request_domain = get_url_domain(request["url"])
                    etld_domain = get_url_etld(request["url"])

                    if request_domain == clicked_url_domain and (ALL_SE_NAMES[index] != "bing" or request["responseHeaders"] != {}):
                         found = True

                    if found == False:
                         domains_after_clicking.append(etld_domain)
                         requests_after_clicking.append(request)

                    else:
                         domains_after_reaching_destination.append(etld_domain)
                         requests_after_reaching_destination.append(request)

               search["requests_after_clicking"] = requests_after_clicking
               search["domains_after_clicking"] = domains_after_clicking
               search["tracker_requests_after_clicking"] = [item for item in requests_after_clicking if item["is_tracker"] is True]
               search["tracker_domains_after_clicking"] = [urlparse(item["url"]).netloc for item in search["tracker_requests_after_clicking"]]

               search["requests_after_reaching_destination"] = requests_after_reaching_destination
               search["domains_after_reaching_destination"] = domains_after_reaching_destination
               search["tracker_requests_after_reaching_destination"] = [item for item in requests_after_reaching_destination if item["is_tracker"] is True]
               search["tracker_domains_after_reaching_destination"] = [urlparse(item["url"]).netloc for item in search["tracker_requests_after_reaching_destination"]]

     return ALL_SE_RESULTS



"""
Extracts network requests sent by each firs-party from the browser perspective
The result is a dictionary {"first_party": requests} and is saved in requests_by_first_parties
"""
def extract_requests_by_first_parties(ALL_SE_RESULTS):

     for index, se_searches in enumerate(ALL_SE_RESULTS):
          se = ALL_SE_NAMES[index]
          for idx, search in enumerate([item for item in se_searches if item["clicked_url"] != ""]):

               if len(search["ads"]) == 0:
                    continue


               first_party = "www." + se + ".com"
               location_found = False
               current_location = "-1 Lorem ipsum dolor sit amet" #Just random that i will not find
               queries_by_first_party = [{first_party: []}]

               for request in [item for item in search["requests_after_clicking"] if item["status"] != 404]:
                    request["url"] = request["url"].replace("%3A", ":").replace("%2F", "/").replace("%3F", "?").replace("%26", "&").replace("%3D", "=")

                    if not current_location in request["url"]:
                         queries_by_first_party[len(queries_by_first_party) - 1][first_party].append(request)

                    else:
                         new_first_party = urlparse(current_location).netloc

                         if new_first_party != "":
                              first_party = new_first_party

                         queries_by_first_party.append({first_party : []})

                    if request["status"] <= 399 and request["status"] >= 300 and "location" in request["responseHeaders"]:
                         location = request["responseHeaders"]["location"]
                         location = location.replace("%3A", ":").replace("%2F", "/").replace("%3F", "?").replace("%26", "&").replace("%3D", "=")
                         location_found = True
                         current_location = location


               if urlparse(current_location).netloc != first_party: #ADD LAST FIRST PARTY IN CASE IT WASNT ADDED
                    queries_by_first_party.append({urlparse(current_location).netloc : []})

               search["requests_by_first_parties"] = queries_by_first_party

     return ALL_SE_RESULTS




"""
Extracts the navigation path from the search engine to the ad's destination and the list of redirectors bounced through
The results are saved in the fields 'path' and 'redirectors'
"""
def extract_redirectors_and_navigation_paths(ALL_SE_RESULTS):

     for index, results in enumerate(ALL_SE_RESULTS):
          se = ALL_SE_NAMES[index]

          if se =="ddg":
               se = "duckduckgo.com"

          else:
               se = "www." + se + ".com"

          for idx, result in enumerate([item for item in results if item["clicked_url"] != ""]):

               if len(result["ads"]) == 0:
                    continue

               if len(result["requests_after_reaching_destination"]) == 0:
                    result["redirectors"] = []
                    result["path"] = ""
                    result["redirecting_requests"] = ""
                    continue

               # ALL DOMAINS
               all_chain_domains = [urlparse(item["url"]).netloc for item in result["requests_after_reaching_destination"][0]["redirectChain"]]

               # REMOVE LAST DOMAIN IN CASE ITS SAME AS URL
               all_chain_domains = [item for item in all_chain_domains if item != urlparse(result["requests_after_reaching_destination"][0]["url"]).netloc]

               # ADDING SE AND REMOVING DUPLICATES
               all_chain_domains = list(OrderedDict.fromkeys([se] + all_chain_domains))
               result["redirectors"] = [item for item in all_chain_domains[1:] if item not in ["r.g.bing.com", "api.qwant.com", "qwa.qwant.com"]]
               result["path"] = " - ".join([item for item in all_chain_domains if item not in ["r.g.bing.com", "api.qwant.com", "qwa.qwant.com"]] + ["destination"])
               result["redirecting_requests"] = []
               first_redirect = result["requests_after_reaching_destination"][0]["redirectChain"][0]["url"]

               if (urlparse(first_redirect).netloc != se) and (urlparse(first_redirect).netloc != "r.g.bing.com"):
                    result["redirecting_requests"] += [first_redirect]

               result["redirecting_requests"] += [item["url"] for item in result["requests_after_reaching_destination"][0]["redirectChain"][1:]]

               if result["requests_after_reaching_destination"][0]["url"] not in result["redirecting_requests"]:
                    result["redirecting_requests"].append(result["requests_after_reaching_destination"][0]["url"])

     return ALL_SE_RESULTS







if __name__ == "__main__":

    #Importing crawling results
    ALL_SE_RESULTS = read_crawling_results()
    ALL_SE_RESULTS = format_duckduckgo_urls(ALL_SE_RESULTS)
    ALL_SE_RESULTS = get_requests_before_clicking(ALL_SE_RESULTS)
    ALL_SE_RESULTS = get_requests_after_clicking_and_after_reaching_destination(ALL_SE_RESULTS)
    ALL_SE_RESULTS = extract_requests_by_first_parties(ALL_SE_RESULTS)
    ALL_SE_RESULTS = extract_redirectors_and_navigation_paths(ALL_SE_RESULTS)

    write_crawling_results(ALL_SE_RESULTS)
