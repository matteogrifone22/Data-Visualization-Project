#!/usr/bin/env python3

import sys
import os

import pandas as pd

file = r'C:\Users\mfmat\Documents\Magistrale\SecondoAnno\DV\Data-Visualization-Project\src\Dataset\2023-2025-pse-gaza-conflict-incidents-affecting-food-systems-incident-data-incident-data.xlsx'
df = pd.read_excel(file)

output = os.path.splitext(file)[0] + ".csv"

df.to_csv(output, index=False)
