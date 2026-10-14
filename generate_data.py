
from pathlib import Path

import numpy as np
import pandas as pd

TOTAL_ROWS = 10_000_000
CHUNK_SIZE = 1_000_000
OUTPUT_FILE = Path("data/test_data_10m.csv")
SEED = 42

def main():
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(SEED)
    categories = np.array(["A", "B", "C", "D", "E"])

    OUTPUT_FILE.unlink(missing_ok=True)

    for start in range(0, TOTAL_ROWS, CHUNK_SIZE):
        rows = min(CHUNK_SIZE, TOTAL_ROWS - start)

        df = pd.DataFrame({
            "category": categories[rng.integers(0, 5, size=rows)],
            "sub_category": rng.integers(1, 100, size=rows),
            "value": rng.normal(100, 20, size=rows),
        })

        df.to_csv(
            OUTPUT_FILE,
            mode="w" if start == 0 else "a",
            index=False,
            header=(start == 0),
            float_format="%.4f",
        )

        completed = start + rows
        print(f"\rGenerated {completed:,}/{TOTAL_ROWS:,} rows", end="", flush=True)

    print(f"\nDone: {OUTPUT_FILE.resolve()}")

if __name__ == "__main__":
    main()
