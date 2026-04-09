import math
from backend.core.config import Config


# -------------------------
# Z SCORE
# -------------------------
def get_z(confidence: float):
    return Config.Z_SCORES.get(confidence, 1.96)


# -------------------------
# COUNT
# -------------------------
def estimate_count(sample_count, fraction, confidence=0.95):
    if sample_count == 0 or fraction <= 0:
        return {
            "estimate": 0,
            "error_margin": 0,
            "confidence": confidence
        }

    Z = get_z(confidence)

    n = sample_count
    p = fraction

    estimate = n / p

    # Correct Bernoulli variance
    variance = n * (1 - p) / (p ** 2)
    std_error = math.sqrt(variance)

    error_margin = Z * std_error

    return {
        "estimate": estimate,
        "error_margin": error_margin,
        "confidence": confidence
    }


# -------------------------
# SUM (FROM STATS — FIXED)
# -------------------------
def estimate_sum_from_stats(n, mean, var, p, confidence=0.95):
    """
    Uses:
    n = sample size
    mean = sample mean
    var = sample variance (VAR_SAMP)
    p = sampling fraction
    """

    if n is None or n < 2 or p <= 0:
        return {
            "estimate": 0,
            "error_margin": 0,
            "confidence": confidence
        }

    Z = get_z(confidence)

    # Estimate total sum
    estimate = (n * mean) / p

    # -------------------------
    # CORRECT variance formula
    # -------------------------
    # Var(SUM estimator) = (n * var / p^2) * (1 - p)
    variance = (n * var * (1 - p)) / (p ** 2)

    std_error = math.sqrt(variance)
    error_margin = Z * std_error

    return {
        "estimate": estimate,
        "error_margin": error_margin,
        "confidence": confidence
    }


# -------------------------
# AVG (FROM STATS — WITH FPC)
# -------------------------
def estimate_avg_from_stats(n, mean, var, confidence=0.95, fraction=None):
    """
    Uses:
    n = sample size
    mean = sample mean
    var = sample variance
    fraction = optional sampling fraction (for FPC)
    """

    if n is None or n < 2:
        return {
            "estimate": mean if mean is not None else 0,
            "error_margin": 0,
            "confidence": confidence
        }

    Z = get_z(confidence)

    # Standard error
    std_error = math.sqrt(var / n)

    # -------------------------
    # Finite Population Correction
    # -------------------------
    if fraction is not None and fraction > 0:
        fpc = math.sqrt(1 - fraction)
        std_error *= fpc

    error_margin = Z * std_error

    return {
        "estimate": mean,
        "error_margin": error_margin,
        "confidence": confidence
    }