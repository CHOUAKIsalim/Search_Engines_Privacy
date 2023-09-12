import os, json, tldextract, enchant, validators
from urllib.parse import urlparse, parse_qs
from utils.read_and_write_crawling_results import read_crawling_results, write_crawling_results
from utils.urls import get_url_etld



"""
Receives a set of first-party storage and filters out non UID values

Returns:
    A set of UID values created in first-party storage
"""
def filter_cookies(cookies):
    res = {}
    for cookie_key, cookie_value in cookies.items():

        if is_uid_token(cookie_key, cookie_value):
            res[cookie_key] = cookie_value

    return res


"""
Receives a set of query parameters and filters out non UID values

Returns:
    A set of UID values passed in query parameters
"""
def filter_query_parameters(parameters):
    res = {}
    for key, value in parameters.items():

        value = list(set(value))
        value = " ".join(value)

        if is_uid_token(key, value):
            res[key] = value

    return res


"""
Returns True if a given token (key, value) is a UID parameter

"""
def is_uid_token(token_key, token_value):
    english_dictionnary = enchant.Dict("en_US")

    # Manual filtering results
    if token_value in ["EUR", "en", "sc_b_locale=fr_FR", "set", ""]:
        return False

    # Manual filtering result - 2
    if token_key == "DATA":
        return False

    # Removing token keys that have same values accross different iterations
    if token_key in ["et_keyword", "url", "utm_term", "utm_campaign", "utm_content", "u", "tuuid", "aw7735", "bId", "aw17547", "ds_k", "JPOP", "JPKW", "semnb", "ref", "keywords", "utm_custom1", "utm_ag", "asid", "ds_dest_url", "atc_content", "litb_from", "utm_source", "utm_medium", "m_pi", "m_cn", "m_ag", "m_ac", "cm_mmc", "oll", "ad_provider", "ad_domain", "dm", "d", "dsig", "blay", "sm","ccpturl", "uule", "ei", "c1", "c2", "gclsrc"]:
        return False

    # Removing token keys that have same values accross different iterations - 2
    if token_value in ["Event.ClientInst", "UserEvent", "Event.ClientInst", "zenaps.com", "w*HZeZhmD60", "sa360-au-new-goodscat", "p64736203151", "ppc|ga|1|||", "googdemozdesk-21", "A4768712791", "fr_pd_ppc_google_youmake2022_shop-HQ_marque-exact_hot_you-make_text_none_none", "pcmcat1563299784494", "421x11964043", "459x3096044", "duckduckgo.com", "zIv3CTTKCSOnGn", "googhydr0a8-21", "-oaymwEECHwQRg", "AIDcmm2yi7yuxb_SEM_{gclid}:G:s", "{gclid}:G:s", "tbn:ANd9GcSBFmzURVeYKqQuB2JbIhAOt40ZNwbh-7Z6X56HI8mQfw"]:
        return False

    # Removing token keys that have same values accross different iterations - 3
    if token_value[:4] in ["kwd-", "dat-", "dsa-", "DevE", "SERP"]:
        return False

    # Removing short tokens
    if len(token_value) < 8:
        return False

    # Removing url values
    if validators.url(token_value):
        return False

    # Removing english words
    token_values_for_dictionary = token_value[:]
    token_values_for_dictionary = token_values_for_dictionary.replace("_", " ").replace("=", " ")
    non_words = [item for item in token_values_for_dictionary.split(" ") if item != '' and english_dictionnary.check(item) is False]

    if len(non_words) == 0:
        return False

    ## Removing timestamp values
    if token_value.isdigit():
        int_value = int(token_value)
        if 1654034400000 <= int_value <= 1672527600000 or 1654034400 <= int_value <= 1672527600 : #Timestamp between june 2022 and july 2023 both in s and ms
            return False

    return True


"""
Parses a set of cookies. Transforms it from a string to a dictionary (cookie_name, cookie_value)

Returns:
    a dictionnary of cookies {"cookie_key": cookie_value}
"""
def parse_set_cookie(raw_set_cookies):
    cookies = {}
    raw_cookies = raw_set_cookies.split("\n")

    for raw_cookie in raw_cookies:
        cookie_items = raw_cookie.split(";")
        cookie_key = cookie_items[0].split("=")[0]
        cookie_value = "=".join(cookie_items[0].split("=")[1:])
        cookies[cookie_key] = cookie_value

    return cookies


"""
Iterates over all crawling occurences over all search engines
For each occurence, extracts UIDs from first-party storage and query-parameters
Saves the result in set-cookies_after_clicking and parameters_after_clicking
"""
def extract_user_identifiers_from_first_party_storage_and_query_parameters(ALL_SE_RESULTS):
     for se, se_searches in enumerate(ALL_SE_RESULTS):

          for idx, search in enumerate(se_searches):

               if "requests_after_clicking" not in search:
                    continue

               search["set-cookies_after_clicking"] = []
               search["parameters_after_clicking"] = []

               for req in search["requests_after_clicking"]:
                    req["url"] = req["url"].replace("%3A", ":").replace("%2F", "/").replace("%3F", "?").replace("%26", "&").replace("%3D", "=")
                    domain = get_url_etld(req["url"])

                    if "set-cookie" in req['responseHeaders']:
                         set_cookie = req["responseHeaders"]["set-cookie"]
                         set_cookie = parse_set_cookie(set_cookie)
                         set_cookie = filter_cookies(set_cookie)
                         req["set_cookies"] = set_cookie

                         if set_cookie != {}:
                              search["set-cookies_after_clicking"].append((set_cookie, domain))

                    parameters = parse_qs(urlparse(req["url"]).query)
                    parameters = filter_query_parameters(parameters)
                    req["parameters"] = parameters

                    if parameters != {}:
                         search["parameters_after_clicking"].append((parameters, domain))

     return ALL_SE_RESULTS




if __name__ == "__main__":

    #Importing crawling results
    ALL_SE_RESULTS = read_crawling_results()
    ALL_SE_RESULTS = extract_user_identifiers_from_first_party_storage_and_query_parameters(ALL_SE_RESULTS)

    write_crawling_results(ALL_SE_RESULTS)
