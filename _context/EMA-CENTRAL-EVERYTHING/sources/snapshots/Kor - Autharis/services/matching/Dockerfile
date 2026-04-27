FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# System deps for scikit-learn/numpy wheels (slim wheels should just work on x86_64/arm64).
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential \
 && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
COPY src ./src

RUN pip install --upgrade pip \
 && pip install .

EXPOSE 4030

CMD ["uvicorn", "autharis_matching.app:app", "--host", "0.0.0.0", "--port", "4030"]
