package top.ppmblszdp.ceramic.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import top.ppmblszdp.ceramic.common.Result;
import top.ppmblszdp.ceramic.entity.ProductionRecord;
import top.ppmblszdp.ceramic.service.ProductionRecordService;

import java.math.BigDecimal;
import java.math.RoundingMode;

@RestController
@RequestMapping("/api/production")
@CrossOrigin // Allow frontend dev server requests if needed
public class ProductionRecordController {

    @Autowired
    private ProductionRecordService productionRecordService;

    @GetMapping("/list")
    public Result<IPage<ProductionRecord>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String productName,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        try {
            IPage<ProductionRecord> pageData = productionRecordService.selectPageList(page, limit, productName, startDate, endDate);
            return Result.success(pageData);
        } catch (Exception e) {
            return Result.error("Failed to retrieve production ledger: " + e.getMessage());
        }
    }

    @PostMapping("/add")
    public Result<Boolean> add(@RequestBody ProductionRecord record) {
        try {
            // Automatically calculate qualified rate
            if (record.getOutputQuantity() != null && record.getDefectQuantity() != null && record.getOutputQuantity() > 0) {
                double rate = ((double) (record.getOutputQuantity() - record.getDefectQuantity()) / record.getOutputQuantity()) * 100.0;
                record.setQualifiedRate(BigDecimal.valueOf(rate).setScale(2, RoundingMode.HALF_UP));
            } else {
                record.setQualifiedRate(BigDecimal.valueOf(100.00));
            }
            
            boolean saved = productionRecordService.save(record);
            return Result.success(saved, "添加成功");
        } catch (Exception e) {
            return Result.error("Failed to save production batch record: " + e.getMessage());
        }
    }

    @PutMapping("/update")
    public Result<Boolean> update(@RequestBody ProductionRecord record) {
        try {
            // Automatically recalculate qualified rate
            if (record.getOutputQuantity() != null && record.getDefectQuantity() != null && record.getOutputQuantity() > 0) {
                double rate = ((double) (record.getOutputQuantity() - record.getDefectQuantity()) / record.getOutputQuantity()) * 100.0;
                record.setQualifiedRate(BigDecimal.valueOf(rate).setScale(2, RoundingMode.HALF_UP));
            }
            
            boolean updated = productionRecordService.updateById(record);
            return Result.success(updated, "修改成功");
        } catch (Exception e) {
            return Result.error("Failed to update production record: " + e.getMessage());
        }
    }

    @DeleteMapping("/delete/{id}")
    public Result<Boolean> delete(@PathVariable Long id) {
        try {
            boolean deleted = productionRecordService.removeById(id);
            return Result.success(deleted, "删除成功");
        } catch (Exception e) {
            return Result.error("Failed to delete record: " + e.getMessage());
        }
    }
}
