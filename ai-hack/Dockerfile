# 基于官方轻量 Python 镜像
FROM python:3.11-bookworm

# 设置国内镜像（以清华源为例）
RUN touch /etc/apt/sources.list \
    && rm -f /etc/apt/sources.list.d/debian.sources \
    && echo "deb http://mirrors.tuna.tsinghua.edu.cn/debian bookworm main contrib non-free-firmware" > /etc/apt/sources.list \
    && echo "deb http://mirrors.tuna.tsinghua.edu.cn/debian bookworm-updates main contrib non-free-firmware" >> /etc/apt/sources.list \
    && echo "deb http://mirrors.tuna.tsinghua.edu.cn/debian-security bookworm-security main contrib non-free-firmware" >> /etc/apt/sources.list
# 避免交互安装提示
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# 创建运行用户与工作目录（非 root）
ARG UNAME=ctfapp
ARG UHOME=/home/${UNAME}
RUN useradd --no-create-home --home-dir ${UHOME} --shell /usr/sbin/nologin --uid 1001 ${UNAME} \
 && mkdir -p ${UHOME}/app \
 && chown -R ${UNAME}:${UNAME} ${UHOME}

WORKDIR ${UHOME}/app

RUN pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple

# 安装运行时依赖（只安装必要的包）
# 注意：尽量把 requirements.txt 锁定到固定版本
COPY requirements.txt ./
RUN apt-get update \
 && apt-get install -y --no-install-recommends gcc libssl-dev build-essential \
 && pip install --no-cache-dir -r requirements.txt \
 && apt-get purge -y --auto-remove gcc build-essential \
 && rm -rf /var/lib/apt/lists/*

# 复制应用代码（镜像内为只读根推荐，将在运行时使用 --read-only）
COPY --chown=1001:1001 . ./app/

# 复制 uwsgi 配置与 entrypoint
COPY uwsgi.ini /etc/uwsgi/uwsgi.ini
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh \
 && chown 1001:1001 /etc/uwsgi/uwsgi.ini

# 切换到非 root 用户
USER ${UNAME}

# 默认工作目录
WORKDIR ${UHOME}/app/app

# 开放端口（容器内部端口）
EXPOSE 5052

# 入口：运行 uwsgi
CMD ["/usr/local/bin/entrypoint.sh"]
