import streamlit as st
import pandas as pd

st.title("InsightRush - Approx Query Engine")

file = st.file_uploader("Upload CSV")

if file:
    df = pd.read_csv(file)

    fraction = st.slider("Sample Fraction", 0.01, 1.0, 0.1)

    sample_df = df.sample(frac=fraction)

    approx_count = len(sample_df) / fraction
    exact_count = len(df)

    st.write("### Results")
    st.write("Approx COUNT:", approx_count)
    st.write("Exact COUNT:", exact_count)