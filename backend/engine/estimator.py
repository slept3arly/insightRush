import math
from core.config import Config


def get_z(confidence: float):
    return Config.Z_SCORES.get(confidence, 1.96)


# -------------------------
# SUM
# -------------------------
def estimate_sum(sample_values, fraction, confidence=0.95):
    n = len(sample_values)

    if n == 0:
        return {"estimate": 0, "error_margin": 0, "confidence": confidence}

    Z = get_z(confidence)

    sample_sum = sum(sample_values)
    scaled_sum = sample_sum / fraction

    mean = sample_sum / n
    variance = sum((x - mean) ** 2 for x in sample_values) / max(n - 1, 1)

    std_error = math.sqrt(variance / n)

    error_margin = Z * std_error / fraction

    return {
        "estimate": scaled_sum,
        "error_margin": error_margin,
        "confidence": confidence
    }


# -------------------------
# COUNT
# -------------------------
def estimate_count(sample_count, fraction, confidence=0.95):
    if sample_count == 0:
        return {"estimate": 0, "error_margin": 0, "confidence": confidence}

    Z = get_z(confidence)

    estimate = sample_count / fraction

    variance = sample_count  # poisson approx

    std_error = math.sqrt(variance) / fraction

    error_margin = Z * std_error

    return {
        "estimate": estimate,
        "error_margin": error_margin,
        "confidence": confidence
    }


# -------------------------
# AVG
# -------------------------
def estimate_avg(sample_values, confidence=0.95):
    n = len(sample_values)

    if n == 0:
        return {"estimate": 0, "error_margin": 0, "confidence": confidence}

    Z = get_z(confidence)

    mean = sum(sample_values) / n

    variance = sum((x - mean) ** 2 for x in sample_values) / max(n - 1, 1)

    std_error = math.sqrt(variance / n)

    error_margin = Z * std_error

    return {
        "estimate": mean,
        "error_margin": error_margin,
        "confidence": confidence
    }


# -------------------------
# GROUP BY (FULL CI SUPPORT)
# -------------------------
def estimate_groupby(rows, fraction, query_type, confidence=0.95):
    Z = get_z(confidence)

    results = {}

    for row in rows:
        group = row["grp"]
        sample_count = row["sample_count"]
        value = row["agg_value"]

        if sample_count == 0:
            continue

        if query_type == "SUM":
            estimate = value / fraction
            variance = value / sample_count if sample_count > 0 else 0
            std_error = math.sqrt(variance / sample_count) / fraction

        elif query_type == "COUNT":
            estimate = sample_count / fraction
            variance = sample_count
            std_error = math.sqrt(variance) / fraction

        elif query_type == "AVG":
            estimate = value
            variance = value  # approximation
            std_error = math.sqrt(variance / sample_count)

        error_margin = Z * std_error

        results[group] = {
            "estimate": estimate,
            "error_margin": error_margin,
            "confidence": confidence
        }

    return results