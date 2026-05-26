package top.ppmblszdp.ceramic.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@TableName("production_record")
public class ProductionRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private LocalDate productionDate;
    
    private String productName;
    
    private Integer outputQuantity;
    
    private Integer defectQuantity;
    
    private BigDecimal qualifiedRate;
    
    private BigDecimal energyConsumption;
}
