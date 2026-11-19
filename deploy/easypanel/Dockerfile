FROM nginx:alpine
ARG DIST_URL=https://github.com/allber-to/web/releases/download/web-f5cb28edb112-1/allberto-web-f5cb28edb112.tar.gz
ARG DIST_SHA256=fcbf81bcbb622efab348a218b8524f4c5af62a7225321777af019ca6351d1ac5
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
