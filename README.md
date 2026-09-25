# NCR Pollution Intelligence System

An AI-powered air quality monitoring and forecasting dashboard for the Delhi-NCR region. The system combines live weather and pollution data, satellite fire detection, machine learning models, and explainable analytics to estimate AQI, predict future pollution, and identify likely pollution sources.

## Project Overview

This project is designed to act as a smart environmental intelligence platform. It collects real-time air quality and meteorological inputs, applies regional calibration for Delhi-NCR stations, and runs prediction models to help users understand:

- current air quality conditions,
- short-term AQI trends,
- likely pollution sources,
- risk levels and health recommendations,
- seasonal and spatial pollution patterns.

The system is built around a Flask web application and a hybrid AI pipeline that includes:

- LSTM-based AQI forecasting,
- Gradient Boosting Regressor fallback model,
- XGBoost source classification,
- satellite fire analysis via NASA FIRMS,
- SQLite prediction history logging,
- PDF-ready dashboard report generation.

## Key Features

### Real-time Air Quality Monitoring
- Pulls live pollution and weather values from OpenWeather APIs.
- Supports hybrid analysis across multiple NCR locations.
- Applies station-specific multipliers for local conditions.

### Fire and Spatial Intelligence
- Downloads or loads NASA VIIRS fire data for South Asia.
- Identifies nearby fire hotspots within a selected radius.
- Uses fire count and FRP values as inputs for pollution estimation.

### AI Prediction Engine
- LSTM model for time-series AQI forecasting.
- Gradient Boosting Regressor as a fallback baseline model.
- XGBoost classifier for identifying likely pollution sources:
  - Vehicular Emissions
  - Biomass / Stubble Burning
  - Industrial / Coal Burning
  - Construction / Dust
  - Mixed / Secondary Pollutants

### Explainability and Reporting
- SHAP-based feature importance analysis
- Dynamic probability chart for source classification
- Health advice based on current AQI severity
- Prediction history database for trend analysis
- PDF export support for presentation and reporting

### Dashboard Interface
- Responsive web UI for monitoring and prediction
- Live synchronization and status feedback
- Historical AQI trends and model output display

---

## Tech Stack

- Python
- Flask
- Pandas, NumPy, Scikit-learn
- XGBoost
- SHAP
- TensorFlow / Keras (for LSTM support)
- SQLite
- Matplotlib, Seaborn
- Requests
- NASA FIRMS data ingestion

---

## Project Structure

```text
MODEL/
├── app.py                          # Main Flask application
├── database_manager.py            # SQLite database logic
├── data_preprocessing.py         # Data cleaning and preprocessing
├── create_source_dataset.py      # Source classification dataset builder
├── train_model.py                # AQI/GBR training pipeline
├── train_lstm.py                 # LSTM model training
├── train_source_classification.py # XGBoost source model training
├── evaluate_lstm.py              # LSTM evaluation script
├── spatial_utils.py              # Haversine and fire-zone calculations
├── generate_fire_evidence.py     # Fire evidence generation
├── final_project_report.md       # Architecture and project report
├── requirements.txt              # Python dependencies
├── Dockerfile                    # Container setup
├── static/                       # CSS and JS assets
├── templates/                    # HTML frontend files
├── dataset/                      # Local datasets
├── processed_data.csv            # Processed AQI dataset
├── source_identification_dataset.csv
├── delhi_ncr_aqi_dataset.csv
├── SUOMI_VIIRS_C2_South_Asia_7d.csv
├── historical_fire_evidence.csv
├── lstm_aqi_model.h5
├── lstm_aqi_model_v2.h5
├── lstm_scaler.pkl
├── model.pkl
├── source_classification_model.pkl
└── README.md
```

---

## Installation

1. Clone the project repository.
2. Navigate to the project folder.
3. Create a virtual environment:

```bash
python -m venv venv
```

4. Activate the environment:

- Windows:

```bash
venv\Scripts\activate
```

- Linux/macOS:

```bash
source venv/bin/activate
```

5. Install dependencies:

```bash
pip install -r requirements.txt
```

---

## Running the Application

From the project root, run:

```bash
python app.py
```

Then open the browser at:

```text
http://localhost:7860
```

---

## How the System Works

### 1. Data Ingestion
The application fetches:

- current weather conditions,
- live pollution components,
- historical air pollution records,
- fire hotspot information from NASA FIRMS.

### 2. Local Calibration
The system applies station-level multipliers to account for local pollution behavior, such as industrial emissions in Bhiwadi or traffic emissions in Anand Vihar.

### 3. Prediction Layer
The backend evaluates:

- an LSTM time-series AQI forecast,
- a Gradient Boosting fallback forecast,
- pollutant source classification via XGBoost.

### 4. Output and Decision Support
The dashboard presents:

- AQI value and trend,
- fire count and FRP data,
- source probability distribution,
- recommended precautionary advice,
- historical logs and reports.

---

## Model Notes

### AQI Prediction Models
- Primary model: LSTM for time-series forecasting based on prior pollution and weather behavior.
- Secondary model: Gradient Boosting Regressor for robust fallback predictions.

### Source Identification
A classification model distinguishes among major pollution sources using pollution ratios and environmental variables such as:

- PM2.5 / PM10 ratio,
- SO2 / NO2 ratio,
- nearby fire intensity,
- temperature, humidity, wind speed,
- time of day and seasonal context.

---

## API and Data Dependencies

This application relies on external data sources such as:

- OpenWeather API for weather and air pollution data
- NASA FIRMS for active fire detection

A valid OpenWeather API key is needed for live data fetching. If the key is invalid or unavailable, the app may fall back to local or simulated historical values.

---

## Database

The project stores prediction records in SQLite using the database manager. This supports:

- auditing model predictions,
- analyzing historical trends,
- exporting decision/log evidence.

---

## Deployment

The project includes a Dockerfile and is compatible with lightweight deployment setups, including cloud hosting environments.

Example run with Docker:

```bash
docker build -t ncr-pollution-intelligence .
docker run -p 7860:7860 ncr-pollution-intelligence
```

---

## Use Case

This system is useful for:

- urban air-quality monitoring,
- government or civic decision support,
- pollution research and analysis,
- public awareness dashboards,
- academic project demonstrations and AI presentations.

---

## Notes

- The project is designed for the Delhi-NCR region and uses city-specific calibration for more realistic outputs.
- Live prediction performance depends on API availability and network connectivity.
- Model files must be present in the project folder for full LSTM and training support.

---

## License

This project is intended for academic and research use. Please confirm the appropriate license before public distribution or deployment.

---

## Contributors

This project was developed as a pollution intelligence and forecasting system for a college-level research and presentation initiative.
