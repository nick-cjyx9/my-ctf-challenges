FROM python:3.11-slim AS readflag-builder

RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libc6-dev \
    && rm -rf /var/lib/apt/lists/*

COPY readflag.c /tmp/readflag.c
RUN gcc -static -O2 -s -o /readflag /tmp/readflag.c

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN pip install --no-cache-dir flask

COPY app.py ./
COPY templates/ ./templates/

RUN useradd --create-home --uid 1000 --shell /usr/sbin/nologin appuser \
    && chown -R appuser:appuser /app

# perm
COPY --from=readflag-builder /readflag /readflag
COPY flag /flag
RUN chown root:root /flag /readflag \
    && chmod 400 /flag \
    && chmod 111 /readflag \
    && chmod +s /readflag

USER appuser

EXPOSE 8000
CMD ["python3", "app.py"]
