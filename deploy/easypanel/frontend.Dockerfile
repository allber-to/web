FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV HUSKY=0
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ARG GIT_SHA
ENV VITE_API_URL=${VITE_API_URL} \
    VITE_IS_HOSTED=false \
    VITE_IS_TEST=false \
    VITE_ROUTER=browser \
    VITE_APP_TITLE=allberto \
    VITE_ENABLE_DOCUNINJA=false \
    VITE_DISABLE_QUICKBOOKS_INTEGRATION=true \
    VITE_DISABLE_FEEDBACK_FEATURE=true
RUN node --input-type=module -e 'const u = new URL(process.env.VITE_API_URL); if (!/^https?:$/.test(u.protocol) || u.username || u.password || u.search || u.hash || u.pathname !== "/" || process.env.VITE_API_URL.endsWith("/")) throw Error("VITE_API_URL must be an HTTP(S) origin without trailing slash"); if (!/^[a-f0-9]{40}$/.test(process.env.GIT_SHA || "")) throw Error("GIT_SHA must be a full commit SHA");' \
    && npx vite build \
    && if [ "$VITE_ENABLE_DOCUNINJA" != "true" ]; then rm -f dist/docuninja/builder2.0.js; fi \
    && node --input-type=module -e 'import { writeFileSync } from "node:fs"; writeFileSync("dist/version.json", JSON.stringify({ revision: process.env.GIT_SHA, builtAt: new Date().toISOString() }) + "\n");' \
    && node deploy/easypanel/verify-bundle.mjs --self-test \
    && node deploy/easypanel/verify-bundle.mjs dist

FROM nginx:alpine
ARG GIT_SHA
LABEL org.opencontainers.image.title="Allberto" \
      org.opencontainers.image.revision=${GIT_SHA}
COPY deploy/easypanel/frontend.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
