import matplotlib.pyplot as pyplot
import shutil
import keras
import json
import datetime
import psutil
import os
import time
import operator

from keras_preprocessing.sequence import pad_sequences
import numpy as np

def valid_char(ch):
    return ch >= 'A' and ch <= 'Z' or ch.isspace() or ch >= '0' and ch <= '9'

def valid_string(name):
    return all([valid_char(ch) for ch in name])

# for some reason these two functions are way faster than the keras char-level tokenizer
def map_char_to_int(texts,labels):
    char_counts = {}
    for text in texts:
        for char in text:
            char_counts[char] = char_counts[char] + 1 if char in char_counts else 1
    for char in labels:
        char_counts[char] = char_counts[char] + 1 if char in char_counts else 1
    char_counts_sorted = sorted(char_counts.items(), key=operator.itemgetter(1), reverse=True)
    char_to_int = {}
    int_to_char = ['?'] # reverse index
    for i, row in enumerate(char_counts_sorted):
        char_to_int[row[0]] = i + 1
        int_to_char.append(row[0])
    return char_to_int, int_to_char


# for some reason these two functions are way faster than the keras char-level tokenizer
def texts_to_sequences(texts, char_to_int):
    sequences = []
    for text in texts:
        sequences.append([char_to_int[char] for char in text])
    return sequences

def save_training_plots(model_path):
    history = json.load(open(model_path + '/history.json'))

    for i in range(0, len(history['val_loss'])):
        history['val_loss'][i] = round(history['val_loss'][i], 3)
        history['val_acc'][i] = round(history['val_acc'][i], 3)
        history['loss'][i] = round(history['loss'][i], 3)
        history['acc'][i] = round(history['acc'][i], 3)

    pyplot.plot(history['acc'])
    pyplot.plot(history['val_acc'])
    pyplot.title('accuracy')
    pyplot.ylabel('accuracy')
    pyplot.xlabel('epoch')
    pyplot.legend(['train', 'validate'], loc='upper left')
    pyplot.savefig(model_path + '/acc.png', dpi=300)
    pyplot.clf()  # I'm commenting that this means "clear" because it's a silly method name

    pyplot.plot(history['loss'])
    pyplot.plot(history['val_loss'])
    pyplot.title('loss')
    pyplot.ylabel('loss')
    pyplot.xlabel('epoch')
    pyplot.legend(['train', 'validate'], loc='upper left')
    pyplot.savefig(model_path + '/loss.png', dpi=300)
    pyplot.clf()


def save_history_file(model_path, history):
    with open(model_path + '/history.json', 'w') as handle:
        json.dump(history, handle)


def copy_model_to_latest(base_path, model_path, model_name):
    try:
        shutil.rmtree(base_path + '/' + model_name + '_latest')
    except:
        pass
    shutil.copytree(model_path, base_path + '/' + model_name + '_latest')


class SaveHistoryCheckpoint(keras.callbacks.Callback):
    def __init__(self, model_path, **kargs):
        super(SaveHistoryCheckpoint, self).__init__(**kargs)
        self.model_path = model_path
        self.init_time = time.time()
        self.history = {
            'loss': [],
            'acc': [],
            'val_loss': [],
            'val_acc': [],
            'time': [],
            'training_time': 0,
            #'total_time': total_time(),
            #'peak_memory': get_memory()
        }

    def on_epoch_end(self, epoch, logs={}):
        index = len(self.history)
        self.history['loss'].append(logs.get('loss'))
        self.history['acc'].append(logs.get('acc'))
        self.history['val_loss'].append(logs.get('val_loss'))
        self.history['val_acc'].append(logs.get('val_acc'))
        self.history['time'].append(time.time() - (self.history['time'][index - 1] if index else self.init_time))
        self.history['training_time'] = time.time() - self.init_time
        #self.history['total_time'] = total_time()
        #self.history['peak_memory'] = get_memory()
        save_history_file(self.model_path, self.history)
        save_training_plots(self.model_path)

def convert_problem_to_input(holds):
    # encode each problem as csv list of holds, followed by space, then name of the problem
    inp = []
    hold_string = ','.join([hold['Description'] for hold in holds])
    hold_string += ' '
    return hold_string

def sample_from_prob_vec(pr):
    # sample from output of model (ignoring very rare outcomes)
    prob_thresh = np.max(pr,1) * 0.1
    pr[pr < prob_thresh]=0
    pr = (pr/pr.sum(axis=1,keepdims=1))[0]
    idxs = np.arange(len(pr))
    return np.random.choice(idxs, 1, p=pr)[0]

# Take "hold text (like 'A5,B8,D12,F14,I18 ' or output of `convert_problem_to_input` and output a name)
def name_text(text, model, char_to_int, int_to_char, max_length, end_token, prefix=None):
    if prefix is not None:
        prefix = prefix.upper()
        if valid_string(prefix):
            aug_text = text+prefix
    texts = [aug_text]
    #single
    # for each text, continue predicting until we reach max length or end token
    final_texts = texts
    while True:

        sequences = texts_to_sequences(final_texts, char_to_int)
        data = pad_sequences(sequences, maxlen=max_length)
        predictions_list = model.predict(data)

        ch = sample_from_prob_vec(predictions_list)
        if len(sequences[0]) > max_length or ch == end_token:
            break
        final_texts[0]+=int_to_char[ch]
    return final_texts[0][len(text):]
