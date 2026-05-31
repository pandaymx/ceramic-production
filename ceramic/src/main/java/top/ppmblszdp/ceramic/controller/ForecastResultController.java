package top.ppmblszdp.ceramic.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import top.ppmblszdp.ceramic.common.Result;
import top.ppmblszdp.ceramic.service.ForecastResultService;

import java.util.Map;

@RestController
@RequestMapping("/api/forecast")
@CrossOrigin
public class ForecastResultController {

    @Autowired
    private ForecastResultService forecastResultService;

    @GetMapping("/predict")
    public Result<Map<String, Object>> predict(
            @RequestParam(defaultValue = "7") int days,
            @RequestParam(defaultValue = "arima") String model) {
        try {
            Map<String, Object> forecastData = forecastResultService.getForecastPrediction(days, model);
            return Result.success(forecastData, "预测成功");
        } catch (Exception e) {
            return Result.error("Forecasting engine failed: " + e.getMessage());
        }
    }
}
