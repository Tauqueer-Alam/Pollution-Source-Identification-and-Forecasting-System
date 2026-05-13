import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
import pickle
import os

def run_training():
    print("Loading high-quality spatial dataset...")
    data = pd.read_csv('source_identification_dataset.csv')
    
    # Calculate target (24h ahead) and lag (24h behind)
    # We group by station to ensure shift is accurate per city
    data['datetime'] = pd.to_datetime(data['date']) # or 'datetime' if it exists
    data = data.sort_values(['station', 'datetime'])
    
    data['target_aqi'] = data.groupby('station')['aqi'].shift(-24)
    data['aqi_lag_24'] = data.groupby('station')['aqi'].shift(24)
    
    data = data.dropna(subset=['target_aqi', 'aqi_lag_24'])

    from sklearn.ensemble import HistGradientBoostingRegressor
    from sklearn.inspection import permutation_importance
    from sklearn.model_selection import RandomizedSearchCV

    features = [
        'pm25', 'pm10', 'no2', 'so2', 'co', 'o3', 
        'temperature', 'humidity', 'wind_speed', 'visibility',
        'month', 'hour', 'is_weekend', 'nearby_fires', 'frp', 'aqi_lag_24'
    ]
    
    print(f"Training on features: {features}")
    
    # Filter out features that might not be in the dataframe entirely, though they should be
    features = [f for f in features if f in data.columns]
    
    X = data[features]
    y = data['target_aqi']
    
    X = X.fillna(X.mean())
    y = y.fillna(y.mean())
    
    # Sort purely by datetime before split to ensure global chronological future modeling
    data = data.sort_values('datetime')
    X_sorted = X.loc[data.index]
    y_sorted = y.loc[data.index]
    
    # Chronological Split (No Shuffling) to prevent data leakage
    X_train, X_test, y_train, y_test = train_test_split(X_sorted, y_sorted, test_size=0.2, shuffle=False)
    
    # Define Parameter Grid for tuning
    param_distributions = {
        'max_iter': [200, 400, 600],
        'learning_rate': [0.01, 0.05, 0.1],
        'max_depth': [7, 10, 15, None],
        'l2_regularization': [0.0, 0.1, 1.0]
    }
    
    base_model = HistGradientBoostingRegressor(random_state=42)
    print("Running RandomizedSearchCV for Hyperparameter Tuning. This may take a moment...")
    search = RandomizedSearchCV(
        base_model, 
        param_distributions, 
        n_iter=10, 
        cv=3, 
        verbose=1, 
        random_state=42, 
        n_jobs=-1
    )
    search.fit(X_train, y_train)
    
    model = search.best_estimator_
    print(f"Best parameters found: {search.best_params_}")

    train_score = model.score(X_train, y_train) * 100
    test_score = model.score(X_test, y_test) * 100
    print(f"Regression model trained. Train Score: {train_score:.2f}%, Test Score: {test_score:.2f}%")

    # Feature importance using SHAP (Gold Standard)
    import shap
    print("Calculating SHAP values for true, unbiased feature importance...")
    
    # SHAP Explainer for Gradient Boosting
    # We use a sample of data for faster calculation if dataset is large, 
    # but here we use the test set for precision.
    explainer = shap.Explainer(model)
    shap_values = explainer(X_test)
    
    # Global importance is the mean absolute SHAP value for each feature
    # This represents the average impact on the model output (AQI points)
    importance_scores = np.abs(shap_values.values).mean(axis=0)
    
    feat_imp = pd.DataFrame({'Feature': features, 'Importance': importance_scores.astype(float)})
    
    # DO NOT NORMALIZE - Keep it as RAW Impact on AQI points
    feat_imp = feat_imp.sort_values(by='Importance', ascending=False)
    
    with open('model.pkl', 'wb') as f:
        pickle.dump({
            'model': model,
            'features': features,
            'feature_importance': feat_imp.to_dict('records')
        }, f)
    print("Optimization complete: model.pkl importance now uses SHAP (Absolute Impact).")

if __name__ == '__main__':
    run_training()
