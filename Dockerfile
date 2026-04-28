# Use official Python image
FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Change into the backend folder and start the server
CMD ["bash", "-c", "cd backend && uvicorn main:app --host 0.0.0.0 --port 8080"]