
import tldextract
"""
Extracts the top level domain of a given URL

Returns:
    ETLD + 1 of a given URL
"""
def get_url_etld(url):

    extracted_url = tldextract.extract(url)
    return extracted_url.subdomain.lower() + "." + extracted_url.domain.lower()



"""
Extracts the complete domain of a given URL

Returns:
    domain from URL
"""
def get_url_domain(url):

    clicked_url_domain = tldextract.extract(url).domain.lower()

    if url.startswith("https://business.google.com") :
        clicked_url_domain = "business.google"

    return clicked_url_domain
