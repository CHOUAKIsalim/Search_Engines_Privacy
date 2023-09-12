"""
This script processes crawling results from various search engines to identify network requests sent to trackers.
It uses Adblock rules from easylist and easyprivacy lists to determine if a network request is a tracker.
The results are then saved in a JSON file with added 'is_tracker' field for each network request.

"""
import os, json
from adblockparser import AdblockRules
from utils.read_and_write_crawling_results import read_crawling_results, write_crawling_results

"""
Read the adblock rules from easylist and easyprivacy lists.

Returns:
    AdblockRules: An instance of AdblockRules initialized with the tracker rules.
"""
def read_tracker_rules():

    raw_rules = []

    for file_name in ["easylist.txt", "easyprivacy.txt"]:
        with open('lists/'+file_name) as f:
            raw_rules += f.read().splitlines()
            
    print("Number of rules:", len(raw_rules))
    return AdblockRules(raw_rules, use_re2=True, max_mem=512*1024*1024)


"""
Check if a given URL is a tracker based on the Adblock rules.

Args:
    url (str): The URL to check.
    TRACKER_RULES (AdblockRules): An instance of AdblockRules containing tracker rules.
    
Returns:
    bool: True if the URL is a tracker, False otherwise.
"""
def is_tracker_from_lists(url, TRACKER_RULES):
    
    return TRACKER_RULES.should_block(url)


    
if __name__ == "__main__":

    #Importing crawling results 
    ALL_SE_RESULTS = read_crawling_results()


    #Reading the tracker rules used to detect trackers
    TRACKER_RULES = read_tracker_rules()

    #Loop over crawling instances for each search engine
    for se_searches in ALL_SE_RESULTS:
        total = len(se_searches)
        for idx, search in enumerate(se_searches):
            print(idx,"/",total)
            for request in search["requests"]:
                request["is_tracker"] = is_tracker_from_lists(request["url"], TRACKER_RULES)

#    with open('../Analysis/all_se_results_with_trending3.json', 'w') as f:
    write_crawling_results(ALL_SE_RESULTS)


