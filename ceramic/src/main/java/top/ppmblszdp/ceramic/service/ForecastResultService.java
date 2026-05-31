package top.ppmblszdp.ceramic.service;

import com.baomidou.mybatisplus.extension.service.IService;
import top.ppmblszdp.ceramic.entity.ForecastResult;

import java.util.Map;

public interface ForecastResultService extends IService<ForecastResult> {
    Map<String, Object> getForecastPrediction(int days, String model, boolean useSeasonal, boolean includeBacktest);

    Map<String, Object> getBacktestComparison(int testDays);
}
