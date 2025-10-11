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

**Available Scripts**

In the frontend directory, you have to run :

  7) ### `npm install` 
    To install the node modules that are required to run the frontend.

  8) ### `npm start`
    To run the applocation in development mode.\
    Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

