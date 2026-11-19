FROM nginx:alpine
ARG DIST_URL=https://github.com/allber-to/web/releases/download/web-52db1b5423ea-1/allberto-web-52db1b5423ea.tar.gz
ARG DIST_SHA256=5f9d3b717d30706d82c8d4ba66e7cf8ebcb49fa0ef695c1630dce4b94e351f02
RUN test -n "$DIST_URL" && test -n "$DIST_SHA256" \
    && wget -q -O /tmp/allberto-web.tar.gz "$DIST_URL" \
    && printf '%s  %s\n' "$DIST_SHA256" /tmp/allberto-web.tar.gz | sha256sum -c - \
    && rm -rf /usr/share/nginx/html/* \
    && tar -xzf /tmp/allberto-web.tar.gz -C /usr/share/nginx/html \
    && rm /tmp/allberto-web.tar.gz
COPY frontend.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
