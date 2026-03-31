import pandas as pd
import numpy as np
import joblib
import os

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score

# dataset path

FILE_PATH = "Spatial_GW_Dataset_2015_Enhanced.csv"

if not os.path.exists(FILE_PATH):
    raise FileNotFoundError("Dataset file not found! Check path.")

try:
    df = pd.read_csv(FILE_PATH)
    print(" Dataset loaded successfully")
except Exception as e:
    print(" Error loading dataset:", e)
    exit()

# BASIC CLEANING

print("\n Checking missing values...")
print(df.isnull().sum())

# Fill missing values
df = df.fillna(df.median(numeric_only=True))

# FEATURES & TARGET

if "GW_Level" not in df.columns:
    raise ValueError("Target column 'GW_Level' not found!")

X = df.drop("GW_Level", axis=1)
y = df["GW_Level"]

# TRAIN-TEST SPLIT

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# FEATURE SCALING

scaler = StandardScaler()

try:
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
except Exception as e:
    print(" Scaling error:", e)
    exit()

# 

model = RandomForestRegressor(
    n_estimators=200,
    max_depth=10,
    random_state=42
)

try:
    model.fit(X_train_scaled, y_train)
    print(" Model training complete")
except Exception as e:
    print(" Model training error:", e)
    exit()

# EVALUATION

y_pred = model.predict(X_test_scaled)

mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print("\n MODEL PERFORMANCE")
print("MSE:", mse)
print("R2 Score:", r2)

# SAVED MODEL & SCALER

try:
    joblib.dump(model, "gw_model.pkl")
    joblib.dump(scaler, "scaler.pkl")
    print(" Model & Scaler saved")
except Exception as e:
    print(" Saving error:", e)

# PREDICTED FUNCTION

def predict_gw(input_data):
    try:
        import pandas as pd

        columns = X.columns.tolist()  # automatic correct order

        input_df = pd.DataFrame([input_data], columns=columns)

        input_scaled = scaler.transform(input_df)

        prediction = model.predict(input_scaled)

        return prediction[0]

    except Exception as e:
        print(" Prediction error:", e)
        return None

# TEST PREDICTION

print("\n Testing prediction...")

sample = [21.1458, 79.0882, 1200, 15, 200, 180, 75]

result = predict_gw(sample)

if result is not None:
    print(" Predicted GW Level:", result)
else:
    print(" Prediction failed")