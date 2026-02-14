import os
import tempfile
from typing import Optional

import boto3


AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET", "").strip()
AWS_S3_REGION = os.getenv("AWS_S3_REGION", "ap-south-1")
AWS_S3_ENDPOINT_URL = os.getenv("AWS_S3_ENDPOINT_URL")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

_s3_client = None


def s3_enabled() -> bool:
    return bool(AWS_S3_BUCKET)


def get_s3_client():
    global _s3_client
    if _s3_client is None:
        kwargs = {
            "service_name": "s3",
            "region_name": AWS_S3_REGION,
        }
        if AWS_S3_ENDPOINT_URL:
            kwargs["endpoint_url"] = AWS_S3_ENDPOINT_URL
        if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
            kwargs["aws_access_key_id"] = AWS_ACCESS_KEY_ID
            kwargs["aws_secret_access_key"] = AWS_SECRET_ACCESS_KEY
        _s3_client = boto3.client(**kwargs)
    return _s3_client


def make_uploaded_doc_key(tag: str, doc_id: str, filename: str) -> str:
    return f"uploaded_docs/{tag}/{doc_id}_{filename}"


def upload_bytes(key: str, payload: bytes, content_type: Optional[str] = None) -> None:
    extra_args = {}
    if content_type:
        extra_args["ContentType"] = content_type
    get_s3_client().put_object(
        Bucket=AWS_S3_BUCKET,
        Key=key,
        Body=payload,
        **extra_args,
    )


def download_to_temp(key: str, filename_hint: str = "document.bin") -> str:
    safe_hint = filename_hint.replace("/", "_")
    tmp = tempfile.NamedTemporaryFile(delete=False, prefix="s3tmp", suffix=f"_{safe_hint}")
    tmp_path = tmp.name
    tmp.close()
    get_s3_client().download_file(AWS_S3_BUCKET, key, tmp_path)
    return tmp_path


def presign_get_url(key: str, expires_seconds: int = 600) -> str:
    return get_s3_client().generate_presigned_url(
        "get_object",
        Params={
            "Bucket": AWS_S3_BUCKET,
            "Key": key,
        },
        ExpiresIn=expires_seconds,
    )
