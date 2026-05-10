FROM python:3.9-slim

WORKDIR /app

# Copy all files to the container
COPY . /app

# Start a simple HTTP server listening on the PORT provided by Cloud Run
CMD ["sh", "-c", "python -m http.server ${PORT:-8080}"]
