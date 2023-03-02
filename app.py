from flask import Flask, render_template, request, redirect, url_for
from data_processing.tool import get_info
import os
os.environ['CORENLP_HOME'] = 'D:\AppGallery\stanford\stanford-corenlp-4.5.2'

"""
flask将表单数据发送给模板
"""

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/overview',methods = ['POST','GET'])
def overview():
    if request.method == 'POST':
        query = request.form.to_dict()['Name']   
        get_info(query)
        return render_template('overview.html',query=query)
    elif request.method == 'GET':
        return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug = True, threaded = True)