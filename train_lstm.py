import pandas as pd
import numpy as np
import pickle
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping

# 1. Load Data
print("Loading dataset...")
df = pd.read_csv('processed_data.csv')

# 2. Select Features
# Using pollutants and weather as inputs for the LSTM
features = ['pm25', 'pm10', 'no2', 'so2', 'co', 'temperature', 'humidity', 'wind_speed', 'aqi']
df['datetime'] = pd.to_datetime(df['datetime'])

# 3. Preprocessing: Station-wise Resampling
print("Resampling data to hourly intervals (this might take a moment)...")
processed_data = []
stations = df['station'].unique()

for station in stations:
    station_df = df[df['station'] == station].copy()
    station_df = station_df.sort_values('datetime')
    # Handle duplicate timestamps by averaging only the numeric features we need
    station_df = station_df.groupby('datetime')[features].mean()
    
    # Resample to Hourly (h) and interpolate missing gaps to get smooth sequences
    station_df = station_df.resample('h').interpolate(method='linear')
    station_df = station_df.dropna() # Drop edges that couldn't be interpolated
    
    processed_data.append(station_df)

# Combine back
full_df = pd.concat(processed_data)

# 4. Scaling
print("Scaling features...")
scaler = MinMaxScaler(feature_range=(0, 1))
scaled_data = scaler.fit_transform(full_df)

# Save the scaler for use in app.py
with open('lstm_scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)

# 5. Create Sequences and Split Per Station
def create_sequences_and_split(lookback=72):
    train_X, test_X, train_y, test_y = [], [], [], []
    current_idx = 0
    
    for station_df in processed_data:
        n_samples = len(station_df)
        station_scaled = scaled_data[current_idx : current_idx + n_samples]
        
        station_X, station_y = [], []
        for i in range(lookback, n_samples):
            station_X.append(station_scaled[i-lookback : i])
            station_y.append(station_scaled[i, -1]) # Predicting 'aqi'
            
        station_X = np.array(station_X)
        station_y = np.array(station_y)
        
        # Split 80/20 chronologically for this station
        if len(station_X) > 0:
            split_idx = int(len(station_X) * 0.8)
            train_X.extend(station_X[:split_idx])
            train_y.extend(station_y[:split_idx])
            test_X.extend(station_X[split_idx:])
            test_y.extend(station_y[split_idx:])
            
        current_idx += n_samples
        
    return np.array(train_X), np.array(test_X), np.array(train_y), np.array(test_y)

lookback_hours = 72
print(f"Creating and splitting 3D sequences (Lookback: {lookback_hours} hours)...")
train_X, test_X, train_y, test_y = create_sequences_and_split(lookback=lookback_hours)

print(f"Train Shape: {train_X.shape}")

# 7. Build LSTM Model
print("Building LSTM model...")
model = Sequential([
    LSTM(units=50, return_sequences=True, input_shape=(train_X.shape[1], train_X.shape[2])),
    Dropout(0.2),
    LSTM(units=50, return_sequences=False),
    Dropout(0.2),
    Dense(units=25),
    Dense(units=1)
])

model.compile(optimizer='adam', loss='mean_squared_error')

# 8. Train
print("Starting training...")
early_stop = EarlyStopping(monitor='loss', patience=3)
model.fit(
    train_X, train_y, 
    epochs=10, 
    batch_size=256, 
    validation_split=0.1,
    callbacks=[early_stop]
)

# 9. Save Model
print("Saving model...")
model.save('lstm_aqi_model.h5')
print("LSTM implementation complete! Scaler and Model are ready.")







