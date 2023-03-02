# import requests

# # requests.DEFAULT_RETRIES = 100  # 增加重试连接次数
# s = requests.session()
# s.trust_env = False

# # 上面这个方法有用吗 没用 好

# proxies = {"http": "http://127.0.0.1:7890", "https": "https://127.0.0.1:7890"}
# # proxies = { "http": None, "https": None}


# query = 'crawl'
# url1 = 'https://pic1.zhimg.com/80/v2-25af5339222ff34539882a5e957c7a4c_720w.webp?source=1940ef5c'
# url2 = 'https://en.wikipedia.org/wiki/Steve_Jobs'

# res = s.get(url=url2 ,verify=True, proxies=proxies)
# # 现在不动了，可能是连接超时，确实，然后就解决超时问题
# # img_resp = requests.get(url=url1,verify=False) # 拿到连接 去掉了安全验证
# # print(res.text)

# with open('f.html', 'w', encoding='utf8') as f:
#     f.write(res.text)

# # 要先关掉代理再pip
# print('success')
# # with open("static/img/"+'crawl.jpg', mode="wb") as f: # 打开文件
# #     f.write(img_resp.content) # 写入到文件


# # 看起来你的问题解决了
# # 好的，感谢，还想问一下为什么现在没有开代理但是依然爬取成功了
# # 我觉得原因是，你用requests访问本身是不需要代理的，你之前遇到的proxyError
# #如果不需要代理的话，那么为什么还需要设置proxies
# # 好吧，这个情况还是挺奇怪的，我觉得这样写并不太好，但是你对的代理程序的使用也没办法使用更方便的办法，所以只能像我刚才那样不断尝试
# # 如果你真的需要用代理去访问网页并且爬虫，我比较推荐你使用透明代理
# # 好的，谢谢您！

import sqlite3
conn = sqlite3.connect('wikipage.db')
c = conn.cursor()
c.execute("select * from wikiperson")
for row in c:
    print(row)
c.close()
conn.close()

