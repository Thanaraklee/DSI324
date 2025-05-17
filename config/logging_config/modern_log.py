import logging
import inspect  
import os
from rich.logging import RichHandler

FORMAT = "[%(levelname)s|%(module)s|L%(lineno)d] %(asctime)s: %(message)s"
DATE_FORMAT = "%Y-%m-%dT%H:%M:%S%z"

class LoggingConfig:
    def __init__(self, level: str = "DEBUG", log_file: str = None):
        """
        Initialize the logger with the specified level and log file.

        Args:
            level (str, optional): The logging level. Defaults to "DEBUG".
            log_file (str, optional): The log file path. Defaults to None.

        If log_file is not specified, the logger will use the caller's filename with .log extension.
        The logger will also add a console handler with level "INFO" and a file handler with level "WARNING".
        """
        logger = logging.getLogger()

        if log_file is None:
            caller_frame = inspect.stack()[1]
            caller_filename = os.path.basename(caller_frame.filename)
            base_name, _ = os.path.splitext(caller_filename)
            log_file = f"{base_name}.log"

        console_handler = RichHandler(level="INFO")
        console_handler.setFormatter(logging.Formatter(FORMAT, DATE_FORMAT))

        os.makedirs("tmp",exist_ok=True)
        file_handler = logging.FileHandler(f"tmp/{log_file}", encoding="utf-8")
        file_handler.setLevel(logging.WARNING)  # ตั้งระดับการบันทึกเป็น WARNING สำหรับไฟล์
        file_handler.setFormatter(logging.Formatter(FORMAT, DATE_FORMAT))

        if not logger.handlers:
            logger.addHandler(console_handler)
            logger.addHandler(file_handler)

        logger.setLevel(level)

    def get_logger(self, name: str = __name__):
        """
        Get a logger instance with the specified name.

        Args:
            name (str, optional): The name of the logger. Defaults to the module's __name__.

        Returns:
            logging.Logger: A logger instance configured with the specified name.
        """
        return logging.getLogger(name)


