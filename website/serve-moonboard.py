from flask import Flask, Response, request, make_response, render_template, redirect, jsonify
from flask_cors import CORS
import os

import pickle
import numpy as np
import tensorflow as tf
import math
import uuid

import threading

from tensorflow.keras import datasets, layers, models

GRADE_MODEL = models.load_model('moonboard_model.h5')

# lock for writing to generated problems file
FILE_LOCK = threading.Lock()

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

CORS(app)

# helpers - TODO: dont double define these
def stringToCoordinate(coordinate_string):
    """ convert "J5" to (9.0,4.0) """
    x = ord(coordinate_string[0])-ord('A')
    y = int(coordinate_string[1:])-1
    return (x,y)

def convert_problem_to_input(holds):
    # each problem is on 11x18 board, encode as (x,y) coordinates, zero-indexed, starting from bottom left corner
    inp = np.zeros((11,18))
    for hold_string in holds:
        inp[stringToCoordinate(hold_string)] = 1
    return inp

def get_grade_map():
    """
    Defines a mapping of Fontainebleau grades to integer values
    """
    grade_map = {
        '6B': 0,  # V4
        '6B+': 1, # V4
        '6C': 2,  # V5
        '6C+': 3, # V5
        '7A': 4,  # V6
        '7A+': 5, # V7
        '7B': 6,  # V8
        '7B+': 7, # V8
        '7C': 8,  # V9
        '7C+': 9, # V10
        '8A': 10,  # V11
        '8A+': 11, # V12
        '8B': 12,  # V13
        '8B+': 13, # V14
    }
    return grade_map

def get_reverse_grade_map():
    """
    Map scores back to font grades - just use array
    """
    return ['6B', '6B+', '6C', '6C+', '7A', '7A+', '7B', '7B+', '7C', '7C+', '8A', '8A+', '8B', '8B+']



def root_dir():  # pragma: no cover
    return os.path.abspath(os.path.dirname(__file__))

def get_file(filename):  # pragma: no cover
    try:
        src = os.path.join(root_dir(), filename)
        # Figure out how flask returns static files
        # Tried:
        # - render_template
        # - send_file
        # This should not be so non-obvious
        return open(src).read()
    except IOError as exc:
        return str(exc)

@app.route("/")
def hello():
    content = get_file("index.html")
    return Response(content, mimetype="text/html")

@app.route("/grade", methods=['POST'])
def grade():
    # get problem from request..
    print("grade request called")
    print(request.json)
    inp = convert_problem_to_input(request.json)
    pred_grade_float = GRADE_MODEL.predict(np.expand_dims(inp,0)).item()
    upper_bd = math.ceil(pred_grade_float)
    lower_bd = math.floor(pred_grade_float)
    reverse_grade_map = get_reverse_grade_map()
    predicted_grade = reverse_grade_map[lower_bd]+" - "+reverse_grade_map[upper_bd]

    return jsonify({"predicted_grade": predicted_grade})

@app.route("/share", methods=['POST'])
def share():
    print("share request called")
    # array of holds
    holds = request.json


if __name__ == "__main__":
    app.run(ssl_context="adhoc")
