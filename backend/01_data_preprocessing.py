import pandas as pd
df=pd.read_csv('backend/dataset.csv')
print (df.head())

### ACT 2: The Inspection ###
print("--- ACT 2: FINDING THE MISSING DATA ---")
# .isnull().sum() counts exactly how many empty spots exist in each column
print(df.isnull().sum())
print("\n")

### ACT 3: The Cleanup (Imputation) ###
# 1. Calculate the mathematical average of the total_spend column
mean_spend = df['total_spend'].mean()
# 2. Inject that average into the empty spots
df['total_spend'] = df['total_spend'].fillna(mean_spend)
# 3. Inject the most popular tier ('Basic') into the empty subscription spots
df['subscription_type'] = df['subscription_type'].fillna('Basic')

# Map the text strings into binary numbers (0s and 1s)
df['subscription_type'] = df['subscription_type'].map({'Basic': 0, 'Premium': 1})


# Drop the useless user_id column (axis=1 tells Pandas to drop a vertical column, not a horizontal row)
df = df.drop('user_id', axis=1)


print("--- ACT 6: THE CLEANED DATA ---")
print(df.head())

# Export the pristine, purely numeric data to a brand new file
df.to_csv('backend/cleaned_dataset.csv', index=False)
print("\nSuccess! Saved to cleaned_dataset.csv")