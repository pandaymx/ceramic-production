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
            @RequestParam(defaultValue = "arima") String model,
            @RequestParam(defaultValue = "true") boolean useSeasonal,
            @RequestParam(defaultValue = "true") boolean includeBacktest) {
        try {
            Map<String, Object> forecastData = forecastResultService.getForecastPrediction(days, model, useSeasonal, includeBacktest);
            return Result.success(forecastData, "预测成功");
        } catch (Exception e) {
            return Result.error("Forecasting engine failed: " + e.getMessage());
        }
    }
    
    @GetMapping("/comparison")
    public Result<Map<String, Object>> getComparison(
            @RequestParam(defaultValue = "10") int testDays) {
        try {
            Map<String, Object> comparisonData = forecastResultService.getBacktestComparison(testDays);
            if (comparisonData == null) {
                return Result.error("无法获取对比数据");
            }
            return Result.success(comparisonData, "对比数据获取成功");
        } catch (Exception e) {
            return Result.error("获取对比数据失败: " + e.getMessage());
        }
    }
}
