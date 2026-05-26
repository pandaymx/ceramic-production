package top.ppmblszdp.ceramic;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("top.ppmblszdp.ceramic.mapper")
public class CeramicApplication {

	public static void main(String[] args) {
		SpringApplication.run(CeramicApplication.class, args);
	}

}

