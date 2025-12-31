#!/usr/bin/env python3

import sys
import os

import pandas as pd
from pathlib import Path

file = r'C:\Users\mfmat\Documents\Magistrale\SecondoAnno\DV\Data-Visualization-Project\src\Dataset\Middle-East_aggregated_data_up_to-2025-12-06.csv'
df = pd.read_csv(file)

"""
WEEK,REGION,COUNTRY,ADMIN1,EVENT_TYPE,SUB_EVENT_TYPE,EVENTS,FATALITIES,POPULATION_EXPOSURE,DISORDER_TYPE,ID,CENTROID_LATITUDE,CENTROID_LONGITUDE
2016-02-06,Middle East,Bahrain,Capital,Battles,Armed clash,1,0,,Political violence,285,26.1927,50.5508
2016-06-25,Middle East,Bahrain,Capital,Explosions/Remote violence,Remote explosive/landmine/IED,1,1,,Political violence,285,26.1927,50.5508
2017-02-11,Middle East,Bahrain,Capital,Explosions/Remote violence,Remote explosive/landmine/IED,2,0,,Political violence,285,26.1927,50.5508
"""

output_dir = Path.cwd().parent / "src" / "Dataset"
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# keep only Palestine and Israel data
df = df[(df["COUNTRY"] == "Palestine") | (df["COUNTRY"] == "Israel")]


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
    df_less_weeks.groupby(["MONTH", "COUNTRY"])["FATALITIES"]
    .sum()
    .reset_index()
).rename(columns={"COUNTRY": "country", "FATALITIES": "fatalities"})


fatalities_per_month.to_csv(r'C:\Users\mfmat\Documents\Magistrale\SecondoAnno\DV\Data-Visualization-Project\src\Dataset\fatalities_per_month.csv', index=False)


# Ridgeplot dataset
# weekly events and events type per country 
events_per_week = (
    df_less_weeks.groupby(["WEEK", "COUNTRY", "EVENT_TYPE"])["EVENTS"]
    .sum()
    .reset_index()
).rename(columns={"COUNTRY": "country", "EVENTS": "events", "EVENT_TYPE": "event_type"})
events_per_week.to_csv(r'C:\Users\mfmat\Documents\Magistrale\SecondoAnno\DV\Data-Visualization-Project\src\Dataset\events_per_week.csv', index=False)
