from openie import StanfordOpenIE
import spacy
import neuralcoref
import os
import re

nlp = spacy.load('en_core_web_sm')
neuralcoref.add_to_pipe(nlp)

properties = {
    'openie.affinity_probability_cap': 2 / 3,
}

def openie2triple(text):
    with StanfordOpenIE(properties=properties) as client:
        triples = []
        for triple in client.annotate(text):
            triples.append(triple)
        subject = []
        relation = []
        new_triples = {}
        for triple in triples:
            if [triple['subject'], triple['relation']] in subject:
                if len(triple['object']) > len(new_triples[(triple['subject'], triple['relation'])]):
                    new_triples[(triple['subject'], triple['relation'])] = triple['object']
            else:
                new_triples[(triple['subject'], triple['relation'])] = triple['object']
                subject.append([triple['subject'], triple['relation']])
    return new_triples

def ietriple2txt(triple:dict, event_type:str, date:str, origin_sent, f):
    # f.write('subject, relation, object\n')
    for triple_ie in triple.items():
        f.write(triple_ie[0][0]+", "+triple_ie[0][1]+", "+triple_ie[1]+", "
                +"dimension:life, "+"type:"+event_type+", "+"date:"+date+", "+"origin:"+origin_sent+
                "\r\n")

def ietriple2txt_head(triple, files, headline):
    with open(files, 'a+', encoding='utf8') as f:
        # f.write('subject, relation, object\n')
        for triple_ie in triple.items():
            f.write(triple_ie[0][0]+", "+triple_ie[0][1]+", "+triple_ie[1]+", dimension: "+headline+"\n")
    f.close()

def filter_ietriple(triples):
    max_length = 0
    triple = {}
    for item in triples.items():
        if len(item[0][0]) + len(item[0][1]) + len(item[1]) > max_length:
            triple.clear()
            triple[(item[0][0], item[0][1])] = item[1]
            max_length = len(item[0][0]) + len(item[0][1]) + len(item[1])
    return triple

def replace_all(text:str, dict:dict):
    for i, j in dict.items():
        text = text.replace(i, j)
    return text

def process_data(query:str, data, wikidata):
    for item in wikidata:
        for split_item in item.split(' '):
            if split_item not in wikidata:
                wikidata.append(split_item)
    name_pattern = {}
    for item in query.split():
        name_pattern[item] = query
    data = replace_all(data, name_pattern)
    with open('data_replace.txt',mode='w',encoding='utf8') as f: #for debug
        f.write(data)
    f.close()
    origin_doc = nlp(data)    
    origin_sent_list = list(origin_doc.sents) 
    test1 = origin_doc._.coref_resolved
    with open('coreftext.txt',mode='w',encoding='utf8') as f:
        f.write(test1)
    f.close()
    resolved_sent_list = list(nlp(origin_doc._.coref_resolved).sents)

    data_path = "static/data/data({}).txt".format(query)
    with open(data_path,mode='a+',encoding='utf8') as f:
        for sent in resolved_sent_list:

            event_type = None
            date_list = []
            flag_query = 1  #drop this sentence 
            flag_date = 1

            #筛选：含有年份信息并且包含主角
            doc_drop = nlp(str(sent))

            for ent in doc_drop.ents:
                if ent.label_ in ['DATE']:
                    flag_date = 0
                    date_list.append(str(ent))
                if str(ent) in query:
                    flag_query = 0

            if flag_date or flag_query:
                continue

            date = str(date_list[0])    #TODO：这么做其实也不太科学

            # triples = openie2triple(str(sent))   #仅仅是为了保持原格式,如何只保留一个
            # triple = filter_ietriple(triples)
            triple = {('subject','relation'):'action'}


            #判断事件类型
            doc_for_ent = nlp(str(sent))
            for ent in doc_for_ent.ents:
                if ent.label_ in ['GPE']:
                    event_type = 'geography'
                elif str(ent) not in query and ent.label_ in ['PERSON']:
                    event_type = 'relation'
                elif str(ent) in wikidata:
                    event_type = 'career'
                else:
                    event_type = 'temporal'
               

            #定位到原始文本
            sent_index = resolved_sent_list.index(sent)
            origin_sent = str(origin_sent_list[sent_index])  #把原始句子也附上
            

            
            #如果原来有这个文件路径，删掉
            # if os.path.exists(data_path):
            #     os.remove(data_path)

            assert triple is not None
            assert event_type is not None
            assert date is not None
            assert origin_sent is not None
            assert data_path is not None

            # ietriple2txt(triple, event_type, date, origin_sent, f) 
            for triple_ie in triple.items():

                f.write(triple_ie[0][0]+", "+triple_ie[0][1]+", "+triple_ie[1]+", "
                +"dimension:life, "+"type:"+event_type+", "+"date:"+date+", "+"origin:"+origin_sent+'\n')

    f.close()

    return data_path

if __name__ == '__main__':
    data = None
    with open('data_for_debug.txt',mode='r',encoding='utf8') as f:   #TODO:just for debug
        data = f.read()
    f.close()
    process_data('Steve Jobs', data)

    # data = 'Steve Jobs attended Reed College in 1972 before withdrawing that same year. In 1974, he traveled through India seeking enlightenment before later studying Zen Buddhism.'
    # print(nlp(data)._.coref_resolved)
    #TODO:抽取质量再说