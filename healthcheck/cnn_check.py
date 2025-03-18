import mysql.connector
from qdrant_client import QdrantClient
from dotenv import load_dotenv
import os

load_dotenv()

def mysql_check(host: str="localhost", port: int=3306):
    """
    Checks the connection to a MySQL database using provided host and port.

    This function attempts to connect to a MySQL database using environment
    variables for the database name, user, and password. If the connection
    is successful, it prints the connected database name. If the connection
    fails, it prints an error message. The connection is closed after the
    check.

    Args:
        host (str): The host address of the MySQL server. Default is "localhost".
        port (int): The port number on which the MySQL server is listening.
                    Default is 3306.

    Raises:
        mysql.connector.Error: If the connection to MySQL fails.
    """

    try:
        connection = mysql.connector.connect(
            host=host,
            port=port,
            database=os.getenv("MYSQL_DATABASE"),
            user=os.getenv("MYSQL_USER"),
            password=os.getenv("MYSQL_PASSWORD"), 
        )
        if connection.is_connected():
            print("Successfully connected to MySQL 🚀")
            cursor = connection.cursor()
            cursor.execute("SELECT DATABASE();")
            db_name = cursor.fetchone()
            print(f"MySQL Database: {db_name[0]}")
    except mysql.connector.Error:
        print("Failed to connect to MySQL ❌")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def qdrant_check(host: str="localhost", port: int=6333):
    """
    Checks the connection to a Qdrant server using the provided host and port.

    This function attempts to connect to a Qdrant server and retrieves 
    server information. If the connection is successful, it prints a 
    success message. If the connection fails, it prints an error message.

    Args:
        host (str): The host address of the Qdrant server. Default is "localhost".
        port (int): The port number on which the Qdrant server is listening.
                    Default is 6333.

    Raises:
        Exception: If the connection to Qdrant fails.
    """

    client = QdrantClient(host=host, port=port)
    try:
        response = client.info()
        print("Successfully connected to Qdrant 🚀")
    except Exception:
        print("Failed to connect to Qdrant ❌")

if __name__ == "__main__":
    if os.getenv("DOCKER_HOST"):
        print("Docker host is set(service name) ✅") # set to server name in docker-compose
        mysql_check(
            host="mysql",
            port=3306
        )
        qdrant_check(
            host="qdrant",
            port=6333
        )
    else:
        print("Docker host is not set(localhost) ❌") # set to localhost
        mysql_check(
            host="localhost",
            port=3306
        )
        qdrant_check(
            host="localhost",
            port=6333
        )