from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd
import os

# ACT 1: INITIALIZE THE API AND LOAD THE MODEL
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "churn_model.pkl")

print(f"Loading model from: {MODEL_PATH}")
model = joblib.load(MODEL_PATH)


# ACT 2: DEFINE THE INPUT DATA STRUCTURE
# This forces the frontend to send exactly these three pieces of data
class CustomerData(BaseModel):
    days_since_purchase: float
    total_spend: float
    subscription_type: int

# ACT 3: CREATE THE PREDICTION ENDPOINT
# When the frontend sends a POST request to this URL, this function runs
@app.post("/")
def predict_churn(data: CustomerData):
    # Convert the incoming web data into a Pandas DataFrame that the model can read
    input_data = pd.DataFrame([{
        'days_since_purchase': data.days_since_purchase,
        'total_spend': data.total_spend,
        'subscription_type': data.subscription_type
    }])
    
    # Feed the data into the loaded pickle file to get a prediction
    prediction = model.predict(input_data)
    
    # Return a JSON response back to the frontend (0 = will stay, 1 = will churn)
    return {"churn_prediction": int(prediction[0])}