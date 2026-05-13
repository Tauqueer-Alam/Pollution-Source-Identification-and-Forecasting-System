import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier
from sklearn.metrics import classification_report
import pickle

def train_source_model():
    print("Loading dataset...")
    data = pd.read_csv('source_identification_dataset.csv')
    
    # We want to predict: Primary_Source
    # Features will be the pollutants, meteorological data, time factors, and ratios
    # 'nearby_fires' and 'fire_frp_sum' removed to prevent 100% data leakage from synthetic heuristic logic
    features = ['pm25', 'pm10', 'no2', 'so2', 'co', 'o3', 'temperature', 'humidity', 'wind_speed', 'visibility',
                'month', 'hour', 'is_weekend', 'pm25_pm10_ratio', 'so2_no2_ratio']
    
    print("Preprocessing data...")
    # Handle missing values
    data = data.dropna(subset=['Primary_Source']) 
    for col in features:
        if col in data.columns and col not in ['pm25_pm10_ratio', 'so2_no2_ratio']:
            data[col] = pd.to_numeric(data[col], errors='coerce')
            data[col] = data[col].fillna(data[col].mean())
            
    # Engineer Chemical Ratios
    data['pm25_pm10_ratio'] = data['pm25'] / (data['pm10'] + 1e-5)
    data['so2_no2_ratio'] = data['so2'] / (data['no2'] + 1e-5)
    
    # Fill remaining NaNs for the engineered features
    data['pm25_pm10_ratio'] = data['pm25_pm10_ratio'].fillna(0)
    data['so2_no2_ratio'] = data['so2_no2_ratio'].fillna(0)
    
    # Filter to only use available features present in the dataset
    features = [f for f in features if f in data.columns]
    print(f"Training with features: {features}")
            
    X = data[features]
    y = data['Primary_Source']
    
    print("Encoding labels for XGBoost...")
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    
    print("Splitting dataset into train and test sets...")
    X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded)
    
    print("Training XGBoost Classifier...")
    
    model = XGBClassifier(
        n_estimators=300, 
        max_depth=7, 
        learning_rate=0.05, 
        n_jobs=-1, 
        random_state=42, 
        eval_metric='mlogloss'
    )
    model.fit(X_train, y_train)
    
    print("Evaluating model...")
    y_pred = model.predict(X_test)
    print("\nClassification Report:\n")
    report = classification_report(le.inverse_transform(y_test), le.inverse_transform(y_pred))
    print(report)
    print(model.score(X_test, y_test),model.score(X_train, y_train))
    
    feature_importance = pd.DataFrame({
        'Feature': features,
        'Importance': model.feature_importances_
    }).sort_values(by='Importance', ascending=False)
    print("\nFeature Importances:")
    print(feature_importance)
    
    model_data = {
        'model': model,
        'features': features,
        'label_encoder': le,
        'classes': le.classes_.tolist()
    }
    
    model_path = 'source_classification_model.pkl'
    with open(model_path, 'wb') as f:
        pickle.dump(model_data, f)
        
    print(f"\nModel effectively trained and saved to {model_path}")

if __name__ == '__main__':
    train_source_model()




