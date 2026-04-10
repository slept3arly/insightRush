import asyncio
import unittest
from pathlib import Path

from backend.api.routes import query
from backend.engine.aqp_engine import AQPEngine
from backend.engine.sampler import Sampler
from backend.engine.validator import Validator
from backend.models.schemas import QueryRequest
from backend.storage.db import db_manager
from backend.storage.ingestion import ingest_csv


class AQPRegressionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.conn = db_manager.get_connection()
        cls.engine = AQPEngine()
        cls.created_tables = []
        cls.large_table = "aqp_test_large_suite"

        cls.conn.execute(f"DROP TABLE IF EXISTS {cls.large_table}")
        cls.conn.execute(f"""
            CREATE TABLE {cls.large_table} AS
            SELECT
                i AS id,
                CASE
                    WHEN i % 3 = 0 THEN 'US'
                    WHEN i % 3 = 1 THEN 'IN'
                    ELSE 'UK'
                END AS country,
                CAST((i % 10) + 1 AS DOUBLE) AS amount
            FROM range(200000) t(i)
        """)
        Validator._schema_cache = None

    @classmethod
    def tearDownClass(cls):
        for table_name in cls.created_tables:
            cls.conn.execute(f"DROP TABLE IF EXISTS {table_name}")

        cls.conn.execute(f"DROP TABLE IF EXISTS {cls.large_table}")
        Validator._schema_cache = None

    @classmethod
    def ingest_sample_table(cls):
        table_name = ingest_csv(Path("data/sample.csv").read_bytes(), "sample.csv")
        cls.created_tables.append(table_name)
        Validator._schema_cache = None
        return table_name

    def test_ingest_keeps_original_row_count(self):
        table_name = self.ingest_sample_table()

        row_count = self.conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]

        self.assertEqual(row_count, 8)

    def test_exact_grouped_sum_returns_expected_groups(self):
        table_name = self.ingest_sample_table()

        result = self.engine.run_query(
            table=table_name,
            column="amount",
            query_type="SUM",
            target_error=0,
            group_by="country",
            confidence=0.95,
        )

        self.assertEqual(result, {"IN": 680.0, "US": 370.0, "UK": 470.0})

    def test_approx_scalar_queries_stay_close_to_truth(self):
        count_result = self.engine.run_query(
            table=self.large_table,
            column=None,
            query_type="COUNT",
            target_error=0.2,
            confidence=0.95,
        )
        sum_result = self.engine.run_query(
            table=self.large_table,
            column="amount",
            query_type="SUM",
            target_error=0.2,
            confidence=0.95,
        )
        avg_result = self.engine.run_query(
            table=self.large_table,
            column="amount",
            query_type="AVG",
            target_error=0.2,
            confidence=0.95,
        )

        self.assertAlmostEqual(count_result["estimate"], 200000.0, delta=10000.0)
        self.assertAlmostEqual(sum_result["estimate"], 1100000.0, delta=55000.0)
        self.assertAlmostEqual(avg_result["estimate"], 5.5, delta=0.05)

        sample_table = Sampler._sample_table_name(self.large_table, 0.125)
        self.assertTrue(
            self.conn.execute(f"SELECT COUNT(*) FROM {sample_table}").fetchone()[0] > 0
        )

    def test_query_route_reports_real_execution_metadata(self):
        sample_table = self.ingest_sample_table()

        Validator._schema_cache = None
        exact_response = asyncio.run(query(QueryRequest(
            table_name=sample_table,
            query_type="SUM",
            column="amount",
            target_error=0.2,
        )))

        Validator._schema_cache = None
        approx_response = asyncio.run(query(QueryRequest(
            table_name=self.large_table,
            query_type="SUM",
            column="amount",
            target_error=0.2,
        )))

        self.assertEqual(exact_response["mode"], "exact")
        self.assertEqual(exact_response["meta"]["sample_fraction"], 1.0)
        self.assertEqual(approx_response["mode"], "approx")
        self.assertAlmostEqual(approx_response["meta"]["sample_fraction"], 0.125)


if __name__ == "__main__":
    unittest.main()
