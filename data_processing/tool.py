import requests
from lxml import etree
import sqlite3
import re
import os
from data_processing.eventExtraction import process_data
# from tool2 import process_data  



def checkdb(query:str):
    conn = sqlite3.connect('wikipage.db')
    cursor = conn.cursor()

    try:
        cursor.execute("select * from wikipage where name = '{}'".format(query))
        conn.commit()
    except:
        cursor.close()
        conn.close()
        return False

    cursor.close()
    conn.close()
    return True

def db2img(query:str):
    if os.path.exists("static/img/"+query+'.jpg'):
        return

    conn = sqlite3.connect('wikipage.db')
    cursor = conn.cursor()
    sql = "select img from wikipage where name = '{}'".format(query)
    cursor.execute(sql)
    ablob = cursor.fetchone()

    with open("static/img/"+query+'.jpg','wb') as img_file:
        img_file.write(ablob)
    img_file.close()

    cursor.close()
    conn.close()

def db2brief(query:str):
    if os.path.exists('static/data/'+'brief'+'({})'.format(query)+'.txt'):
        return
    
    conn = sqlite3.connect('wikipage.db')
    cursor = conn.cursor()
    sql = "select brief from wikipage where name = '{}'".format(query)
    cursor.execute(sql)
    brief = cursor.fetchone()

    with open('static/data/'+'brief'+'({})'.format(query)+'.txt') as brief_file:
        brief_file.write(brief)
    brief_file.close()

    cursor.close()
    conn.close()

def db2data(query:str):
    if os.path.exists('static/data/'+'data'+'({})'.format(query)+'.txt'):
        return
    
    conn = sqlite3.connect('wikipage.db')
    cursor = conn.cursor()
    sql = "select data from wikipage where name = '{}'".format(query)
    cursor.execute(sql)
    data = cursor.fetchone()

    with open('static/data/'+'data'+'({})'.format(query)+'.txt') as data_file:
        data_file.write(data)
    data_file.close()

    cursor.close()
    conn.close()

def img2db(query:str, img_path:str):
    conn = sqlite3.connect('wikipage.db')
    cursor = conn.cursor()
    cursor.execute('create table if not exists wikiperson \
                    (name varchar(100) primary key, \
                     data LONGTEXT, \
                     brief LONGTEXT, \
                     img  BLOB)')

    with open(img_path,'rb') as img_file:
        ablob = img_file.read()
        try:
            sql = "insert into wikiperson (name img) values ('{}',?)".format(query)
            cursor.execute(sql, [sqlite3.Binary(ablob)])
        except:
            sql = "update wikiperson set img = ? where name = '{}'".format(query)
            cursor.execute(sql, [sqlite3.Binary(ablob)])
    img_file.close()
    
    conn.commit()
    cursor.close()
    conn.close()

def brief2db(query:str, brief_path:str):
    conn = sqlite3.connect('wikipage.db')
    cursor = conn.cursor()
    cursor.execute('create table if not exists wikiperson \
                    (name varchar(100) primary key, \
                     data LONGTEXT, \
                     brief LONGTEXT, \
                     img  BLOB)')

    with open(brief_path,'r',encoding='utf8') as brief_file:
        text = brief_file.read()
        try:
            sql = "insert into wikiperson (name brief) values ('{}',?)".format(query)
            cursor.execute(sql, [text])
        except:
            sql = "update wikiperson set brief = ? where name = '{}'".format(query)
            cursor.execute(sql, [text])
    brief_file.close()
    
    conn.commit()
    cursor.close()
    conn.close()

def data2db(query:str, data_path:str):
    conn = sqlite3.connect('wikipage.db')
    cursor = conn.cursor()
    cursor.execute('create table if not exists wikiperson \
                    (name varchar(100) primary key, \
                     data LONGTEXT, \
                     brief LONGTEXT, \
                     img  BLOB)')

    with open(data_path,'r',encoding='utf8') as data_file:
        text = data_file.read()
        try:
            sql = "insert into wikiperson (name data) values ('{}',?)".format(query)
            cursor.execute(sql, [text])
        except:
            sql = "update wikiperson set data = ? where name = '{}'".format(query)
            cursor.execute(sql, [text])
    data_file.close()
    
    conn.commit()
    cursor.close()
    conn.close()

def get_raw_info(query:str):

    s = requests.session()
    s.trust_env = False
    proxies = {"http": "http://127.0.0.1:7890", "https": "https://127.0.0.1:7890"}

    page_path = 'https://en.wikipedia.org/wiki/' + query.replace(' ', '_')
    resp = s.get(url=page_path, verify=True, proxies=proxies)
    resp.encoding = 'utf-8'
    pageSource = resp.text
    et = etree.HTML(pageSource)  #加载数据，返回element对象

    raw_data = et.xpath("//div[@class='mw-parser-output']/p[not(@class)][position()>1]")
    data = ''
    for item in raw_data:
        data += item.xpath('string(.)')
    brief = et.xpath("//div[@class='mw-parser-output']/p[not(@class)][1]")[0].xpath('string(.)')
    brief = 'name:{}, introduction:{}'.format(query,brief)
    with open('static/data/'+'brief'+'({})'.format(query)+'.txt', mode='w', encoding='utf8') as f:
        f.write(brief)
    f.close()
    brief2db(query=query, brief_path='static/data/'+'brief'+'({})'.format(query)+'.txt')

    img_path = et.xpath("//table[@class='infobox biography vcard']//a/img/@src")[0]
    img_path = re.sub('//', 'https://',img_path)
    img_resp = s.get(url=img_path, verify=True, proxies=proxies) # 拿到连接 去掉了安全验证
    test = "static/img/"+query+'.jpg'
    with open("static/img/"+query+'.jpg', mode="wb") as f: # 打开文件
        f.write(img_resp.content)   # TODO:存到数据库中
    f.close()
    img2db(query=query,img_path="static/img/"+query+'.jpg') #TODO:check

    with open('data_for_debug.txt',mode='w',encoding='utf8') as f:   #TODO:just for debug
        f.write(data)
    f.close()
    return data

def get_info(query:str):
    if checkdb(query):
        db2img(query)    
        db2brief(query)
        db2data(query)
    else:
        data = get_raw_info(query)
        data_path = process_data(query, data) #TODO
        data2db(query, data_path)


if __name__ == "__main__":
    get_info('Steve Jobs')
    
    





