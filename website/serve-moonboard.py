from flask import Flask, Response, request, make_response, render_template, redirect, jsonify
from flask_cors import CORS
import os

import pickle
import numpy as np
import tensorflow as tf
import math
import uuid
import sys
import json

from tensorflow.keras import datasets, layers, models

GRADE_MODEL = models.load_model('moonboard_model.h5')
NAME_MODEL_PATH = '../names/moonboard_names_model_128'
NAME_MODEL = models.load_model(NAME_MODEL_PATH + '/model.h5')
NAME_PARAMS = json.load(open(NAME_MODEL_PATH + '/params.json'))

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

CORS(app)

# hack to include utils from another directory - lets get rid of this
def include_utils_in_path():
    cwd = os.getcwd()
    parent_wd = cwd.replace('/website', '')
    utils_path = os.path.join(parent_wd, 'names')
    sys.path.insert(1, utils_path)

include_utils_in_path()
import utils

# helpers - TODO: dont double define these
def string_to_coordinate(coordinate_string):
    """ convert "J5" to (9.0,4.0) """
    x = ord(coordinate_string[0])-ord('A')
    y = int(coordinate_string[1:])-1
    return (x,y)

def convert_problem_to_input(holds):
    # each problem is on 11x18 board, encode as (x,y) coordinates, zero-indexed, starting from bottom left corner
    inp = np.zeros((11,18))
    for hold_string in holds:
        inp[string_to_coordinate(hold_string)] = 1
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

@app.route("/name", methods=['POST'])
def name():
    # get problem from request..
    print(request.json)
    # join the array of holds together and add a space.
    holds = request.json["holds"]
    inp = ",".join(holds) + " "
    SEQUENCE_LENGTH = 128
    char_to_int = NAME_PARAMS['char_to_int']
    int_to_char = NAME_PARAMS['int_to_char']
    END_TOKEN = char_to_int['|']
    prefix = None
    if "name_prefix" in request.json and request.json["name_prefix"] != "":
        prefix = request.json["name_prefix"]
    name = utils.name_text(inp, NAME_MODEL, char_to_int, int_to_char, SEQUENCE_LENGTH, END_TOKEN, prefix)
    print(name)
    return jsonify({"name": name})


if __name__ == "__main__":
    app.run(ssl_context="adhoc")
