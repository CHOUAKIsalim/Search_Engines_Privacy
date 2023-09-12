
import os, json
from urllib.parse import urlparse
from utils.read_and_write_crawling_results import read_crawling_results, write_crawling_results




"""
    Adds job_id to network requests. 
    Essential to sort the network requests in the correct order
    Extracts the job-id field from the interceptionId, which is in string format
"""
def add_job_id_to_requests(ALL_SE_RESULTS):

    for list_ in ALL_SE_RESULTS:

        for search in list_:

            requests_for_search = []

            for request in search["requests"]:
                if "interceptionId" not in request and "requestId" not in request : # THis condition for old similations
                    print("problem, no iterceptionId and no request Id")
                    ignore = True
                    break

                if "interceptionId" not in request and urlparse(request["url"]).netloc != "":
                    ignore = True
                    print("problem, iterceptionId not defined for a non data: url", urlparse(request["url"]).netloc)
                    break

                if "interceptionId" in request and "interception-job-" not in request["interceptionId"]:
                    ignore = True
                    print("problem, interceptionId have a different form", request["interceptionId"])
                    break

                if "interceptionId" not in request:
#                    print("no interception id in request, continue", urlparse(request["url"]).netloc)
                    continue

                job_id = request["interceptionId"][17:]

                try:
                    job_id = float(job_id)
                    request["job_id"] = job_id

                except:
                    print("job_id not in good format", job_id)
                    continue

                requests_for_search.append(request)
            search["requests"] = requests_for_search
            search["requests"] = sorted(search["requests"], key=lambda d: d['job_id'])  # By job_id

    return ALL_SE_RESULTS







if __name__ == "__main__":

    #Importing crawling results
    ALL_SE_RESULTS = read_crawling_results()
    ALL_SE_RESULTS = add_job_id_to_requests(ALL_SE_RESULTS)

    write_crawling_results(ALL_SE_RESULTS)

