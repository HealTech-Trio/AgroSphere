import numpy as np
from scipy.stats import norm
from datetime import datetime, timedelta
import math

# ============================================================================
# ADVANCED YIELD PREDICTION MODEL
# Implements multi-factor weighted prediction with environmental interactions
# ============================================================================

# Crop yield baselines (optimistic potential yields in tons/hectare)
CROP_YIELD_BASELINES = {
    "maize": {"min": 2.5, "optimal": 5.5, "max": 8.0},
    "corn": {"min": 2.5, "optimal": 5.5, "max": 8.0},
    "wheat": {"min": 2.0, "optimal": 4.5, "max": 6.5},
    "rice": {"min": 3.0, "optimal": 6.0, "max": 8.5},
    "soybean": {"min": 1.8, "optimal": 3.5, "max": 5.0},
    "tomato": {"min": 15.0, "optimal": 35.0, "max": 50.0},
    "potato": {"min": 12.0, "optimal": 25.0, "max": 40.0},
    "cassava": {"min": 8.0, "optimal": 15.0, "max": 25.0},
    "sorghum": {"min": 1.5, "optimal": 3.0, "max": 4.5},
    "sugarcane": {"min": 50.0, "optimal": 90.0, "max": 120.0},
}

# Crop maturity information (days)
CROP_MATURITY_DAYS = {
    "maize": {"min": 90, "typical": 120, "max": 140},
    "corn": {"min": 90, "typical": 120, "max": 140},
    "wheat": {"min": 120, "typical": 150, "max": 180},
    "rice": {"min": 90, "typical": 120, "max": 150},
    "soybean": {"min": 80, "typical": 100, "max": 130},
    "tomato": {"min": 70, "typical": 90, "max": 110},
    "potato": {"min": 90, "typical": 110, "max": 130},
    "cassava": {"min": 240, "typical": 270, "max": 360},
    "sorghum": {"min": 90, "typical": 110, "max": 130},
    "sugarcane": {"min": 330, "typical": 365, "max": 540},
}

# Environmental factor weights (0-1, higher = more important)
FACTOR_WEIGHTS = {
    "soil_quality": 0.25,
    "water_availability": 0.22,
    "temperature": 0.18,
    "growth_stage": 0.15,
    "management": 0.12,
    "disease_risk": 0.08,
}

# Soil type scoring (0-1 scale, 1 = optimal)
SOIL_SCORES = {
    "loam": 1.0,
    "clay_loam": 0.95,
    "sandy_loam": 0.90,
    "silt": 0.93,
    "clay": 0.75,
    "sandy": 0.65,
    "peat": 0.85,
    "chalky": 0.70,
}

# Irrigation effectiveness (0-1 scale, 1 = optimal)
IRRIGATION_SCORES = {
    "drip": 1.0,
    "subsurface": 0.98,
    "pivot": 0.92,
    "sprinkler": 0.88,
    "flood": 0.75,
    "manual": 0.70,
    "none": 0.40,
}

# Temperature optimal ranges per crop (°C)
TEMPERATURE_RANGES = {
    "maize": {"min": 18, "optimal_low": 22, "optimal_high": 28, "max": 35},
    "wheat": {"min": 10, "optimal_low": 15, "optimal_high": 24, "max": 32},
    "rice": {"min": 20, "optimal_low": 25, "optimal_high": 32, "max": 38},
    "tomato": {"min": 15, "optimal_low": 20, "optimal_high": 27, "max": 35},
    "potato": {"min": 10, "optimal_low": 15, "optimal_high": 22, "max": 28},
}


def calculate_temperature_score(temp, crop_type):
    """
    Calculate temperature suitability score using Gaussian distribution.
    Returns: 0-1 score (1 = optimal temperature)
    """
    if crop_type not in TEMPERATURE_RANGES:
        crop_type = "maize"  # Default fallback
    
    ranges = TEMPERATURE_RANGES[crop_type]
    
    # Outside absolute limits
    if temp < ranges["min"] or temp > ranges["max"]:
        penalty = min(abs(temp - ranges["min"]), abs(temp - ranges["max"]))
        return max(0, 0.3 - (penalty * 0.05))  # Harsh penalty outside range
    
    # Within optimal range
    if ranges["optimal_low"] <= temp <= ranges["optimal_high"]:
        return 1.0
    
    # Between min and optimal_low
    if temp < ranges["optimal_low"]:
        return 0.7 + 0.3 * ((temp - ranges["min"]) / (ranges["optimal_low"] - ranges["min"]))
    
    # Between optimal_high and max
    if temp > ranges["optimal_high"]:
        return 0.7 + 0.3 * ((ranges["max"] - temp) / (ranges["max"] - ranges["optimal_high"]))
    
    return 0.8  # Fallback


def calculate_moisture_score(soil_moisture, humidity):
    """
    Calculate water availability score from soil moisture and humidity.
    Returns: 0-1 score (1 = optimal water conditions)
    """
    # Optimal soil moisture: 60-80%
    if 60 <= soil_moisture <= 80:
        moisture_score = 1.0
    elif 40 <= soil_moisture < 60:
        moisture_score = 0.7 + 0.3 * ((soil_moisture - 40) / 20)
    elif 80 < soil_moisture <= 95:
        moisture_score = 0.8 - 0.3 * ((soil_moisture - 80) / 15)
    elif soil_moisture < 40:
        moisture_score = max(0, soil_moisture / 40 * 0.7)
    else:  # > 95
        moisture_score = max(0.2, 0.8 - (soil_moisture - 95) * 0.1)
    
    # Optimal humidity: 50-70%
    if 50 <= humidity <= 70:
        humidity_score = 1.0
    elif 30 <= humidity < 50:
        humidity_score = 0.6 + 0.4 * ((humidity - 30) / 20)
    elif 70 < humidity <= 85:
        humidity_score = 0.85 - 0.15 * ((humidity - 70) / 15)
    elif humidity < 30:
        humidity_score = max(0.2, humidity / 30 * 0.6)
    else:  # > 85
        humidity_score = max(0.4, 0.85 - (humidity - 85) * 0.03)
    
    # Weighted combination (soil moisture more important)
    return 0.65 * moisture_score + 0.35 * humidity_score


def calculate_growth_stage_score(current_growth, planting_date, crop_type):
    """
    Calculate growth stage factor using sigmoid curve.
    Returns: 0-1 score (1 = optimal growth progression)
    """
    if crop_type not in CROP_MATURITY_DAYS:
        crop_type = "maize"
    
    typical_days = CROP_MATURITY_DAYS[crop_type]["typical"]
    
    # Calculate days since planting
    if isinstance(planting_date, str):
        planting_date = datetime.fromisoformat(planting_date.replace('Z', '+00:00'))
    
    days_since_planting = (datetime.now() - planting_date).days
    
    # Expected growth percentage based on days
    expected_growth = min(100, (days_since_planting / typical_days) * 100)
    
    # Calculate deviation from expected
    growth_deviation = abs(current_growth - expected_growth)
    
    # Sigmoid function for smooth scoring
    # Small deviations have minimal penalty, large deviations are harshly penalized
    if growth_deviation <= 10:
        return 1.0
    elif growth_deviation <= 20:
        return 0.85 + 0.15 * (1 - (growth_deviation - 10) / 10)
    elif growth_deviation <= 35:
        return 0.65 + 0.20 * (1 - (growth_deviation - 20) / 15)
    else:
        return max(0.3, 0.65 - (growth_deviation - 35) * 0.02)


def calculate_management_score(irrigation_type, has_iot_data):
    """
    Calculate farm management quality score.
    Returns: 0-1 score (1 = excellent management)
    """
    irrigation_score = IRRIGATION_SCORES.get(irrigation_type.lower(), 0.6)
    
    # Bonus for IoT monitoring
    iot_bonus = 0.15 if has_iot_data else 0.0
    
    # Cap at 1.0
    return min(1.0, irrigation_score + iot_bonus)


def calculate_disease_risk_impact(growth_stage, temperature, humidity):
    """
    Estimate disease risk based on environmental conditions.
    Returns: 0-1 score (1 = low disease risk, 0 = high risk)
    """
    # High humidity + moderate temps = higher disease risk
    risk_score = 1.0
    
    # Humidity-based risk
    if 70 <= humidity <= 95:
        risk_score -= 0.15 * ((humidity - 70) / 25)
    
    # Temperature-based risk (20-30°C with high humidity is risky)
    if 20 <= temperature <= 30 and humidity > 75:
        risk_score -= 0.10
    
    # Early growth stages are more vulnerable
    if growth_stage < 40:
        risk_score -= 0.10
    
    return max(0.5, risk_score)  # Minimum 0.5 (never assume zero yield)


def predict_yield_advanced(
    crop_type,
    area_hectares,
    soil_type,
    irrigation_type,
    planting_date,
    current_growth_stage,
    temperature=None,
    humidity=None,
    soil_moisture=None,
    has_iot_data=False
):
    """
    Advanced yield prediction using weighted multi-factor model.
    
    Returns: dict with min_yield, expected_yield, max_yield, confidence_score, factors
    """
    crop_type = crop_type.lower()
    
    # Get baseline yields
    if crop_type not in CROP_YIELD_BASELINES:
        crop_type = "maize"  # Default fallback
    
    baseline = CROP_YIELD_BASELINES[crop_type]
    
    # Calculate individual factor scores
    soil_score = SOIL_SCORES.get(soil_type.lower(), 0.7)
    
    water_score = calculate_moisture_score(
        soil_moisture if soil_moisture else 60,
        humidity if humidity else 60
    )
    
    temp_score = calculate_temperature_score(
        temperature if temperature else 25,
        crop_type
    )
    
    growth_score = calculate_growth_stage_score(
        current_growth_stage,
        planting_date,
        crop_type
    )
    
    management_score = calculate_management_score(irrigation_type, has_iot_data)
    
    disease_score = calculate_disease_risk_impact(
        current_growth_stage,
        temperature if temperature else 25,
        humidity if humidity else 60
    )
    
    # Calculate weighted overall factor (0-1 scale)
    overall_factor = (
        FACTOR_WEIGHTS["soil_quality"] * soil_score +
        FACTOR_WEIGHTS["water_availability"] * water_score +
        FACTOR_WEIGHTS["temperature"] * temp_score +
        FACTOR_WEIGHTS["growth_stage"] * growth_score +
        FACTOR_WEIGHTS["management"] * management_score +
        FACTOR_WEIGHTS["disease_risk"] * disease_score
    )
    
    # Calculate yield estimates
    # Use non-linear scaling: poor conditions reduce yield more than good conditions increase it
    if overall_factor >= 0.8:
        # Excellent conditions: approach optimal yield
        yield_per_hectare = baseline["optimal"] + (baseline["max"] - baseline["optimal"]) * ((overall_factor - 0.8) / 0.2)
    elif overall_factor >= 0.6:
        # Good conditions: between min and optimal
        yield_per_hectare = baseline["min"] + (baseline["optimal"] - baseline["min"]) * ((overall_factor - 0.6) / 0.2)
    else:
        # Poor conditions: below minimum baseline
        yield_per_hectare = baseline["min"] * (overall_factor / 0.6)
    
    # Calculate range (±15% for uncertainty)
    min_yield_per_ha = yield_per_hectare * 0.85
    max_yield_per_ha = yield_per_hectare * 1.15
    
    # Total yields
    min_yield = round(min_yield_per_ha * area_hectares, 2)
    expected_yield = round(yield_per_hectare * area_hectares, 2)
    max_yield = round(max_yield_per_ha * area_hectares, 2)
    
    # Confidence score calculation
    # Lower confidence if: missing IoT data, extreme conditions, early growth stage
    confidence = 55.0  # Base confidence (as per your requirement)
    
    if has_iot_data:
        confidence = min(55, confidence + 5)
    
    if 40 <= current_growth_stage <= 80:
        confidence = min(55, confidence + 3)
    
    if overall_factor > 0.7:
        confidence = min(55, confidence + 2)
    
    # Cap at 55% maximum
    confidence = min(55.0, confidence)
    
    return {
        "min_yield": min_yield,
        "expected_yield": expected_yield,
        "max_yield": max_yield,
        "yield_per_hectare": round(yield_per_hectare, 2),
        "confidence_score": round(confidence, 1),
        "overall_factor": round(overall_factor, 3),
        "factor_breakdown": {
            "soil_quality": round(soil_score, 3),
            "water_availability": round(water_score, 3),
            "temperature_suitability": round(temp_score, 3),
            "growth_progression": round(growth_score, 3),
            "farm_management": round(management_score, 3),
            "disease_risk": round(disease_score, 3),
        }
    }



if __name__ == "__main__":
    result1 = predict_yield_advanced(
        crop_type="maize",
        area_hectares=5.0,
        soil_type="loam",
        irrigation_type="drip",
        planting_date="2024-09-15",
        current_growth_stage=65,
        temperature=26,
        humidity=55,
        soil_moisture=68,
        has_iot_data=True
    )
    
    print("=== SCENARIO 1: Good Conditions ===")
    print(f"Expected Yield: {result1['expected_yield']} tons ({result1['min_yield']}-{result1['max_yield']} tons)")
    print(f"Yield per Hectare: {result1['yield_per_hectare']} tons/ha")
    print(f"Confidence: {result1['confidence_score']}%")
    print(f"Overall Factor: {result1['overall_factor']}")
    print(f"Factor Breakdown: {result1['factor_breakdown']}")
    
    print("\n" + "="*50 + "\n")
    
    result2 = predict_yield_advanced(
        crop_type="maize",
        area_hectares=5.0,
        soil_type="sandy",
        irrigation_type="none",
        planting_date="2024-09-15",
        current_growth_stage=40,
        temperature=35,
        humidity=25,
        soil_moisture=30,
        has_iot_data=False
    )
    
    print("=== SCENARIO 2: Poor Conditions ===")
    print(f"Expected Yield: {result2['expected_yield']} tons ({result2['min_yield']}-{result2['max_yield']} tons)")
    print(f"Yield per Hectare: {result2['yield_per_hectare']} tons/ha")
    print(f"Confidence: {result2['confidence_score']}%")
    print(f"Overall Factor: {result2['overall_factor']}")
    print(f"Factor Breakdown: {result2['factor_breakdown']}")
    
    print("\n" + "="*50 + "\n")
    
    result3 = predict_yield_advanced(
        crop_type="tomato",
        area_hectares=2.0,
        soil_type="loam",
        irrigation_type="drip",
        planting_date="2024-10-01",
        current_growth_stage=75,
        temperature=24,
        humidity=60,
        soil_moisture=72,
        has_iot_data=True
    )
    
    print("=== SCENARIO 3: Optimal Conditions (Tomato) ===")
    print(f"Expected Yield: {result3['expected_yield']} tons ({result3['min_yield']}-{result3['max_yield']} tons)")
    print(f"Yield per Hectare: {result3['yield_per_hectare']} tons/ha")
    print(f"Confidence: {result3['confidence_score']}%")
    print(f"Overall Factor: {result3['overall_factor']}")
    print(f"Factor Breakdown: {result3['factor_breakdown']}")