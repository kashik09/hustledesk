# HustleDesk API

Flask backend for the HustleDesk multi-currency subscription tracker.

## Setup

```bash
# From repo root
cd /path/to/hustledesk

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy env template and fill in values
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET_KEY

# Initialize database (first time only)
flask db init

# Run migrations
flask db migrate -m "init"
flask db upgrade

# Start server
flask run
```

## Test

```bash
curl http://localhost:5000/api/health
# {"service":"hustledesk-api","status":"ok"}
```

## Project Structure

```
server/
├── app.py          # App factory
├── config.py       # Environment configs
├── extensions.py   # Flask extensions
├── models/         # SQLAlchemy models
└── routes/         # API blueprints
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| FLASK_APP | App entry point | server.app:create_app |
| FLASK_ENV | development/production | development |
| DATABASE_URL | Postgres connection | postgresql://... |
| JWT_SECRET_KEY | Token signing key | random-string |
| CORS_ORIGINS | Allowed origins | http://localhost:5173 |
