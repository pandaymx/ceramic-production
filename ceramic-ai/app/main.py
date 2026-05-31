from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
import pandas as pd
from datetime import datetime, timedelta
import os

from app.models.predictor import CeramicPredictor, get_season_type

app = FastAPI(title="Ceramic Yield AI Forecasting Engine", version="1.1.0")

# Enable CORS for cross-origin industrial telemetry
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from urllib.parse import urlparse

# PostgreSQL Database Connection Parameters matching application.yml
db_url = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/ceramic_system")
parsed_url = urlparse(db_url)

DB_CONFIG = {
    "host": parsed_url.hostname or "localhost",
    "port": parsed_url.port or 5432,
    "database": parsed_url.path.lstrip('/') or "ceramic_system",
    "user": parsed_url.username or "postgres",
    "password": parsed_url.password or "postgres"
}

def fetch_historical_data():
    """Connect to PostgreSQL and query production records chronologically."""
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        query = "SELECT production_date, output_quantity FROM production_record ORDER BY production_date ASC;"
        df = pd.read_sql_query(query, conn)
        return df
    except Exception as e:
        print(f"Error querying PostgreSQL database: {str(e)}")
        # Return empty DataFrame on failure; predictor will gracefully trigger fallback
        return pd.DataFrame(columns=["production_date", "output_quantity"])
    finally:
        if conn:
            conn.close()

@app.get("/api/forecast/predict")
def predict(
    days: int = Query(7, description="Number of future days to predict"),
    model: str = Query("arima", description="Forecasting model to run: 'arima' or 'lstm'"),
    use_seasonal: bool = Query(True, description="Enable seasonal adjustment for peak/off seasons"),
    include_backtest: bool = Query(True, description="Include historical backtest comparison data")
):
    # 1. Fetch real historical records from database
    df = fetch_historical_data()
    
    # 2. Trigger appropriate time-series predictor with seasonal adjustment
    if model.lower() == "lstm":
        forecast_values, mape, rmse = CeramicPredictor.predict_lstm(df, days, use_seasonal)
        model_label = "LSTM Neural Net"
    elif model.lower() == "svm":
        forecast_values, mape, rmse = CeramicPredictor.predict_svm(df, days, use_seasonal)
        model_label = "SVM (SVR-RBF)"
    else:
        forecast_values, mape, rmse = CeramicPredictor.predict_arima(df, days, use_seasonal)
        model_label = "ARIMA Model"
        
    # 3. Generate future forecast dates
    if len(df) > 0:
        # Start predicting from the day after the last recorded date
        last_recorded_date = pd.to_datetime(df['production_date'].iloc[-1])
    else:
        last_recorded_date = datetime.now()
        
    forecast_dates = []
    for i in range(days):
        next_date = last_recorded_date + timedelta(days=i+1)
        forecast_dates.append(next_date.strftime("%Y-%m-%d"))
    
    # 4. Generate forecast season labels
    forecast_seasons = []
    for date_str in forecast_dates:
        date = datetime.strptime(date_str, "%Y-%m-%d")
        month = date.month
        season = get_season_type(month)
        season_label = "旺季" if season == "peak" else "淡季"
        forecast_seasons.append(season_label)
    
    # 5. Generate backtest comparison data if requested
    backtest_data = None
    if include_backtest:
        backtest_data = CeramicPredictor.backtest_comparison(df, test_days=days, model=model, use_seasonal=use_seasonal)
        
        # Add season labels to backtest comparison
        if backtest_data and 'comparison' in backtest_data:
            for item in backtest_data['comparison']:
                season = item['season']
                item['season_label'] = "旺季" if season == "peak" else "淡季"
        
        # Add current season info
        if backtest_data is not None:
            current_month = datetime.now().month
            backtest_data['current_season'] = {
                'month': current_month,
                'type': get_season_type(current_month),
                'label': "旺季" if get_season_type(current_month) == "peak" else "淡季"
            }
    
    # 6. Compile unified response format
    result = {
        "code": 200,
        "data": {
            "forecastDates": forecast_dates,
            "forecastValues": forecast_values,
            "forecastSeasons": forecast_seasons,
            "metrics": {
                "mape": mape,
                "rmse": rmse,
                "error_controlled": rmse <= 150
            },
            "backtestData": backtest_data
        },
        "msg": f"AI Forecast generated successfully using {model_label} with seasonal adjustment"
    }
    
    return result

@app.get("/api/forecast/comparison")
def get_comparison(
    test_days: int = Query(10, description="Number of recent days to use as test set"),
    model: str = Query("arima", description="Forecasting model to run: 'arima', 'lstm', or 'svm'"),
    use_seasonal: bool = Query(True, description="Enable seasonal adjustment for peak/off seasons")
):
    """Get historical comparison between actual and predicted values with seasonal analysis"""
    df = fetch_historical_data()
    
    if len(df) < test_days + 5:
        return {
            "code": 400,
            "msg": "Insufficient historical data for comparison"
        }
    
    backtest_data = CeramicPredictor.backtest_comparison(df, test_days=test_days, model=model, use_seasonal=use_seasonal)
    
    if backtest_data is None:
        return {
            "code": 500,
            "msg": "Failed to generate backtest comparison"
        }
    
    # Add season labels
    for item in backtest_data['comparison']:
        season = item['season']
        item['season_label'] = "旺季" if season == "peak" else "淡季"
    
    current_month = datetime.now().month
    backtest_data['current_season'] = {
        'month': current_month,
        'type': get_season_type(current_month),
        'label': "旺季" if get_season_type(current_month) == "peak" else "淡季"
    }
    
    return {
        "code": 200,
        "data": backtest_data,
        "msg": "Historical comparison data retrieved successfully"
    }

@app.get("/health")
def health():
    return {"status": "healthy", "engine": "Ceramic AI Core V1.2", "features": ["seasonal_prediction", "backtest_comparison", "svm_svr"]}
