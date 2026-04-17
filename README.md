# Interstate ELD Trip Planner

A comprehensive Hours of Service (HOS) compliance solution for trucking operations. This full-stack application provides real-time trip planning, route optimization, and automated ELD log sheet generation to ensure regulatory compliance and operational efficiency.

## Features

### Route Planning & Optimization
- **Intelligent Routing**: Leverages OpenStreetMap and OSRM for accurate, real-time route calculation
- **Geocoding Integration**: Precise location handling for current position, pickup, and delivery points
- **Stop Scheduling**: Automatic insertion of fuel stops every 1,000 miles
- **Interactive Maps**: Visual route display with Leaflet-powered maps

### HOS Compliance Engine
- **11-Hour Driving Limit**: Enforces maximum driving time per shift
- **14-Hour On-Duty Window**: Tracks total on-duty hours including driving and non-driving work
- **Mandatory Breaks**: 30-minute break requirement after 8 hours of driving
- **Rest Period Management**: 10-hour off-duty rest before next shift
- **70-Hour Cycle Tracking**: Monitors 7-day rolling cycle with 34-hour restart provisions
- **Automated Scheduling**: Intelligent break and rest period insertion

### ELD Log Generation
- **Multi-Day Logs**: Complete midnight-to-midnight daily log sheets
- **Visual Log Sheets**: SVG-based log visualization with status indicators
- **Duty Status Tracking**: Off Duty, Sleeper Berth, Driving, and On Duty categorization
- **Compliance Reporting**: Detailed hour breakdowns and cycle usage

### User Experience
- **Modern Interface**: Clean, professional React-based frontend
- **Real-Time Feedback**: Loading states and smooth transitions
- **Responsive Design**: Optimized for desktop and mobile devices
- **Intuitive Workflow**: Streamlined input-to-results process

## Technology Stack

- **Backend**: Django 6.0.4 with Django REST Framework
- **Frontend**: React 18.3.0 with Tailwind CSS
- **Mapping**: Leaflet with OpenStreetMap tiles
- **Routing**: OSRM (Open Source Routing Machine)
- **Icons**: Lucide React icon library
- **Database**: SQLite (development) / PostgreSQL (production)

## Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

## Quick Start

### Backend Setup

1. **Create Virtual Environment**
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # macOS/Linux
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run Database Migrations**
   ```bash
   python manage.py migrate
   ```

4. **Start Development Server**
   ```bash
   python manage.py runserver
   ```
   The backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```
   The frontend will be available at `http://localhost:3000`

## API Documentation

### Calculate Trip
**Endpoint**: `POST /api/calculate-trip/`

Generates a complete trip plan with route, instructions, and ELD logs.

#### Request Body
```json
{
  "current_location": "Chicago, IL",
  "pickup_location": "Indianapolis, IN",
  "dropoff_location": "Louisville, KY",
  "start_time": "2024-01-01T08:00",
  "current_cycle_used_hours": 24,
  "pre_trip_minutes": 30,
  "pickup_stop_minutes": 60,
  "dropoff_stop_minutes": 60,
  "fuel_interval_miles": 1000
}
```

#### Parameters
- `current_location`: Driver's current location (string)
- `pickup_location`: Pickup location (string)
- `dropoff_location`: Delivery destination (string)
- `start_time`: Trip start time (ISO 8601 datetime string)
- `current_cycle_used_hours`: Hours already used in current 70-hour cycle (number)
- `pre_trip_minutes`: Pre-trip inspection time (number)
- `pickup_stop_minutes`: Time spent at pickup location (number)
- `dropoff_stop_minutes`: Time spent at delivery location (number)
- `fuel_interval_miles`: Miles between fuel stops (number)

#### Response
```json
{
  "route": {
    "distance_miles": 295.5,
    "duration_hours": 4.8,
    "geometry": [[lat, lng], ...]
  },
  "instructions": [
    {
      "instruction": "Head north on I-90 E",
      "distance_miles": 45.2,
      "duration_hours": 0.7
    }
  ],
  "daily_sheets": [
    {
      "date": "2024-01-01",
      "totals": {
        "OFF_DUTY": 8,
        "SLEEPER": 2,
        "DRIVING": 11,
        "ON_DUTY": 3
      },
      "entries": [...],
      "remarks": [...]
    }
  ],
  "cycle_used_hours": 28
}
```

## Usage

1. **Enter Trip Details**: Input current location, pickup, and dropoff points
2. **Configure Parameters**: Set start time, cycle hours, and stop durations
3. **Calculate Route**: Click "Calculate Trip & Generate Logs"
4. **Review Results**: View optimized route, instructions, and ELD logs
5. **Export Logs**: Download or print generated log sheets

## Configuration

### Environment Variables
Create a `.env` file in the backend directory:

```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///db.sqlite3
```

### CORS Settings
The backend is configured to accept requests from `localhost:3000` during development. Update `backend/settings.py` for production deployments.

## Compliance Standards

This application adheres to FMCSA Hours of Service regulations including:
- 49 CFR Part 395 - Hours of Service of Drivers
- Electronic Logging Device (ELD) requirements
- 70/8 and 60/7 duty cycle options
- 34-hour restart provisions


