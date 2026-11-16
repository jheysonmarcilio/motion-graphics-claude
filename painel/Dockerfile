# Painel Estúdio no servidor (só o painel; os agentes rodam nos PCs de cada usuário).
# docker compose up -d   (ver docker-compose.yml e LEIAME.md)
FROM node:22-alpine
WORKDIR /app/painel
COPY servidor.cjs etapas.cjs ./
COPY web ./web
ENV SEM_AGENTE=1 PAINEL_DADOS=/dados PORT=8080 HOST=0.0.0.0 NODE_ENV=production
RUN mkdir -p /dados && chown node:node /dados
VOLUME /dados
EXPOSE 8080
USER node
CMD ["node", "servidor.cjs"]
