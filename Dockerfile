# Use official Python image
FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose the port so Back4App knows where to route traffic
EXPOSE 8080

# Start the server directly, specifying the module path
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]