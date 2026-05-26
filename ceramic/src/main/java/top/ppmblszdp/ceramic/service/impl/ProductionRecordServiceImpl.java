package top.ppmblszdp.ceramic.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import top.ppmblszdp.ceramic.entity.ProductionRecord;
import top.ppmblszdp.ceramic.mapper.ProductionRecordMapper;
import top.ppmblszdp.ceramic.service.ProductionRecordService;

import java.time.LocalDate;

@Service
public class ProductionRecordServiceImpl extends ServiceImpl<ProductionRecordMapper, ProductionRecord> implements ProductionRecordService {

    @Override
    public IPage<ProductionRecord> selectPageList(int page, int limit, String productName, String startDate, String endDate) {
        Page<ProductionRecord> pageParam = new Page<>(page, limit);
        QueryWrapper<ProductionRecord> queryWrapper = new QueryWrapper<>();
        
        if (StringUtils.hasText(productName)) {
            queryWrapper.eq("product_name", productName);
        }
        if (StringUtils.hasText(startDate)) {
            queryWrapper.ge("production_date", LocalDate.parse(startDate));
        }
        if (StringUtils.hasText(endDate)) {
            queryWrapper.le("production_date", LocalDate.parse(endDate));
        }
        
        // Show recent production dates first
        queryWrapper.orderByDesc("production_date");
        
        return baseMapper.selectPage(pageParam, queryWrapper);
    }
}
