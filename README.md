# Clínica Aurora — atendimento digital

Aplicação full stack para registrar um atendimento, persistir seus dados no MySQL e gerar um protocolo UUID via HTTPBin em segundo plano. A interface acompanha o andamento automaticamente e suporta vários atendimentos.

## Executar com Docker

Requer Docker Desktop com Compose.

```sh
docker compose up --build
```

Abra [http://localhost:3000](http://localhost:3000). A API fica em `http://localhost:8080/api/visits`. O MySQL usa um volume persistente local.

## Executar localmente

Requer Java 17, Maven, Node.js e npm. Sem uma URL JDBC configurada, a API usa H2 em arquivo, útil para desenvolvimento local. Para MySQL, defina `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME` e `SPRING_DATASOURCE_PASSWORD`.

Terminal 1:

```sh
cd backend
mvn spring-boot:run
```

Terminal 2:

```sh
npm install
npm run dev
```

## API

- `POST /api/visits` com `{ "name": "Ana Silva", "cpf": "529.982.247-25" }` cria um atendimento e retorna `201`.
- `GET /api/visits/{id}` retorna status e protocolo do atendimento.
- `GET /api/visits` lista os atendimentos mais recentes.

Estados: `PENDING` (aguardando), `PROCESSING` (consulta em curso) e `COMPLETED` (protocolo disponível). O backend varre os pendentes a cada cinco segundos. Cada processamento roda numa thread separada, limitado a cinco em paralelo, e falhas externas geram nova tentativa após dez segundos sem apagar o cadastro. Esses intervalos são ajustáveis com `SCHEDULER_DELAY_MS` e `RETRY_DELAY_MS`; `HTTPBIN_URL` permite apontar para outro endpoint durante uma simulação.

## Decisões

- CPF é validado no navegador e no servidor; pontuação é removida antes de persistir.
- O cliente consulta o atendimento a cada 2,5 segundos e para ao receber o protocolo.
- MySQL 8.4 e JPA inicializam o esquema automaticamente no primeiro start.
- O modo local usa H2 em arquivo; a configuração de Docker Compose usa MySQL.
