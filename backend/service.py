import uvicorn
from fastapi import Query
from fastapi import FastAPI
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer

from config.config import COLLECTION_NAME
from backend.nerual_search import NeuralSearcher
from backend.text_search import TextSearcher
from backend.extract_minio import MinioExtract
from config.logging_config.modern_log import LoggingConfig

# ---------------------------------------------------------------------------- #
#                                LOGGING CONFIG                                #
# ---------------------------------------------------------------------------- #
logger = LoggingConfig(level="INFO").get_logger()
# ---------------------------------------------------------------------------- #

model = SentenceTransformer("BAAI/bge-m3", device="cuda") # cuda or cpu

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


neural_searcher = NeuralSearcher(
    collection_name=COLLECTION_NAME,
    model=model,
)
text_searcher = TextSearcher(
    collection_name=COLLECTION_NAME,
)


faculty_searcher = MinioExtract()

@app.get("/api/faculties")
async def get_faculties():
    faculties = faculty_searcher.list_objects()  # หรือ faculty_searcher.get_faculties() ถ้ามี method แยก
    return {"faculties": faculties}

@app.get("/api/search")
async def read_item(
    q: str,
    neural: bool = True,
    location: Optional[List[str]] = Query(default=None),
    top: int = 10
):
    return {
        "result": neural_searcher.search(query=q, location=location, top=top)
        if neural else text_searcher.search(query=q, location=location, top=top)
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
