#!/usr/bin/env python3

import sys
import os

import pandas as pd
from pathlib import Path

file = r'C:\Users\mfmat\Documents\Magistrale\SecondoAnno\DV\Data-Visualization-Project\src\Dataset\Middle-East_aggregated_data_up_to-2025-12-06.csv'
filemortality = r'C:\Users\mfmat\Documents\Magistrale\SecondoAnno\DV\Data-Visualization-Project\src\Dataset\Mortality.csv'
df = pd.read_csv(file)
df_mortality = pd.read_csv(filemortality)

"""
WEEK,REGION,COUNTRY,ADMIN1,EVENT_TYPE,SUB_EVENT_TYPE,EVENTS,FATALITIES,POPULATION_EXPOSURE,DISORDER_TYPE,ID,CENTROID_LATITUDE,CENTROID_LONGITUDE
2016-02-06,Middle East,Bahrain,Capital,Battles,Armed clash,1,0,,Political violence,285,26.1927,50.5508
2016-06-25,Middle East,Bahrain,Capital,Explosions/Remote violence,Remote explosive/landmine/IED,1,1,,Political violence,285,26.1927,50.5508
2017-02-11,Middle East,Bahrain,Capital,Explosions/Remote violence,Remote explosive/landmine/IED,2,0,,Political violence,285,26.1927,50.5508
"""

output_dir = Path.cwd().parent / "src" / "Dataset"
if not os.path.exists(output_dir):
    os.makedirs(output_dir)


# keep only admin1 "Gaza Strip" for Palestine and all for Israel
df = df[(df["COUNTRY"] == "Israel") | ((df["COUNTRY"] == "Palestine") & (df["ADMIN1"] == "Gaza Strip"))]
# Change Palestine name in Gaza
df["COUNTRY"] = df["COUNTRY"].replace({"Palestine": "Gaza"})




# # Only keep events from 2020 onwards
df_less_weeks = df.copy()
df_less_weeks["WEEK"] = pd.to_datetime(df_less_weeks["WEEK"])
cutoff_date = pd.to_datetime("2023-01-01")
df_less_weeks = df_less_weeks[df_less_weeks["WEEK"] >= cutoff_date]

print(
    f"Data from {df_less_weeks['WEEK'].min().date()} to {df_less_weeks['WEEK'].max().date()}"
)





# Linechart dataset
# monthly Fatalities per country
df_less_weeks["MONTH"] = df_less_weeks["WEEK"].dt.to_period("M")
fatalities_per_month = (
    df_less_weeks.groupby(["MONTH", "COUNTRY", "EVENT_TYPE"])["FATALITIES"]
    .sum()
    .reset_index()
).rename(columns={"COUNTRY": "country", "FATALITIES": "fatalities", "EVENT_TYPE": "event_type"})

fatalities_per_month.to_csv(r'C:\Users\mfmat\Documents\Magistrale\SecondoAnno\DV\Data-Visualization-Project\src\Dataset\fatalities_per_month.csv', index=False)


# Ridgeplot dataset
# weekly events and events type per country 
events_per_week = (
    df_less_weeks.groupby(["WEEK", "COUNTRY", "EVENT_TYPE"])["EVENTS"]
    .sum()
    .reset_index()
).rename(columns={"COUNTRY": "country", "EVENTS": "events", "EVENT_TYPE": "event_type"})
events_per_week.to_csv(r'C:\Users\mfmat\Documents\Magistrale\SecondoAnno\DV\Data-Visualization-Project\src\Dataset\events_per_week.csv', index=False)

"""
Country,Year,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100+
Israel,1950,1.769,0.236,0.136,0.079,0.048,0.03,0.02,0.015,0.011,0.01,0.009,0.009,0.01,0.011,0.014,0.017,0.021,0.025,0.028,0.03,0.031,0.031,0.031,0.03,0.03,0.03,0.03,0.03,0.029,0.028,0.027,0.026,0.025,0.027,0.03,0.033,0.037,0.04,0.042,0.042,0.041,0.042,0.042,0.044,0.046,0.049,0.053,0.057,0.061,0.066,0.07,0.073,0.075,0.075,0.072,0.07,0.068,0.068,0.072,0.081,0.093,0.106,0.117,0.123,0.122,0.119,0.116,0.114,0.118,0.125,0.133,0.14,0.141,0.133,0.119,0.144,0.136,0.126,0.115,0.102,0.088,0.07,0.053,0.041,0.037,0.037,0.039,0.041,0.04,0.034,0.026,0.021,0.018,0.015,0.01,0.007,0.005,0.004,0.003,0.002,0.003
Israel,1951,1.931,0.241,0.147,0.089,0.055,0.036,0.025,0.019,0.015,0.013,0.013,0.013,0.014,0.016,0.018,0.02,0.024,0.029,0.034,0.039,0.043,0.045,0.045,0.044,0.042,0.04,0.038,0.037,0.036,0.035,0.034,0.033,0.032,0.032,0.034,0.039,0.044,0.048,0.052,0.054,0.054,0.053,0.054,0.055,0.058,0.061,0.066,0.071,0.077,0.084,0.091,0.097,0.101,0.101,0.098,0.094,0.091,0.09,0.093,0.101,0.114,0.13,0.144,0.153,0.154,0.149,0.143,0.141,0.143,0.151,0.164,0.176,0.184,0.185,0.176,0.193,0.183,0.171,0.157,0.142,0.125,0.106,0.084,0.062,0.048,0.043,0.041,0.042,0.044,0.041,0.034,0.026,0.02,0.017,0.014,0.009,0.006,0.004,0.003,0.003,0.003
"""

# Mortality rate dataset
# merge range ages in groups of 5
age_columns = [str(i) for i in range(0, 101)] + ["100+"]
df_mortality_grouped = df_mortality.copy()
for i in range(0, 101, 5):
    if i + 4 <= 100:
        cols_to_sum = [str(j) for j in range(i, i + 5)]
        df_mortality_grouped[f"{i}-{i+4}"] = df_mortality_grouped[cols_to_sum].sum(axis=1)
    else:
        cols_to_sum = [str(j) for j in range(i, 100)] + ["100+"]
        df_mortality_grouped[f"{i}-100+"] = df_mortality_grouped[cols_to_sum].sum(axis=1)
# Keep only the new grouped columns along with Country and Year
grouped_columns = ["Country", "Year"] + [f"{i}-{i+4}" for i in range(0, 100, 5)]
df_mortality_grouped = df_mortality_grouped[grouped_columns]
df_mortality_grouped.to_csv(r'C:\Users\mfmat\Documents\Magistrale\SecondoAnno\DV\Data-Visualization-Project\src\Dataset\mortality_rate_grouped.csv', index=False)

# Sankey diagram dataset
# sub_event_type per event per event type per country

events_sankey = (
    df_less_weeks.groupby(["COUNTRY", "EVENT_TYPE", "SUB_EVENT_TYPE"])["EVENTS"]
    .sum()
    .reset_index()
).rename(
    columns={
        "COUNTRY": "country",
        "EVENT_TYPE": "event_type",
        "SUB_EVENT_TYPE": "sub_event_type",
        "EVENTS": "events",
    }
)  
events_sankey.to_csv(r'C:\Users\mfmat\Documents\Magistrale\SecondoAnno\DV\Data-Visualization-Project\src\Dataset\events_sankey.csv', index=False)