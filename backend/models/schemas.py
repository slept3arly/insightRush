from pydantic import BaseModel, Field
from typing import Optional, Literal, Dict, Any


class QueryRequest(BaseModel):
    table_name: str

    query_type: Literal["COUNT", "SUM", "AVG"]

    column: Optional[str] = None
    group_by: Optional[str] = None

    # statistical control
    target_error: float = Field(
        default=0.05,
        description="Desired relative error (e.g., 0.05 = 5%)"
    )

    confidence: float = Field(
        default=0.95,
        description="Confidence level (e.g., 0.95)"
    )


class QueryResponse(BaseModel):
    mode: Literal["exact", "approx"]

    result: Any

    error_margin: Optional[float] = None
    confidence: Optional[float] = None

    meta: Dict[str, Any]