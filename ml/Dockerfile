FROM python:3.8

COPY requirements.txt ./requirements.txt
RUN pip install -r requirements.txt

COPY all_geo_data.csv ./all_geo_data.csv
COPY imputer.joblib ./imputer.joblib
COPY model.pkl ./model.pkl
COPY main.py ./main.py


ENTRYPOINT ["python","main.py"]
