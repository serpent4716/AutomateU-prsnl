# Render deployment split

## Services
1. Frontend: Static Site from `frontend`.
2. Backend API: Web Service from `task_manager` using `Dockerfile.web`.
3. Backend Worker: Background Worker from `task_manager` using `Dockerfile.worker`.
4. Scheduler: Render Cron Job calling Celery beat equivalent task (`extract_all_users_data_task`) every 15 min.
5. Managed Redis + Managed Postgres.

## API Service
- Dockerfile: `task_manager/Dockerfile.web`
- Start: default CMD
- Required env: `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`, `FRONTEND_URL`, `BACKEND_URL`, Gemini + AWS + Google OAuth vars.

## Worker Service
- Dockerfile: `task_manager/Dockerfile.worker`
- Start: default CMD
- Required env: same DB/Redis/Gemini vars as API.
- Memory/stability env (recommended on 512MB):
  - `CELERY_POOL=solo`
  - `CELERY_CONCURRENCY=1`
  - `CELERY_PREFETCH_MULTIPLIER=1`
  - `CELERY_MAX_TASKS_PER_CHILD=1`
  - `OMP_NUM_THREADS=1`
  - `OPENBLAS_NUM_THREADS=1`
  - `MKL_NUM_THREADS=1`
  - `NUMEXPR_NUM_THREADS=1`
  - `TOKENIZERS_PARALLELISM=false`

## Optional dedicated RAG queue
- Set `RAG_QUEUE=rag` on API service.
- Run a dedicated worker with `--queues rag` for heavy document ingestion tasks.
- Keep your default worker for lighter tasks on default `celery` queue.

## Frontend
- Build command: `npm install && npm run build`
- Publish directory: `build`
- Env: `REACT_APP_API_BASE_URL=https://<your-api-service>.onrender.com`

## Notes
- Keep uploads/documents on object storage for multi-service consistency.
- Use DB migrations (Alembic) instead of runtime `create_all` in production.
