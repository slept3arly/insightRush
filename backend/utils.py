import pandas as pd
import time

# Accuracy → sampling fraction
def get_fraction(accuracy: int):
    if accuracy >= 99:
        return 0.25
    elif accuracy >= 95:
        return 0.1
    elif accuracy >= 90:
        return 0.05
    return 0.1


def compute_exact(df, query_type, column=None, group_by=None):
    start = time.perf_counter()

    if query_type == "COUNT":
        result = len(df)

    elif query_type == "SUM":
        result = df[column].sum()

    elif query_type == "AVG":
        result = df[column].mean()

    elif query_type == "GROUP_BY_SUM":
        grouped = df.groupby(group_by)[column].sum()
        result = grouped.to_dict()
    else:
        raise ValueError("Unsupported query type")

    # Convert potential numpy types to standard python types for JSON serialization
    if hasattr(result, "item"):
        result = result.item()
    elif isinstance(result, dict):
        result = {k: (v.item() if hasattr(v, "item") else v) for k, v in result.items()}

    end = time.perf_counter()

    return result, (end - start)


def compute_approx(df, query_type, fraction, column=None, group_by=None):
    start = time.perf_counter()

    sample_df = df.sample(frac=fraction)

    if query_type == "COUNT":
        result = len(sample_df) / fraction

    elif query_type == "SUM":
        result = sample_df[column].sum() / fraction

    elif query_type == "AVG":
        result = sample_df[column].mean()

    elif query_type == "GROUP_BY_SUM":
        grouped = sample_df.groupby(group_by)[column].sum()
        result = (grouped / fraction).to_dict()

    else:
        raise ValueError("Unsupported query type")

    # Convert potential numpy types to standard python types for JSON serialization
    if hasattr(result, "item"):
        result = result.item()
    elif isinstance(result, dict):
        result = {k: (v.item() if hasattr(v, "item") else v) for k, v in result.items()}

    end = time.perf_counter()

    return result, (end - start)


def calculate_error(exact, approx):
    if isinstance(exact, dict):
        errors = {}
        for k in exact:
            exact_val = exact.get(k, 0)
            approx_val = approx.get(k, 0)

            if exact_val != 0:
                val = abs(exact_val - approx_val) / abs(exact_val) * 100
                errors[k] = float(val.item()) if hasattr(val, "item") else float(val)
            else:
                errors[k] = 0.0

        return errors
    else:
        if exact == 0:
            return 0.0
        val = abs(exact - approx) / abs(exact) * 100
        return float(val.item()) if hasattr(val, "item") else float(val)