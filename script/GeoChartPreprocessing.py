import pandas as pd
import numpy as np
from datetime import datetime

def process_food_incidents():
    """Process food systems incidents dataset"""
    print("Processing food systems incidents...")
    
    # Read the dataset
    df = pd.read_csv('src/Dataset/2023-2025-pse-gaza-conflict-incidents-affecting-food-systems-incident-data-incident-data.csv')
    
    # Select relevant columns
    processed = pd.DataFrame({
        'date': pd.to_datetime(df['Date']),
        'latitude': df['Latitude'],
        'longitude': df['Longitude'],
        'type': 'Food System',
        'description': df['Event Public Description'],
        'perpetrator': df['Reported Perpetrator Name'],
        'perpetrator_type': df['Reported Perpetrator'],
        'weapon': df['Weapon Carried/Used'],
        'impact': df['Food System Impact'],
        'categories': df['All Food Security Categories'],
        'location': df['Admin 1'],
        'event_id': df['Event ID']
    })
    
    # Remove rows with missing coordinates
    processed = processed.dropna(subset=['latitude', 'longitude'])
    
    # Sort by date
    processed = processed.sort_values('date')
    
    # Add year and month for filtering
    processed['year'] = processed['date'].dt.year
    processed['month'] = processed['date'].dt.month
    processed['day'] = processed['date'].dt.day
    
    # Format date as string for export
    processed['date_string'] = processed['date'].dt.strftime('%Y-%m-%d')
    
    print(f"Processed {len(processed)} food system incidents")
    return processed

def process_health_incidents():
    """Process health care incidents dataset"""
    print("Processing health care incidents...")
    
    # Read the dataset (skip the second header row with # symbols)
    df = pd.read_csv('src/Dataset/2023-2024-pse-shcc-health-care-data.csv', skiprows=[1])
    
    # Create a description based on available data
    def create_health_description(row):
        parts = []
        
        # Facilities
        if row['Number of Attacks on Health Facilities Reporting Destruction'] > 0:
            parts.append(f"{int(row['Number of Attacks on Health Facilities Reporting Destruction'])} facility(ies) destroyed")
        if row['Number of Attacks on Health Facilities Reporting Damaged'] > 0:
            parts.append(f"{int(row['Number of Attacks on Health Facilities Reporting Damaged'])} facility(ies) damaged")
        
        # Health workers
        casualties = []
        if row['Health Workers Killed'] > 0:
            casualties.append(f"{int(row['Health Workers Killed'])} killed")
        if row['Health Workers Injured'] > 0:
            casualties.append(f"{int(row['Health Workers Injured'])} injured")
        if row['Health Workers Kidnapped'] > 0:
            casualties.append(f"{int(row['Health Workers Kidnapped'])} kidnapped")
        if row['Health Workers Arrested'] > 0:
            casualties.append(f"{int(row['Health Workers Arrested'])} arrested")
        
        if casualties:
            profession = row['Reported Health Worker Profession'] if pd.notna(row['Reported Health Worker Profession']) else "health workers"
            parts.append(f"{profession}: {', '.join(casualties)}")
        
        # Other impacts
        if row['Forceful Entry into Health Facility'] > 0:
            parts.append("forceful entry")
        if row['Occupation of Health Facility'] > 0:
            parts.append("facility occupation")
        if row['Vicinity of Health Facility Affected'] > 0:
            parts.append("vicinity affected")
        if row['Access Denied or Obstructed']:
            parts.append("access obstructed")
        
        # Transportation
        if row['Health Transportation Destroyed'] > 0:
            parts.append(f"{int(row['Health Transportation Destroyed'])} ambulance(s) destroyed")
        if row['Health Transportation Damaged'] > 0:
            parts.append(f"{int(row['Health Transportation Damaged'])} ambulance(s) damaged")
        
        return "; ".join(parts) if parts else "Health facility incident"
    
    # Select relevant columns
    processed = pd.DataFrame({
        'date': pd.to_datetime(df['Date']),
        'latitude': df['Latitude'],
        'longitude': df['Longitude'],
        'type': 'Health Care',
        'description': df.apply(create_health_description, axis=1),
        'perpetrator': df['Reported Perpetrator Name'],
        'perpetrator_type': df['Reported Perpetrator'],
        'weapon': df['Weapon Carried/Used'],
        'facilities_destroyed': df['Number of Attacks on Health Facilities Reporting Destruction'],
        'facilities_damaged': df['Number of Attacks on Health Facilities Reporting Damaged'],
        'health_workers_killed': df['Health Workers Killed'],
        'health_workers_injured': df['Health Workers Injured'],
        'health_workers_kidnapped': df['Health Workers Kidnapped'],
        'health_workers_arrested': df['Health Workers Arrested'],
        'worker_profession': df['Reported Health Worker Profession'],
        'access_obstructed': df['Access Denied or Obstructed'],
        'event_id': df['SiND Event ID']
    })
    
    # Remove rows with missing coordinates
    processed = processed.dropna(subset=['latitude', 'longitude'])
    
    # Sort by date
    processed = processed.sort_values('date')
    
    # Add year and month for filtering
    processed['year'] = processed['date'].dt.year
    processed['month'] = processed['date'].dt.month
    processed['day'] = processed['date'].dt.day
    
    # Format date as string for export
    processed['date_string'] = processed['date'].dt.strftime('%Y-%m-%d')
    
    print(f"Processed {len(processed)} health care incidents")
    return processed

def create_combined_dataset(food_df, health_df):
    """Create a simplified combined dataset for mapping"""
    print("Creating combined dataset...")
    
    # Select common columns from food dataset
    food_simple = food_df[['date', 'date_string', 'latitude', 'longitude', 'type', 
                            'description', 'perpetrator', 'weapon', 'year', 'month', 
                            'day', 'event_id']].copy()
    
    # Select common columns from health dataset
    health_simple = health_df[['date', 'date_string', 'latitude', 'longitude', 'type', 
                                'description', 'perpetrator', 'weapon', 'year', 'month', 
                                'day', 'event_id']].copy()
    
    # Combine datasets
    combined = pd.concat([food_simple, health_simple], ignore_index=True)
    
    # Sort by date
    combined = combined.sort_values('date')
    
    # Add a sequential id
    combined['id'] = range(1, len(combined) + 1)
    
    print(f"Combined dataset has {len(combined)} total incidents")
    print(f"  - Food system: {len(food_simple)} incidents")
    print(f"  - Health care: {len(health_simple)} incidents")
    
    return combined

def generate_summary_statistics(food_df, health_df, combined_df):
    """Generate summary statistics"""
    print("\n" + "="*60)
    print("SUMMARY STATISTICS")
    print("="*60)
    
    print("\nFood System Incidents:")
    print(f"  Total incidents: {len(food_df)}")
    print(f"  Date range: {food_df['date'].min().strftime('%Y-%m-%d')} to {food_df['date'].max().strftime('%Y-%m-%d')}")
    print(f"  Main perpetrators:")
    print(food_df['perpetrator'].value_counts().head(3).to_string())
    print(f"\n  Most common weapons:")
    print(food_df['weapon'].value_counts().head(3).to_string())
    
    print("\n" + "-"*60)
    print("\nHealth Care Incidents:")
    print(f"  Total incidents: {len(health_df)}")
    print(f"  Date range: {health_df['date'].min().strftime('%Y-%m-%d')} to {health_df['date'].max().strftime('%Y-%m-%d')}")
    print(f"  Total health workers killed: {int(health_df['health_workers_killed'].sum())}")
    print(f"  Total health workers injured: {int(health_df['health_workers_injured'].sum())}")
    print(f"  Total facilities destroyed: {int(health_df['facilities_destroyed'].sum())}")
    print(f"  Total facilities damaged: {int(health_df['facilities_damaged'].sum())}")
    print(f"  Main perpetrators:")
    print(health_df['perpetrator'].value_counts().head(3).to_string())
    
    print("\n" + "-"*60)
    print("\nCombined Dataset:")
    print(f"  Total incidents: {len(combined_df)}")
    print(f"  Date range: {combined_df['date'].min().strftime('%Y-%m-%d')} to {combined_df['date'].max().strftime('%Y-%m-%d')}")
    print(f"  By year:")
    print(combined_df['year'].value_counts().sort_index().to_string())
    print(f"\n  By type:")
    print(combined_df['type'].value_counts().to_string())
    print("="*60 + "\n")

def main():
    print("\n" + "="*60)
    print("GEOCHART DATA PREPROCESSING")
    print("="*60 + "\n")
    
    # Process both datasets
    food_df = process_food_incidents()
    health_df = process_health_incidents()
    
    # Create combined dataset
    combined_df = create_combined_dataset(food_df, health_df)
    
    # Generate statistics
    generate_summary_statistics(food_df, health_df, combined_df)
    
    # Save processed datasets
    output_dir = 'src/Dataset/processed/'
    
    print("Saving processed datasets...")
    food_df.to_csv(f'{output_dir}Food_Incidents_Processed.csv', index=False)
    print(f"  ✓ Saved: {output_dir}Food_Incidents_Processed.csv")
    
    health_df.to_csv(f'{output_dir}Health_Incidents_Processed.csv', index=False)
    print(f"  ✓ Saved: {output_dir}Health_Incidents_Processed.csv")
    
    combined_df.to_csv(f'{output_dir}Combined_Incidents_GeoChart.csv', index=False)
    print(f"  ✓ Saved: {output_dir}Combined_Incidents_GeoChart.csv")
    
    print("\n✓ Processing complete!\n")

if __name__ == '__main__':
    main()
