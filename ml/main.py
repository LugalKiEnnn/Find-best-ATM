from flask import Flask, request, jsonify
import joblib
import traceback
import pandas as pd
import numpy as np
from pycaret.regression import *
import json
from joblib import dump, load
from sklearn.impute import SimpleImputer
from flask_cors import CORS

def create_test_data(h3_list: list, atm_category: str, geo_data: pd.DataFrame):
    df = pd.DataFrame()
    df['geo_h3_10'] = h3_list
    df['atm_cnt'] = 1

    category_mapping = {'category4' : 4, 'category3': 3, 'category2' : 2, 'category1' : 1}

    df['atm_category'] = category_mapping[atm_category]


    train_cols = ['atm_cnt',
                 'atm_category',
                 'Автозапчасти для иномарок',
                 'Авторемонт и техобслуживание (СТО)',
                 'Алкогольные напитки',
                 'Аптеки',
                 'Банки',
                 'Быстрое питание',
                 'Доставка готовых блюд',
                 'Женская одежда',
                 'Кафе',
                 'Косметика / Парфюмерия',
                 'Ногтевые студии',
                 'Овощи / Фрукты',
                 'Парикмахерские',
                 'Платёжные терминалы',
                 'Постаматы',
                 'Продуктовые магазины',
                 'Пункты выдачи интернет-заказов',
                 'Рестораны',
                 'Страхование',
                 'Супермаркеты',
                 'Цветы',
                 'Шиномонтаж',
                 'population',
                 'tram_stops',
                 'subway_entrances',
                 'bus_stops']

    df = df.merge(geo_data, how = 'left', on = 'geo_h3_10')

    return df

def preprocess_data(df, imp):
    # Заполнить пропуски и оставить переменные для предсказания
    to_imput_cols =       [ 'Автозапчасти для иномарок',
       'Авторемонт и техобслуживание (СТО)', 'Алкогольные напитки', 'Аптеки',
       'Банки', 'Быстрое питание', 'Доставка готовых блюд', 'Женская одежда',
       'Кафе', 'Косметика / Парфюмерия', 'Ногтевые студии', 'Овощи / Фрукты',
       'Парикмахерские', 'Платёжные терминалы', 'Постаматы',
       'Продуктовые магазины', 'Пункты выдачи интернет-заказов', 'Рестораны',
       'Страхование', 'Супермаркеты', 'Цветы', 'Шиномонтаж', 'population',
       'tram_stops', 'subway_entrances', 'bus_stops']

    X_test = np.round(imp.transform(df[to_imput_cols]))
    X_test = pd.DataFrame(X_test)
    df[to_imput_cols] = X_test


    return df

def predict_target(df, model):

    train_columns = ['atm_cnt', 'atm_category', 'Автозапчасти для иномарок',
    'Авторемонт и техобслуживание (СТО)', 'Алкогольные напитки', 'Аптеки',
    'Банки', 'Быстрое питание', 'Доставка готовых блюд', 'Женская одежда',
    'Кафе', 'Косметика / Парфюмерия', 'Ногтевые студии', 'Овощи / Фрукты',
    'Парикмахерские', 'Платёжные терминалы', 'Постаматы',
    'Продуктовые магазины', 'Пункты выдачи интернет-заказов', 'Рестораны',
    'Страхование', 'Супермаркеты', 'Цветы', 'Шиномонтаж', 'population',
    'tram_stops', 'subway_entrances', 'bus_stops']

    df_predict = df[train_columns]

    preds_df = predict_model(model, data = df_predict)
    df['target'] = preds_df['Label']
    df = df[['geo_h3_10', 'target']]
    df.columns = ['index', 'target']
    predict_dict = {"hexagons" :  df.to_dict('records')}
    return  json.dumps(predict_dict, indent = 4)


app = Flask(__name__)
CORS(app)

@app.route('/predict', methods=['POST', 'GET'])
def predict():
    if request.method == 'POST':
        print(request.method)
        json_ = request.json
        print(json_)
        h3s_list = json_["h3_list"]
        atm_category = json_["atm_category"]

        predict_df = create_test_data(h3s_list, atm_category, geo_data)
        predict_df = preprocess_data(predict_df, imp)
        predict_json = predict_target(predict_df, model)

    return predict_json


if __name__ == '__main__':


    port = 8080

    model = load_model('model')
    print('model_loaded')
    imp = load('imputer.joblib')
    print('imputer loaded')
    geo_data = pd.read_csv('all_geo_data.csv')
    print('geo data loaded')


    app.run(port=port, host='0.0.0.0', debug=True)
