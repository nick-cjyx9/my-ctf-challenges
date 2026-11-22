FROM python:3.13-alpine

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY dist ./dist
COPY medjed ./medjed

EXPOSE 8000
CMD ["gunicorn", "-w", "1", "-k", "gthread", "--threads", "8", \
     "-t", "120", "--graceful-timeout", "30", \
     "-b", "0.0.0.0:8000", "app:app"]
