import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
import joblib

# ACT 1: LOAD THE DATA
print("Loading cleaned dataset...")
df = pd.read_csv('backend/cleaned_dataset.csv')

# ACT 2: SEPARATE FEATURES AND TARGET
# X contains everything except the churn column (our inputs)
# y contains only the churn column (our output/prediction target)
X = df.drop('churn', axis=1)
y = df['churn']

# ACT 3: SPLIT THE DATA
# We use 80% of the data to train the model, and hold back 20% to test it
print("Splitting data into train and test sets...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# ACT 4: TRAIN THE MODEL
print("Training the Logistic Regression model...")
model = LogisticRegression()
model.fit(X_train, y_train)

# ACT 5: TEST THE MODEL
# We ask the model to predict outcomes for the 20% of data it hasn't seen yet
predictions = model.predict(X_test)

# ACT 6: EVALUATE ACCURACY
# We compare the model's predictions against the actual real-world answers
accuracy = accuracy_score(y_test, predictions)
print(f"Model Accuracy: {accuracy * 100:.2f}%")

# ACT 7: SAVE THE MODEL
# We export the trained brain to a .pkl file so we can connect it to your web API later
print("Saving the trained model...")
joblib.dump(model, 'backend/churn_model.pkl')
print("Success! Model saved to backend/churn_model.pkl")