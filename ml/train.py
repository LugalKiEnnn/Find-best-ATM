#импорт библиотек
import sys
import pandas as pd
import os
import pickle
#from h3 import h3
import numpy as np
from sklearn.impute import SimpleImputer
from pycaret.regression import *
import warnings
from joblib import dump, load
warnings.filterwarnings("ignore")


#загрузка данных
df_roads = pd.read_csv("train/roads_dataset.csv")
df_transport = pd.read_csv("train/routes_dataset.csv")
df_population = pd.read_csv("train/rosstat_population_all_cities.csv")
df_isochrones_walk = pd.read_csv("train/isochrones_walk_dataset.csv")
df_isochrones_road = pd.read_csv("train/isochrones_drive_dataset.csv")
df_stops = pd.read_csv("train/osm_stops.csv")
df_companies = pd.read_csv("train/osm_amenity.csv")
df = pd.read_csv('train/target_hakaton_spb.csv', encoding="windows-1251", sep = ';')
print('data loaded')

#Обработка данных
df['target_new'] = df['target']/df['atm_cnt']
stops_cols = ['tram_stops', 'subway_entrances', 'bus_stops']
category_mapping = {'category4' : 4, 'category3': 3, 'category2' : 2, 'category1' : 1}
population_cols = ['population']
df_cols = ['atm_cnt', 'target_new', 'atm_category']
comp_cols = ['Автозапчасти для иномарок',
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
             'Шиномонтаж']

df_tram_stop = df_stops[df_stops.type == 'tram_stop'].groupby('geo_h3_10').count().reset_index()[['geo_h3_10','type']]
df_tram_stop.columns = ['geo_h3_10','tram_stops']

df_subway_entrance = df_stops[df_stops.type == 'subway_entrance'].groupby('geo_h3_10').count().reset_index()[['geo_h3_10','type']]
df_subway_entrance.columns = ['geo_h3_10','subway_entrances']

df_bus_stop = df_stops[df_stops.type == 'bus_stop'].groupby('geo_h3_10').count().reset_index()[['geo_h3_10','type']]
df_bus_stop.columns = ['geo_h3_10','bus_stops']


full_geo_data = df_population.merge(df_companies.groupby('geo_h3_10').sum().reset_index(), on = 'geo_h3_10', how = 'outer')
full_geo_data = full_geo_data.merge(df_tram_stop, how = 'outer', on = 'geo_h3_10')
full_geo_data = full_geo_data.merge(df_subway_entrance, how = 'outer', on = 'geo_h3_10')
full_geo_data = full_geo_data.merge(df_bus_stop, how = 'outer', on = 'geo_h3_10')
full_geo_data = full_geo_data[['geo_h3_10'] + comp_cols + population_cols + stops_cols ]

train_cols = df_cols + comp_cols + population_cols + stops_cols

train_df = df[df_cols + ['geo_h3_10']].merge(full_geo_data, on  = 'geo_h3_10', how = 'left')[train_cols]
train_df.atm_category = train_df.atm_category.map(category_mapping)

to_imput_cols =  [ 'Автозапчасти для иномарок',
       'Авторемонт и техобслуживание (СТО)', 'Алкогольные напитки', 'Аптеки',
       'Банки', 'Быстрое питание', 'Доставка готовых блюд', 'Женская одежда',
       'Кафе', 'Косметика / Парфюмерия', 'Ногтевые студии', 'Овощи / Фрукты',
       'Парикмахерские', 'Платёжные терминалы', 'Постаматы',
       'Продуктовые магазины', 'Пункты выдачи интернет-заказов', 'Рестораны',
       'Страхование', 'Супермаркеты', 'Цветы', 'Шиномонтаж', 'population',
       'tram_stops', 'subway_entrances', 'bus_stops']

imp = SimpleImputer(missing_values=np.nan, strategy='median')
imp.fit(train_df[to_imput_cols])

X_test = np.round(imp.transform(train_df[to_imput_cols]))

X_test = pd.DataFrame(X_test)
train_df[to_imput_cols] = X_test

print('data preproccessed')

#Обучение модели
print('start modelling')
exp = setup(data = train_df, target = 'target_new', session_id=123,
              normalize = True, transformation = True, transform_target = False,
              combine_rare_levels = True, rare_level_threshold = 0.05,
              remove_multicollinearity = True, multicollinearity_threshold = 0.95,
              log_experiment = True, experiment_name = 'exp1', silent = True)

best = compare_models(n_select = 1, fold = 7)
tuned_model = tune_model(best)
final_model = finalize_model(tuned_model)

#сохранение модели
save_model(final_model,'model')
dump(imp, 'imputer.joblib')
