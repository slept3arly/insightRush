import pandas as pd

# Load data
df = pd.read_csv("data/sample.csv")

# Sampling
sample_fraction = 0.2
sample_df = df.sample(frac=sample_fraction)

# Functions
def count_rows(data):
    return len(data)

def sum_column(data, col):
    return data[col].sum()

def avg_column(data, col):
    return data[col].mean()

# Approximation logic
def approximate_count(sample_count, fraction):
    return sample_count / fraction

def approximate_sum(sample_sum, fraction):
    return sample_sum / fraction

# Run
sample_count = count_rows(sample_df)
approx_count = approximate_count(sample_count, sample_fraction)

exact_count = len(df)

print("=== RESULTS ===")
print("Exact COUNT:", exact_count)
print("Approx COUNT:", approx_count)