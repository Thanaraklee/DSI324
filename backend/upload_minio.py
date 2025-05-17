import os
import re
from io import BytesIO
from dotenv import load_dotenv
from minio import Minio
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaIoBaseDownload
from google_auth_oauthlib.flow import InstalledAppFlow

from config.logging_config.modern_log import LoggingConfig
from config.config import ROOT_DIR, BUCKET_POLICY, FILE_CREDENTIALS
from config.pydantic_config.pydantic_config import MetadataValidation

load_dotenv()

# ---------------------------------------------------------------------------- #
#                                LOGGING CONFIG                                #
# ---------------------------------------------------------------------------- #
logger = LoggingConfig(level="INFO", log_file="upload_minio.log").get_logger('drive_to_minio')
# ---------------------------------------------------------------------------- #


def sanitize_filename(filename: str) -> str:
    """Sanitizes a filename by removing whitespace, replacing special characters with
    underscores, and truncating to a maximum length of 62(+filetype) characters. If the filename
    is longer than 62(+filetype) characters, it will be truncated and a '.pdf' extension will be
    added."""
    max_length = 58
    filename = re.sub(r'\s+', '', filename)
    filename = re.sub(r'[\\/:"*?<>|]+', '_', filename)
    old_filename = filename
    if len(old_filename) > max_length:
        truncated = old_filename[:max_length].rstrip('.')
        new_filename = f"{truncated}.pdf"
        logger.warning(f"File name clean from {old_filename} [length {len(old_filename)}] to {new_filename} [length {len(new_filename)}]")
        return new_filename
    return old_filename

class DrivetoMinio:
    def __init__(self, bucket_name: str, minio_host: str = "localhost:9000"):
        """
        Initializes the DrivetoMinio class with a specified MinIO bucket name and host.

        This constructor authenticates to Google Drive and prepares the MinIO client
        for uploading files. It establishes a service client for Google Drive using
        OAuth2 credentials and sets up the MinIO host and bucket name for future
        operations.

        Args:
            bucket_name (str): The name of the MinIO bucket where files will be uploaded.
            minio_host (str, optional): The host address of the MinIO server. Defaults to "localhost:9000".
        """
        creds = self._authenticate_gdrive()
        self.service = build('drive', 'v3', credentials=creds)
        self.minio_host = minio_host
        self.minio_bucket = bucket_name

    def _authenticate_gdrive(self) -> None:
        """Authenticates to Google Drive using the client secrets file and runs a local
        server to obtain credentials. Returns the credentials."""

        flow = InstalledAppFlow.from_client_secrets_file(
            FILE_CREDENTIALS,
            scopes=['https://www.googleapis.com/auth/drive.readonly']
        )
        return flow.run_local_server(port=0)

    def run(self, folder_id: str, scopes: list[str]) -> None:
        """Uploads all PDF files in the specified Google Drive folder and its subfolders
        to the specified MinIO bucket. The folder and its subfolders must have names
        that are in the provided list of scopes.

        Args:
            folder_id (str): The ID of the Google Drive folder to be processed.
            scopes (list[str]): The list of folder names to be processed.
        """
        try:
            query = f"'{folder_id}' in parents and mimeType = 'application/vnd.google-apps.folder'"
            results = self.service.files().list(q=query, fields="files(id, name)").execute()
            items = results.get("files", [])
            for item in items:
                if item['name'] in scopes:
                    logger.info(f"▶ Folder: {item['name']}")
                    self.list_all_pdfs_in_folder(item['id'], folder_name=item['name'])
            logger.info("✅ Done")
        except HttpError as error:
            logger.error(f"Google Drive error: {error}")

    def list_all_pdfs_in_folder(self, folder_id: str, folder_name: str = "") -> None:
        """
        Uploads all PDF files in the specified Google Drive folder to the specified
        MinIO bucket. The folder must have a name that is in the provided list of scopes.

        Args:
            folder_id (str): The ID of the Google Drive folder to be processed.
            folder_name (str): The name of the Google Drive folder being processed.
        """
        query = f"'{folder_id}' in parents and mimeType='application/pdf'"
        results = self.service.files().list(
            q=query,
            fields="files(id, name, mimeType, createdTime, modifiedTime, size, owners, lastModifyingUser)"
        ).execute()

        for file in results.get('files', []):
            file_id = file['id']
            file_name_clean = sanitize_filename(file['name'])
            metadata = {
                "file_name": file_name_clean,
                "author_name": file['owners'][0].get('displayName', 'unknown'),
                "author_email": file['owners'][0].get('emailAddress', 'unknown'),
                "author_profile": file['owners'][0].get('photoLink', ''),
                "uploaded_date": file.get('modifiedTime'),
                "created_date": file.get('createdTime'),
                "size": file.get('size', "0"),
                "filetype": file['mimeType'],
                "location": f"{folder_name}/{file_name_clean}",
                "modified_by_name": file.get('lastModifyingUser', {}).get('displayName', 'Unknown'),
                "modified_by_email": file.get('lastModifyingUser', {}).get('emailAddress', 'Unknown'),
                "modified_profile": file.get('lastModifyingUser', {}).get('photoLink', ''),
                "modified_time": file.get('modifiedTime', '')
            }

            metadata_validated = MetadataValidation(**metadata)

            self.upload_to_minio(file_id, metadata_validated)

        subfolders = self.service.files().list(
            q=f"'{folder_id}' in parents and mimeType='application/vnd.google-apps.folder'",
            fields="files(id, name)"
        ).execute()
        for folder in subfolders.get('files', []):
            self.list_all_pdfs_in_folder(folder['id'], folder_name=f"{folder_name}/{folder['name']}")

    def download_file(self, file_id: str) -> bytes:
        """Downloads the specified Google Drive file and returns its contents as a bytes object."""
        request = self.service.files().get_media(fileId=file_id)
        file_data = BytesIO()
        downloader = MediaIoBaseDownload(file_data, request)
        done = False
        while not done:
            _, done = downloader.next_chunk()
        file_data.seek(0)
        return file_data.read()

    def upload_to_minio(self, file_id: str, metadata: dict) -> None:
        """
        Uploads a file from Google Drive to a MinIO bucket.

        This method downloads a file from Google Drive using its file ID, and then
        uploads it to a specified MinIO bucket. The bucket is created if it does not
        exist, and a policy is set for the bucket. The file is uploaded with metadata
        that includes author details, upload and creation dates, file size and type,
        and modification details.

        Args:
            file_id (str): The ID of the file in Google Drive.
            metadata (dict): A dictionary containing metadata about the file, such as
                            file name, author details, upload and creation dates, size,
                            file type, location, and modification details.

        Logs:
            Information about bucket creation and policy setting.
            Success message upon successful upload to MinIO.
            Error message if an exception occurs during upload.
        """
        try:
            file_bytes = self.download_file(file_id)
            client = Minio(
                endpoint=self.minio_host,
                access_key=os.getenv("MINIO_ROOT_USER"),
                secret_key=os.getenv("MINIO_ROOT_PASSWORD"),
                secure=False
            )

            if not client.bucket_exists(self.minio_bucket):
                client.make_bucket(self.minio_bucket)
                client.set_bucket_policy(self.minio_bucket, BUCKET_POLICY)
                logger.info(f"✅ Bucket '{self.minio_bucket}' created and policy set.")

            client.put_object(
                bucket_name=self.minio_bucket,
                object_name=metadata.location,
                data=BytesIO(file_bytes),
                length=len(file_bytes),
                content_type="application/pdf",
                metadata= {
                    "author_name": metadata.author_name,
                    "author_email": metadata.author_email,
                    "author_profile": metadata.author_profile,
                    "uploaded_date": metadata.uploaded_date,
                    "created_date": metadata.created_date,
                    "size": metadata.size,
                    "filetype": metadata.filetype,
                    "modified_by_name": metadata.modified_by_name,
                    "modified_by_email": metadata.modified_by_email,
                    "modified_profile": metadata.modified_profile,
                    "modified_time": metadata.modified_time
                }
            )
            logger.info(f"✅ Uploaded '{metadata.file_name}' to MinIO.")
        except Exception as e:
            logger.error(f"❌ Error in upload_file_to_minio: {str(e)}")

if __name__ == '__main__':
    FOLDER_ID = os.getenv("FOLDER_DRIVE_ID")
    scopes = ['1. งานหลักสูตรและมาตรฐานการศึกษา', '2. งานหลักสูตรนานาชาติและหลักสูตรแนวใหม่']

    connector = DrivetoMinio(bucket_name="document")
    connector.run(folder_id=FOLDER_ID, scopes=scopes)