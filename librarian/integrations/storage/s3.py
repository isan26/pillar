import boto3
from botocore.exceptions import NoCredentialsError
from .storage_protocol import Storage

class S3Storage(Storage):
    def __init__(self, bucket_name: str, aws_access_key_id: str, aws_secret_access_key: str):
        self.bucket_name = bucket_name
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key
        )

    def save_file(self, file: bytes, path: str):
        try:
            self.s3_client.put_object(Bucket=self.bucket_name, Key=path, Body=file)
        except NoCredentialsError:
            print("Credentials not available")

    def load(self, path: str) -> bytes:
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=path)
            return response['Body'].read()
        except NoCredentialsError:
            print("Credentials not available")
            return b""
