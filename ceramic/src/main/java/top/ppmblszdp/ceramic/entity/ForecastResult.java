package top.ppmblszdp.ceramic.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@TableName("forecast_result")
public class ForecastResult {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private LocalDate forecastDate;
    
    private BigDecimal forecastValue;
    
    private BigDecimal actualValue;
    
    private BigDecimal errorRate;
}
