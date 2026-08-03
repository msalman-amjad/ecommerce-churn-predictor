# E-Commerce Churn Predictor 🛒✨

An end-to-end machine learning pipeline and premium web application designed to predict e-commerce customer churn. This project leverages the power of Python-based machine learning for accurate predictions, FastAPI for robust model serving, and Next.js for a beautiful, user-friendly frontend interface.

## 📖 The Story of the Project

In the highly competitive e-commerce space, retaining customers is just as critical as acquiring new ones. We set out to build a tool that helps businesses identify at-risk customers *before* they leave. 

### Part 1: The Data & The Model (Backend)
We started with raw customer data (`dataset_5000.csv`), consisting of key behavioral metrics:
- **Days Since Purchase**: How recently the user interacted with the platform.
- **Total Spend**: The lifetime monetary value of the customer.
- **Subscription Type**: Whether the user is on a Basic (0) or Premium (1) tier.

Through our `01_data_preprocessing.py` script, we cleaned the dataset and prepared it for modeling. Then, using `02_model_training.py`, we trained a **Logistic Regression** model using Scikit-Learn to find the mathematical boundary between active customers and those likely to churn. Once trained and achieving a high accuracy (~88.9%), the model was serialized into `churn_model.pkl`.

To make these predictions accessible, we built a **FastAPI** backend (`api.py`). It exposes a lightning-fast endpoint that takes customer data and returns a real-time churn risk assessment (0 = Safe, 1 = High Risk).

### Part 2: The User Experience (Frontend)
A powerful model needs an equally powerful user interface. We built a modern, responsive web application using **Next.js** and **Tailwind CSS**. 

We aimed for a premium aesthetic—dark mode, glowing gradients (indigo and purple), and sleek animations. 
The frontend provides two main tools for businesses:
1. **Manual Entry**: A simple, intuitive form where support agents can punch in a single customer's data and instantly see their churn risk. They can then export this single result straight to an Excel file with one click.
2. **Batch Upload (Excel)**: For analyzing entire customer bases at once, we integrated SheetJS (`xlsx`). Users can upload an Excel sheet or CSV of thousands of customers. The frontend automatically parses the data, securely queries the API for each row, and instantly downloads a new, fully populated Excel file containing a "Risk of Churn" column.

## 🚀 Tech Stack

### Backend
- **Python**: Core programming language.
- **Pandas**: Data manipulation and cleaning.
- **Scikit-Learn**: Machine learning (Logistic Regression).
- **FastAPI**: High-performance API framework.
- **Joblib**: Model serialization.

### Frontend
- **Next.js / React**: UI Framework.
- **Tailwind CSS**: Styling and responsive design.
- **Lucide React**: Beautiful vector icons.
- **SheetJS (xlsx)**: Client-side Excel parsing and generation.

## ⚙️ How to Run Locally

### Backend Setup
1. Navigate to the root directory.
2. Activate your virtual environment: `.\venv\Scripts\activate` (Windows)
3. Run the FastAPI server: 
   ```bash
   uvicorn backend.api:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies (if you haven't already): `npm install`
3. Run the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open your browser to `http://localhost:3000`.

---
*Built to help businesses retain their most valuable asset: their customers.*
