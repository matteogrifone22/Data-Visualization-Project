
## Data Visualization Project

## Reproducibility Documentation

### 1. Preprocessing Scripts

All preprocessing scripts are located in the `script/` folder. These scripts generate and process the datasets used in the visualizations:
- `preprocessing.py`, `SmallMultipleDatasetProcessing.py`, `GeoChartPreprocessing.py`, `damage_sites_to_clusters.py`, etc.

**To run a preprocessing script:**
```sh
python script/preprocessing.py
python script/SmallMultipleDatasetProcessing.py
python script/GeoChartPreprocessing.py
python script/damage_sites_to_clusters.py --input <input.geojson> --output <output.geojson> --eps 500
```
Make sure you have Python 3 and required packages (e.g., pandas, geopandas) installed.

### 2. Serve/Build the Website Locally

This project uses [Vite](https://vitejs.dev/) and [React](https://react.dev/):

- **Install dependencies:**
	```sh
	npm install
	```
- **Start development server:**
	```sh
	npm run dev
	```
- **Build for production:**
	```sh
	npm run build
	```
- **Preview production build:**
	```sh
	npm run preview
	```

The production build outputs to the `docs/` folder for GitHub Pages hosting.

## Folder Structure & Data Locations

- `script/` — Python scripts for preprocessing and data transformation.
- `src/`
	- `components/` — React components for visualizations (GeoMap, DonutChart, etc.)
	- `Dataset/` — Raw and processed CSV datasets for visualizations.
		- `processed/` — Preprocessed CSV files ready for use in the app.
    - `DatasetIcons/` — Icons related to datasets for the dataset page.
	- `GazaMap/` — GeoJSON and JSON files for map-based visualizations.
    - `ThemeContext.jsx` — Context for managing theme (dark mode, monochromacy).
    - `App.jsx` — Main React application component.
    - `style.css` — Global CSS styles.
    - `Datasets.jsx` — Dataset information page.
    - `Footer.jsx` — Footer component.


- `docs/` — Static site output for deployment (after build).
- `public/` — Public assets (icons, etc.).


