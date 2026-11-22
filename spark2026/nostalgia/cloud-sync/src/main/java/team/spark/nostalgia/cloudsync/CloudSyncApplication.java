package team.spark.nostalgia.cloudsync;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class CloudSyncApplication {

    public static void main(String[] args) {
        SpringApplication.run(CloudSyncApplication.class, args);
    }

    @GetMapping("/")
    public Map<String, Object> index() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("service", "sparkcloud-sync");
        body.put("message", "电子书云同步服务尚未上线，敬请期待。");
        return body;
    }
}
