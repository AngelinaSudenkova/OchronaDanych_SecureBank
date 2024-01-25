from dotenv import load_dotenv
import os
import redis

load_dotenv()


class ApplicationConfig:
    SECRET_KEY = os.environ["SECRET_KEY"]

    SQLALCHEMY_DATABASE_URI = "sqlite:///./db.sqlite"

    SESSION_TYPE = "redis"
    SESSION_PERMANENT = False
    SESSION_USE_SIGNER = True
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_REDIS = redis.from_url("redis://redis:6379")
