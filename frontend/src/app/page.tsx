"use client";
import { useState, FormEvent, useRef } from "react";
import * as XLSX from "xlsx";
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  BarChart3,
  Users
} from "lucide-react";

interface FormData {
  days_since_purchase: string;
  total_spend: string;
  subscription_type: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"manual" | "batch">("manual");
  
  // Manual Form States
  const [formData, setFormData] = useState<FormData>({
    days_since_purchase: "",
    total_spend: "",
    subscription_type: "0",
  });
  const [prediction, setPrediction] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastSubmitted, setLastSubmitted] = useState<FormData | null>(null);

  // Batch Upload States
  const [file, setFile] = useState<File | null>(null);
  const [batchLoading, setBatchLoading] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = "https://ecommerce-churn-predictor-lsvw.onrender.com/";

  // --- MANUAL ENTRY LOGIC ---
  const handleManualSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setPrediction(null);
    setLastSubmitted(formData);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          days_since_purchase: parseFloat(formData.days_since_purchase),
          total_spend: parseFloat(formData.total_spend),
          subscription_type: parseInt(formData.subscription_type),
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch prediction.");
      const data = await response.json();
      setPrediction(data.churn_prediction);
    } catch (error) {
      console.error("Error communicating with the API:", error);
      setErrorMsg("Connecting to backend... Free tier servers may take up to 30s to wake up.");
    } finally {
      setLoading(false);
    }
  };

  const exportManualToExcel = () => {
    if (!lastSubmitted || prediction === null) return;
    
    const data = [{
      "Days Since Purchase": lastSubmitted.days_since_purchase,
      "Total Spend": lastSubmitted.total_spend,
      "Subscription Type": lastSubmitted.subscription_type === "1" ? "Premium" : "Basic",
      "Risk of Churn": prediction === 1 ? "High" : "Low",
      "Churn Prediction Code": prediction
    }];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Prediction");
    XLSX.writeFile(wb, "manual_churn_prediction.xlsx");
  };

  // --- BATCH UPLOAD LOGIC ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setBatchError(null);
    }
  };

  const processBatchUpload = async () => {
    if (!file) return;
    setBatchLoading(true);
    setBatchError(null);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

      if (jsonData.length === 0) {
        throw new Error("The uploaded Excel file is empty.");
      }

      setBatchProgress({ current: 0, total: jsonData.length });
      const results = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        
        // Try to flexibly map column names
        const getVal = (keys: string[]) => {
          const key = Object.keys(row).find(k => keys.includes(k.toLowerCase().trim().replace(/_/g, ' ')));
          return key ? row[key] : 0;
        };

        const days = parseFloat(getVal(['days since purchase', 'days_since_purchase', 'days inactive', 'days'])) || 0;
        const spend = parseFloat(getVal(['total spend', 'total_spend', 'spend', 'amount'])) || 0;
        let subType = getVal(['subscription type', 'subscription_type', 'subscription', 'tier']);
        
        // Map string 'Premium'/'Basic' to 1/0 if necessary
        let subTypeInt = 0;
        if (typeof subType === 'string') {
          subTypeInt = subType.toLowerCase().includes('premium') ? 1 : 0;
        } else {
          subTypeInt = parseInt(subType) || 0;
        }

        try {
          const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              days_since_purchase: days,
              total_spend: spend,
              subscription_type: subTypeInt,
            }),
          });
          
          if (response.ok) {
            const predData = await response.json();
            results.push({
              ...row,
              "Risk of Churn": predData.churn_prediction === 1 ? "High Risk" : "Low Risk",
            });
          } else {
            results.push({ ...row, "Risk of Churn": "Error" });
          }
        } catch (e) {
          results.push({ ...row, "Risk of Churn": "API Error" });
        }
        
        setBatchProgress({ current: i + 1, total: jsonData.length });
      }

      // Generate new Excel
      const newWs = XLSX.utils.json_to_sheet(results);
      const newWb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(newWb, newWs, "Predictions");
      XLSX.writeFile(newWb, "batch_churn_predictions.xlsx");
      
      setBatchProgress(null);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (error: any) {
      console.error(error);
      setBatchError(error.message || "An error occurred while processing the file.");
    } finally {
      setBatchLoading(false);
    }
  };

  const isHighSpend = parseFloat(formData.total_spend) > 1000;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 flex flex-col font-sans selection:bg-indigo-500/30">
      
      {/* Decorative Background Effects */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Hero Section */}
      <header className="relative pt-24 pb-12 px-6 flex flex-col items-center text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-6 backdrop-blur-md">
          <BarChart3 className="w-4 h-4" />
          <span>AI-Powered Insights</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
          Predict Customer <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient-x">
            Churn with Precision
          </span>
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Upload your customer data or enter metrics manually. Our advanced machine learning model 
          analyzes purchase history and engagement to identify high-risk accounts before they leave.
        </p>
      </header>

      {/* Main Content App */}
      <main className="flex-1 flex flex-col items-center px-6 pb-24 z-10">
        
        {/* Tabs */}
        <div className="flex bg-gray-900/80 backdrop-blur-md p-1 rounded-2xl border border-gray-800 mb-8 shadow-xl">
          <button 
            onClick={() => setActiveTab("manual")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === "manual" 
                ? "bg-indigo-600 text-white shadow-lg" 
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
            }`}
          >
            <Users className="w-4 h-4" />
            Manual Entry
          </button>
          <button 
            onClick={() => setActiveTab("batch")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === "batch" 
                ? "bg-indigo-600 text-white shadow-lg" 
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Batch Upload
          </button>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-lg bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-gray-800 relative">
          
          {/* MANUAL TAB */}
          {activeTab === "manual" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {errorMsg && (
                <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{errorMsg}</p>
                </div>
              )}

              <form onSubmit={handleManualSubmit} className="flex flex-col gap-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-300">Days Since Last Purchase</label>
                  <input
                    type="number" min="0" max="365" required
                    className="w-full p-3.5 rounded-xl bg-gray-950/80 border border-gray-800 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    placeholder="e.g., 14"
                    value={formData.days_since_purchase}
                    onChange={(e) => setFormData({ ...formData, days_since_purchase: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-300">Total Spend ($)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-500 font-medium">$</span>
                    </div>
                    <input
                      type="number" step="0.01" min="0" required
                      className={`w-full p-3.5 pl-9 rounded-xl bg-gray-950/80 border text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 transition-all ${
                        isHighSpend 
                          ? 'border-amber-500/50 focus:border-amber-500 focus:ring-amber-500/50' 
                          : 'border-gray-800 focus:border-indigo-500 focus:ring-indigo-500/50'
                      }`}
                      placeholder="0.00"
                      value={formData.total_spend}
                      onChange={(e) => setFormData({ ...formData, total_spend: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-300">Subscription Tier</label>
                  <select
                    className="w-full p-3.5 rounded-xl bg-gray-950/80 border border-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all cursor-pointer"
                    value={formData.subscription_type}
                    onChange={(e) => setFormData({ ...formData, subscription_type: e.target.value })}
                  >
                    <option value="0">Basic Plan</option>
                    <option value="1">Premium Plan</option>
                  </select>
                </div>

                <button
                  type="submit" disabled={loading}
                  className={`mt-4 w-full relative overflow-hidden rounded-xl font-semibold text-sm px-4 py-4 transition-all duration-300 ${
                    loading 
                      ? 'bg-indigo-600/50 text-indigo-200 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] active:scale-[0.98]'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

              {/* Prediction Results */}
              {prediction !== null && !loading && (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className={`p-6 rounded-2xl border ${
                    prediction === 1 ? 'bg-red-950/20 border-red-900/50' : 'bg-emerald-950/20 border-emerald-900/50'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${prediction === 1 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {prediction === 1 ? <XCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                        </div>
                        <div>
                          <h3 className={`text-lg font-bold ${prediction === 1 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {prediction === 1 ? "High Risk: Likely to Churn" : "Low Risk: Likely to Stay"}
                          </h3>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={exportManualToExcel}
                      className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-700 hover:border-gray-500 hover:bg-gray-800/50 transition-all text-sm font-medium text-gray-300"
                    >
                      <Download className="w-4 h-4" />
                      Export to Excel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BATCH TAB */}
          {activeTab === "batch" && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {batchError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{batchError}</p>
                </div>
              )}

              <div 
                className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
                  file ? 'border-indigo-500 bg-indigo-500/5' : 'border-gray-800 hover:border-gray-600 hover:bg-gray-900/50'
                }`}
              >
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  disabled={batchLoading}
                />
                
                <div className="flex flex-col items-center justify-center pointer-events-none">
                  {file ? (
                    <>
                      <div className="w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                        <FileSpreadsheet className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-200">{file.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-gray-800/50 text-gray-400 flex items-center justify-center mb-4">
                        <UploadCloud className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-200">Upload Excel Data</h3>
                      <p className="text-sm text-gray-500 mt-2 max-w-[200px]">
                        Drag and drop your .xlsx or .csv file here, or click to browse.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {batchProgress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Processing records...</span>
                    <span>{batchProgress.current} / {batchProgress.total}</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={processBatchUpload}
                disabled={!file || batchLoading}
                className={`w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-sm px-4 py-4 transition-all duration-300 ${
                  !file || batchLoading
                    ? 'bg-indigo-600/30 text-indigo-200/50 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] active:scale-[0.98]'
                }`}
              >
                {batchLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-indigo-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing Data...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Process & Download Results
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-900/50 bg-gray-950/50 backdrop-blur-md py-8 z-10 text-center">
        <p className="text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Churn Predictor AI. Built with precision.
        </p>
      </footer>
    </div>
  );
}