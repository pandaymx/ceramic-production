# 构建阶段
FROM eclipse-temurin:21-jdk as builder

WORKDIR /app

# 复制项目文件
COPY build.gradle.kts settings.gradle.kts ./
COPY gradle ./gradle
COPY gradlew gradlew.bat ./
COPY src ./src

# 编译项目（使用项目自带的 gradle wrapper）
RUN chmod +x gradlew && ./gradlew build -x test --no-daemon

# 运行阶段
FROM eclipse-temurin:21-jdk

WORKDIR /app

# 从构建阶段复制生成的 JAR
COPY --from=builder /app/build/libs/*.jar app.jar

# 暴露端口
EXPOSE 8080

# 启动应用
ENTRYPOINT ["java", "-jar", "app.jar"]
