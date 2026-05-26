FROM python:3.11-slim

WORKDIR /app

# 安装 uv
RUN pip install --no-cache-dir uv

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN uv pip install --no-cache-dir -r requirements.txt --system

# 复制应用代码
COPY app ./app

# 暴露端口
EXPOSE 8000

# 启动应用
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
