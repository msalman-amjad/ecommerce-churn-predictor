"use client";
import { useState, FormEvent } from "react";

// Define the exact shape and types for our form state
interface FormData {
  days_since_purchase: string;
  total_spend: string;
  subscription_type: string;
}

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    days_since_purchase: "",
    total_spend: "",
    subscription_type: "0",
  });

  // Prediction can be a number (0 or 1) or null before the user submits
  const [prediction, setPrediction] = useState<number | null>(null);

  // Strictly type the form submission event
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Convert the string inputs back to numbers for the Python backend
          days_since_purchase: parseFloat(formData.days_since_purchase),
          total_spend: parseFloat(formData.total_spend),
          subscription_type: parseInt(formData.subscription_type),
        }),
      });

      const data = await response.json();
      setPrediction(data.churn_prediction);
    } catch (error) {
      console.error("Error communicating with the API:", error);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-400">Churn Predictor</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm mb-1">Days Since Last Purchase</label>
            <input
              type="number"
              required
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
              value={formData.days_since_purchase}
              onChange={(e) => setFormData({ ...formData, days_since_purchase: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Total Spend ($)</label>
            <input
              type="number"
              step="0.01"
              required
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
              value={formData.total_spend}
              onChange={(e) => setFormData({ ...formData, total_spend: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Subscription Type</label>
            <select
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
              value={formData.subscription_type}
              onChange={(e) => setFormData({ ...formData, subscription_type: e.target.value })}
            >
              <option value="0">Basic (0)</option>
              <option value="1">Premium (1)</option>
            </select>
          </div>

          <button
            type="submit"
            className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Predict Churn Risk
          </button>
        </form>

        {prediction !== null && (
          <div className={`mt-6 p-4 rounded text-center font-bold ${prediction === 1 ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'}`}>
            {prediction === 1 ? "High Risk: Likely to Churn" : "Low Risk: Likely to Stay"}
          </div>
        )}
      </div>
    </main>
  );
}