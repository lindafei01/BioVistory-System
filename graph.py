import re
import pandas as pd
import numpy as np
import bs4
import requests
import spacy
from spacy import displacy
nlp = spacy.load('en_core_web_sm')
from spacy.matcher import Matcher 
from spacy.tokens import Span
import networkx as nx
import matplotlib.pyplot as plt
from tqdm import tqdm
import neuralcoref
neuralcoref.add_to_pipe(nlp)

def get_entities(sent):

 ## chunk 1
 # 我在这个块中定义了一些空变量。
 # prv tok dep和prv tok text将分别保留句子中前一个单词和前一个单词本身的依赖标签。前缀和修饰符将保存与主题或对象相关的文本。
    ent1 = ""
    ent2 = ""

    prv_tok_dep = "" # dependency tag of previous token in the sentence
    prv_tok_text = "" # previous token in the sentence


    prefix = ""
    modifier = ""


 #############################################################
 
    for tok in nlp(sent):
 ## chunk 2
 # 接下来，我们将遍历句子中的记号。我们将首先检查标记是否为标点符号。如果是，那么我们将忽略它并转移到下一个令牌。
 # 如果标记是复合单词的一部分(dependency tag = compound)，我们将把它保存在prefix变量中。复合词是由多个单词组成一个具有新含义的单词(例如“Football Stadium”, “animal lover”)。
 # 当我们在句子中遇到主语或宾语时，我们会加上这个前缀。我们将对修饰语做同样的事情，例如“nice shirt”, “big house”

 # if token is a punctuation mark then move on to the next token
        if tok.dep_ != "punct":
 # check: token is a compound word or not
            if tok.dep_ == "compound":
                prefix = tok.text
 # if the previous word was also a 'compound' then add the current word to it
                if prv_tok_dep == "compound":
                    prefix = prv_tok_text + " "+ tok.text
 
 # check: token is a modifier or not
            if tok.dep_.endswith("mod") == True:
                modifier = tok.text
 # if the previous word was also a 'compound' then add the current word to it
                if prv_tok_dep == "compound":
                    modifier = prv_tok_text + " "+ tok.text
 
 ## chunk 3
 # 在这里，如果令牌是主语，那么它将作为ent1变量中的第一个实体被捕获。变量如前缀，修饰符，prv tok dep，和prv tok文本将被重置。
            if tok.dep_.find("subj") == True:
                ent1 = modifier +" "+ prefix + " "+ tok.text
                prefix = ""
                modifier = ""
                prv_tok_dep = ""
                prv_tok_text = "" 


 ## chunk 4
 # 在这里，如果令牌是宾语，那么它将被捕获为ent2变量中的第二个实体。变量，如前缀，修饰符，prv tok dep，和prv tok文本将再次被重置。
            if tok.dep_.find("obj") == True:
                ent2 = modifier +" "+ prefix +" "+ tok.text
 
 ## chunk 5  
 # 一旦我们捕获了句子中的主语和宾语，我们将更新前面的标记和它的依赖标记。
 # update variables
            prv_tok_dep = tok.dep_
            prv_tok_text = tok.text
 #############################################################


    return [ent1.strip(), ent2.strip()]

def get_relation(sent):
    doc = nlp(sent)
 # Matcher class object 
    matcher = Matcher(nlp.vocab)
 #define the pattern 
    pattern = [{'DEP':'ROOT'}, 
            {'DEP':'prep','OP':"?"},
            {'DEP':'agent','OP':"?"},  
            {'POS':'ADJ','OP':"?"}] 
    matcher.add("matching_1", None, pattern) 
    matches = matcher(doc)
    k = len(matches) - 1
    span = doc[matches[k][1]:matches[k][2]] 
    return(span.text)

f = open('Shakespeare.txt')
intro = f.read()
print(intro)

doc = nlp(intro)
newdoc = doc._.coref_resolved
newdoc2 = nlp(newdoc)
print(newdoc2)   #指代消解

ents = [str(ents) for ents in newdoc2.ents]
print(set(ents))

entity_pairs = []
sents = [str(sent) for sent in newdoc2.sents]
for i in tqdm(sents):
  pairs = get_entities(i)
  # if pairs[0] in ents and pairs[1] in ents:
  if pairs[0] in ents:
    entity_pairs.append(pairs)
#     print(str(type(i)))






























