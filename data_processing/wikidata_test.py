import requests
from lxml import etree

def get_wikidata(query:str):
    
    s = requests.session()
    s.trust_env = False
    proxies = {"http": "http://127.0.0.1:7890", "https": "https://127.0.0.1:7890"}

    id_url = 'https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item&redirects=1&titles=' + query
    resp = s.get(url=id_url, verify=True, proxies=proxies)
    resp.encoding = 'utf-8'
    pageSource = resp.text
    et = etree.HTML(pageSource)  #加载数据，返回element对象

    wikidata_id = et.xpath("//pre/span[contains(text(),'wikibase_item')]/following-sibling::span[@class='s2']")[0].text.replace('"','')
    wikidata_url = 'https://www.wikidata.org/wiki/' + wikidata_id

    resp_wikidata = s.get(url=wikidata_url, verify=True, proxies=proxies)
    resp_wikidata.encoding = 'utf-8'
    pageSource_wikidata = resp_wikidata.text
    with open('crawlwikidata.txt', encoding='utf8', mode='a+') as f:
        f.write(pageSource_wikidata)
    f.close() 
    et_wikidata = etree.HTML(pageSource_wikidata)  #加载数据，返回element对象

    # test1 = et_wikidata.xpath('//div[@class="wikibase-statementgroupview listview-item"]')
    notable_work_node = et_wikidata.xpath("//div[contains(@class, 'wikibase-statementgroupview-property') and contains(.//a, 'notable work')]/following-sibling::div[@class='wikibase-statementlistview']//child::a")
    notable_work = [i.text for i in notable_work_node]
    return notable_work
    
if __name__ == '__main__':
    get_wikidata('Steve Jobs')