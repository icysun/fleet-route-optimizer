#!/usr/bin/env python

import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error

# Assuming the historical route data is loaded into a DataFrame called 'historical_data'
# historical_data should have features and a target column 'distance'

# Split the data into features and target
X = historical_data.drop('distance', axis=1)
Y = historical_data['distance']

# Split the data into training and testing sets
X_train, X_test, Y_train, Y_test = train_test_split(X, Y, test_size=0.2, random_state=42)

# Initialize the ML model
model = RandomForestRegressor(n_estimators=100, random_state=42)

# Train the model
model.fit(X_train, Y_train)

# Make predictions on the test set
predictions = model.predict(X_test)

# Evaluate the model
mse = mean_squared_error(Y_test, predictions)
print(f'Mean Squared Error: {mse}')

# Function to predict a new route
def predict_route(new_route_features):
    return model.predict([new_route_features])[0]

# Example usage
# new_route_features = [list of new route features]
# predicted_distance = predict_route(new_route_features)
