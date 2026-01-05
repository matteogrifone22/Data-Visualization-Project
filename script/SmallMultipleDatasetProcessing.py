import pandas as pd
import os

# Define paths
dataset_dir = r'C:\Users\mfmat\Documents\Magistrale\SecondoAnno\DV\Data-Visualization-Project\src\Dataset'
output_dir = r'C:\Users\mfmat\Documents\Magistrale\SecondoAnno\DV\Data-Visualization-Project\src\Dataset\processed'

# Create output directory if it doesn't exist
os.makedirs(output_dir, exist_ok=True)

# Countries to filter
COUNTRIES = ['Israel', 'Palestine', 'State of Palestine', 'West Bank and Gaza']

start_year = 2018

def process_gdp():
    """Process GDP dataset"""
    df = pd.read_csv(os.path.join(dataset_dir, 'GDP.csv'))
    
    # Filter for Israel and Palestine
    df_filtered = df[df['REF_AREA_LABEL'].isin(COUNTRIES)]
    
    # Keep only important columns: Country and year columns (2000-2024)
    year_columns = [str(year) for year in range(2000, 2025)]
    columns_to_keep = ['REF_AREA_LABEL'] + year_columns
    df_filtered = df_filtered[columns_to_keep]
    
    # Reshape from wide to long format
    df_long = df_filtered.melt(
        id_vars=['REF_AREA_LABEL'],
        var_name='Year',
        value_name='GDP_per_capita'
    )
    
    # Rename country column
    df_long = df_long.rename(columns={'REF_AREA_LABEL': 'Country'})
    
    # Normalize country names
    df_long['Country'] = df_long['Country'].replace({
        'West Bank and Gaza': 'Palestine',
        'State of Palestine': 'Palestine'
    })
    
    # Convert year to int and remove empty values
    df_long['Year'] = df_long['Year'].astype(int)
    df_long = df_long.dropna(subset=['GDP_per_capita'])
    
    # Filter by start_year
    df_long = df_long[df_long['Year'] >= start_year]
    
    df_long.to_csv(os.path.join(output_dir, 'GDP_processed.csv'), index=False)
    print(f"GDP processed: {len(df_long)} rows")
    return df_long

def process_drinking_water():
    """Process Safely Drinking Services dataset"""
    df = pd.read_csv(os.path.join(dataset_dir, 'SafelyDrinkingServices.csv'))
    
    # Filter for Israel and Palestine
    df_filtered = df[df['REF_AREA_LABEL'].isin(COUNTRIES)]
    
    # Keep only important columns: Country and year columns (2000-2024)
    year_columns = [str(year) for year in range(2000, 2025)]
    columns_to_keep = ['REF_AREA_LABEL'] + year_columns
    df_filtered = df_filtered[columns_to_keep]
    
    # Reshape from wide to long format
    df_long = df_filtered.melt(
        id_vars=['REF_AREA_LABEL'],
        var_name='Year',
        value_name='Drinking_Water_Access_Percent'
    )
    
    # Rename country column
    df_long = df_long.rename(columns={'REF_AREA_LABEL': 'Country'})
    
    # Normalize country names
    df_long['Country'] = df_long['Country'].replace({
        'West Bank and Gaza': 'Palestine',
        'State of Palestine': 'Palestine'
    })
    
    # Convert year to int and remove empty values
    df_long['Year'] = df_long['Year'].astype(int)
    df_long = df_long.dropna(subset=['Drinking_Water_Access_Percent'])
    
    # Filter by start_year
    df_long = df_long[df_long['Year'] >= start_year]
    
    # Round percentage to 1 decimal place
    df_long['Drinking_Water_Access_Percent'] = df_long['Drinking_Water_Access_Percent'].round(1)
    
    df_long.to_csv(os.path.join(output_dir, 'DrinkingWater_processed.csv'), index=False)
    print(f"Drinking Water processed: {len(df_long)} rows")
    return df_long

def process_sanitation():
    """Process Safely Sanitation Services dataset"""
    df = pd.read_csv(os.path.join(dataset_dir, 'SafelySanitationServices.csv'))
    
    # Filter for Israel and Palestine
    df_filtered = df[df['REF_AREA_LABEL'].isin(COUNTRIES)]
    
    # Keep only important columns: Country and year columns (2000-2024)
    year_columns = [str(year) for year in range(2000, 2025)]
    columns_to_keep = ['REF_AREA_LABEL'] + year_columns
    df_filtered = df_filtered[columns_to_keep]
    
    # Reshape from wide to long format
    df_long = df_filtered.melt(
        id_vars=['REF_AREA_LABEL'],
        var_name='Year',
        value_name='Sanitation_Access_Percent'
    )
    
    # Rename country column
    df_long = df_long.rename(columns={'REF_AREA_LABEL': 'Country'})
    
    # Normalize country names
    df_long['Country'] = df_long['Country'].replace({
        'West Bank and Gaza': 'Palestine',
        'State of Palestine': 'Palestine'
    })
    
    # Convert year to int and remove empty values
    df_long['Year'] = df_long['Year'].astype(int)
    df_long = df_long.dropna(subset=['Sanitation_Access_Percent'])
    
    # Filter by start_year
    df_long = df_long[df_long['Year'] >= start_year]
    
    # Round percentage to 1 decimal place
    df_long['Sanitation_Access_Percent'] = df_long['Sanitation_Access_Percent'].round(1)
    
    df_long.to_csv(os.path.join(output_dir, 'Sanitation_processed.csv'), index=False)
    print(f"Sanitation processed: {len(df_long)} rows")
    return df_long

def process_food_insecurity():
    """Process Food Insecurity dataset"""
    df = pd.read_csv(os.path.join(dataset_dir, 'FoodInsecurity.csv'))
    
    # Filter for Israel and Palestine
    df_filtered = df[df['REF_AREA_LABEL'].isin(COUNTRIES)]
    
    # Keep only rows with UNIT_MEASURE = 'PT' (Percentage, not confidence intervals)
    df_filtered = df_filtered[df_filtered['UNIT_MEASURE'] == 'PT']
    
    # Keep only 'Total' sex (_T) to avoid duplication
    if 'SEX' in df_filtered.columns:
        df_filtered = df_filtered[df_filtered['SEX'] == '_T']
    
    # Keep only important columns: Country and year columns (2016-2024)
    year_columns = [str(year) for year in range(2016, 2025)]
    columns_to_keep = ['REF_AREA_LABEL'] + year_columns
    df_filtered = df_filtered[columns_to_keep]
    
    # Reshape from wide to long format
    df_long = df_filtered.melt(
        id_vars=['REF_AREA_LABEL'],
        var_name='Year',
        value_name='Food_Insecurity_Percent'
    )
    
    # Rename country column
    df_long = df_long.rename(columns={'REF_AREA_LABEL': 'Country'})
    
    # Normalize country names
    df_long['Country'] = df_long['Country'].replace({
        'West Bank and Gaza': 'Palestine',
        'State of Palestine': 'Palestine'
    })
    
    # Convert year to int and remove empty values
    df_long['Year'] = df_long['Year'].astype(int)
    df_long = df_long.dropna(subset=['Food_Insecurity_Percent'])
    
    # Filter by start_year
    df_long = df_long[df_long['Year'] >= start_year]
    
    # Round percentage to 1 decimal place
    df_long['Food_Insecurity_Percent'] = df_long['Food_Insecurity_Percent'].round(1)
    
    df_long.to_csv(os.path.join(output_dir, 'FoodInsecurity_processed.csv'), index=False)
    print(f"Food Insecurity processed: {len(df_long)} rows")
    return df_long

def create_combined_dataset():
    """Combine all datasets into one for small multiple chart"""
    # Load all processed datasets
    gdp = pd.read_csv(os.path.join(output_dir, 'GDP_processed.csv'))
    drinking = pd.read_csv(os.path.join(output_dir, 'DrinkingWater_processed.csv'))
    sanitation = pd.read_csv(os.path.join(output_dir, 'Sanitation_processed.csv'))
    food = pd.read_csv(os.path.join(output_dir, 'FoodInsecurity_processed.csv'))
    
    # Merge all datasets
    combined = gdp.merge(drinking, on=['Country', 'Year'], how='outer')
    combined = combined.merge(sanitation, on=['Country', 'Year'], how='outer')
    combined = combined.merge(food, on=['Country', 'Year'], how='outer')
    
    # Sort by Country and Year
    combined = combined.sort_values(['Country', 'Year'])
    
    combined.to_csv(os.path.join(output_dir, 'Combined_SmallMultiple.csv'), index=False)
    print(f"\nCombined dataset created: {len(combined)} rows")
    print(f"Countries: {combined['Country'].unique()}")
    print(f"Year range: {combined['Year'].min()} - {combined['Year'].max()}")
    
    return combined

# Main execution
if __name__ == "__main__":
    print("Starting dataset preprocessing for Small Multiple Chart...")
    print("=" * 60)
    
    # Process each dataset
    gdp_df = process_gdp()
    drinking_df = process_drinking_water()
    sanitation_df = process_sanitation()
    food_df = process_food_insecurity()
    
    print("\n" + "=" * 60)
    print("Creating combined dataset...")
    combined_df = create_combined_dataset()
    
    print("\n" + "=" * 60)
    print("Processing complete!")
    print(f"Output directory: {output_dir}")
    print("\nGenerated files:")
    print("  - GDP_processed.csv")
    print("  - DrinkingWater_processed.csv")
    print("  - Sanitation_processed.csv")
    print("  - FoodInsecurity_processed.csv")
    print("  - Combined_SmallMultiple.csv")
    
    # Display sample of combined data
    print("\nSample of combined data:")
    print(combined_df.head(10))
