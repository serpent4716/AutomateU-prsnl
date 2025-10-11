# Task Manager Chatbot (FastAPI + Celery + Redis)

## Development Setup

1. Install Docker Desktop and ensure it's running.
2. In the project root, run:
```bash
docker compose --build --no-cache
docker compose up
```
3. To make changes in database while running:
Go to the terminal of **web** inside docker container
```bash
alembic revision --autogenerate -m "your message"
alembic upgrade head
```
This will update all the tables in the postgres.

4. To see the database inside docker Desktop:
Go to the terminal of **db** inside docker container
```bash
psql -U taskuser -d taskdb
```
To view the tables:
```bash
\dt
```
To view the data inside a table:
```bash
select * from users;
```
Change the tablename as per requirement, currently users table would be shown.

5. Access FastAPI at: http://localhost:8000

6. Redis runs internally at redis:6379 for services.
