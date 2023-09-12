import json, os

ALL_SE_NAMES = ["bing", "google", "ddg", "startpage", "qwant"]


RESULTS_FILE_PATH = "../Data/all_se_results.json"

def write_crawling_results(ALL_SE_RESULTS):
    with open(RESULTS_FILE_PATH, 'w') as f:
        json.dump(ALL_SE_RESULTS, f)
        

def read_crawling_results():
    """
    Read crawling results
    Returns:
        list: A list containing the crawling results for each search engine.
    """

    if os.path.exists(RESULTS_FILE_PATH):
        f = open(RESULTS_FILE_PATH)
        return json.load(f)

    return[]


