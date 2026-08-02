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

  // UI States
  const [prediction, setPrediction] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastSubmitted, setLastSubmitted] = useState<FormData | null>(null);

  // Strictly type the form submission event
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setPrediction(null);
    setLastSubmitted(formData);

    try {
      // Connect to Render backend API (use environment variable with a fallback)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://ecommerce-churn-predictor-lsvw.onrender.com/";
      
      const response = await fetch(API_URL, {
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

      if (!response.ok) {
        throw new Error("Failed to fetch prediction.");
      }

      const data = await response.json();
      setPrediction(data.churn_prediction);
    } catch (error) {
      console.error("Error communicating with the API:", error);
      setErrorMsg("Connecting to backend... Free tier servers may take up to 30s to wake up.");
    } finally {
      setLoading(false);
    }
  };

  // Warning for high spend
  const isHighSpend = parseFloat(formData.total_spend) > 1000;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 flex flex-col items-center justify-center p-6 selection:bg-indigo-500/30">
      <div className="max-w-lg w-full bg-gray-900/50 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-gray-800 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-indigo-500/10 blur-[80px] pointer-events-none rounded-full" />
        
        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-2">
              Churn Predictor
            </h1>
            <p className="text-sm text-gray-400">
              AI-powered risk analysis for e-commerce customers
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-start gap-3">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p>{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">
                Days Since Last Purchase
              </label>
              <input
                type="number"
                min="0"
                max="365"
                required
                className="w-full p-3 rounded-xl bg-gray-950/50 border border-gray-800 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                placeholder="e.g., 14"
                value={formData.days_since_purchase}
                onChange={(e) => setFormData({ ...formData, days_since_purchase: e.target.value })}
              />
              <p className="text-xs text-gray-500 pl-1">Must be between 0 and 365 days.</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">
                Total Spend ($)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-medium">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className={`w-full p-3 pl-8 rounded-xl bg-gray-950/50 border text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 transition-all ${
                    isHighSpend 
                      ? 'border-amber-500/50 focus:border-amber-500 focus:ring-amber-500/50' 
                      : 'border-gray-800 focus:border-indigo-500 focus:ring-indigo-500/50'
                  }`}
                  placeholder="0.00"
                  value={formData.total_spend}
                  onChange={(e) => setFormData({ ...formData, total_spend: e.target.value })}
                />
              </div>
              {isHighSpend ? (
                <p className="text-xs text-amber-500 pl-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Values &gt; $1,000 may fall outside optimal model calibration.
                </p>
              ) : (
                <p className="text-xs text-gray-500 pl-1">Lifetime spending amount.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">
                Subscription Tier
              </label>
              <div className="relative">
                <select
                  className="w-full p-3 rounded-xl bg-gray-950/50 border border-gray-800 text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all cursor-pointer"
                  value={formData.subscription_type}
                  onChange={(e) => setFormData({ ...formData, subscription_type: e.target.value })}
                >
                  <option value="0">Basic Plan</option>
                  <option value="1">Premium Plan</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`mt-4 w-full relative overflow-hidden rounded-xl font-semibold text-sm px-4 py-3.5 transition-all duration-300 ${
                loading 
                  ? 'bg-indigo-600/50 text-indigo-200 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing Risk...
                </span>
              ) : (
                "Predict Churn Risk"
              )}
            </button>
          </form>

          {/* Prediction Results Area */}
          {prediction !== null && !loading && lastSubmitted && (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className={`p-6 rounded-2xl border ${
                prediction === 1 
                  ? 'bg-red-950/30 border-red-900/50' 
                  : 'bg-emerald-950/30 border-emerald-900/50'
              }`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-full flex-shrink-0 ${
                    prediction === 1 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {prediction === 1 ? (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${prediction === 1 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {prediction === 1 ? "High Risk: Likely to Churn" : "Low Risk: Likely to Stay"}
                    </h3>
                    <p className={`text-sm mt-1 ${prediction === 1 ? 'text-red-300/80' : 'text-emerald-300/80'}`}>
                      {prediction === 1 
                        ? "Action required. Consider sending a re-engagement offer immediately." 
                        : "Customer is healthy. Continue providing great service."}
                    </p>
                  </div>
                </div>
                
                <div className={`mt-4 pt-4 border-t text-sm flex justify-between ${
                  prediction === 1 ? 'border-red-900/30 text-red-300/60' : 'border-emerald-900/30 text-emerald-300/60'
                }`}>
                  <span>{lastSubmitted.days_since_purchase} days inactive</span>
                  <span>&bull;</span>
                  <span>${parseFloat(lastSubmitted.total_spend).toFixed(2)} spent</span>
                  <span>&bull;</span>
                  <span>{lastSubmitted.subscription_type === "1" ? "Premium" : "Basic"} tier</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}