# Autharis warehouse — Lane G7.
# dbt + DuckDB runner. `docker build -t autharis-warehouse . && docker run --rm autharis-warehouse`
# runs `dbt build`, producing warehouse.duckdb inside the container.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DBT_PROFILES_DIR=/workspace

WORKDIR /workspace

# Install deps first for layer caching.
COPY pyproject.toml ./
RUN pip install --no-cache-dir "dbt-duckdb>=1.8" "duckdb>=1.0"

# Copy the project.
COPY dbt_project.yml profiles.yml ./
COPY seeds ./seeds
COPY models ./models
COPY scripts ./scripts

# Regenerate the synthetic event stream so stg_events has fresh input.
RUN python3 scripts/export_events.py

# `dbt build` runs seed + run + test in dependency order.
ENTRYPOINT ["dbt", "build", "--project-dir", "/workspace", "--profiles-dir", "/workspace"]
