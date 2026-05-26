-- init_schema.sql
-- Create Schema for Ceramic Production System in PostgreSQL

DROP TABLE IF EXISTS production_record;
DROP TABLE IF EXISTS forecast_result;

CREATE TABLE production_record (
    id BIGSERIAL PRIMARY KEY,
    production_date DATE NOT NULL UNIQUE,
    product_name VARCHAR(100) NOT NULL,
    output_quantity INT NOT NULL DEFAULT 0,
    defect_quantity INT NOT NULL DEFAULT 0,
    qualified_rate DECIMAL(5, 2) NOT NULL DEFAULT 100.00,
    energy_consumption DECIMAL(10, 2) NOT NULL DEFAULT 0.00
);

CREATE TABLE forecast_result (
    id BIGSERIAL PRIMARY KEY,
    forecast_date DATE NOT NULL,
    forecast_value DECIMAL(10, 2) NOT NULL,
    actual_value DECIMAL(10, 2) DEFAULT NULL,
    error_rate DECIMAL(5, 2) DEFAULT NULL
);

-- Index for date queries
CREATE INDEX idx_production_date ON production_record(production_date);
CREATE INDEX idx_forecast_date ON forecast_result(forecast_date);
