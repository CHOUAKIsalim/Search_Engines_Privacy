"""
This script reads crawling results from various search engines and put them into a signle json file
"""
import os, json



def read_crawling_results():
    """
    Read and combine crawling results from multiple search engines.
    
    Returns:
        list: A list containing the crawling results for each search engine.
    """
    
    #The search engines included in the study
    study_ses = ["bing", "ddg", "google", "startpage", "qwant"]
    ARRAYS = []

    # Importing all crawling files for each search engine
    for study_se in study_ses:
            
        if os.path.exists('../Crawling_system/files/' + study_se + '.json'):
            f = open('../Crawling_system/files/' + study_se + '.json')
            ARRAYS.append(json.load(f))

    return ARRAYS

    
if __name__ == "__main__":

    #Importing crawling results 
    ALL_SE_RESULTS = read_crawling_results()

#    with open('../Analysis/all_se_results_with_trending3.json', 'w') as f:

    if len(ALL_SE_RESULTS) == 0:
        print("nothing to write!")

    else:
        write_crawling_results(ALL_SE_RESULTS)

