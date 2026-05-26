package top.ppmblszdp.ceramic.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import top.ppmblszdp.ceramic.entity.ProductionRecord;

public interface ProductionRecordService extends IService<ProductionRecord> {
    IPage<ProductionRecord> selectPageList(int page, int limit, String productName, String startDate, String endDate);
}
