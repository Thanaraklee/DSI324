from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer
from qdrant_client.models import Filter, FieldCondition, MatchText

from config.config import COLLECTION_NAME

class NeuralSearcher:
    def __init__(self, collection_name: str, model: object, qdrant_host: str = "http://localhost:6333"):   
        """
        Args:
            collection_name (str): The name of the collection to search in.
            model (object): A sentence transformer model to convert text to vectors.
            qdrant_host (str, optional): The address of the Qdrant server. Defaults to "http://localhost:6333".
        """
        self.collection_name = collection_name
        self.model = model
        self.qdrant_client = QdrantClient(qdrant_host)

    def search(self, query: str, location: list = None, top: int = 5) -> list:
        """
        Search for the most similar items to the given text in the collection.

        Args:
            query (str): The text to search for.
            location (list, optional): List of location strings for filtering.
            top (int, optional): The number of results to return per location. Defaults to 5.

        Returns:
            list: A list of payloads (dictionaries) of the most similar items.
        """
        vector = self.model.encode(query).tolist()
        results = []

        # ถ้ามีหลาย location ให้ query แยกแต่ละ location แล้วรวมผลลัพธ์
        if location:
            for loc in location:
                query_filter = Filter(
                    must=[
                        FieldCondition(
                            key="location",
                            match=MatchText(text=loc),
                        )
                    ]
                )

                search_result = self.qdrant_client.query_points(
                    collection_name=self.collection_name,
                    query=vector,
                    query_filter=query_filter,
                    limit=top,
                ).points

                location_results = [
                    {"payload": hit.payload, "score": hit.score}
                    for hit in search_result
                ]
                results.extend(location_results)
        else:
            # ถ้าไม่ระบุ location ก็หา top n ทั้งหมด
            search_result = self.qdrant_client.query_points(
                collection_name=self.collection_name,
                query=vector,
                limit=top,
            ).points

            results = [
                {"payload": hit.payload, "score": hit.score}
                for hit in search_result
            ]

        return results
    
if __name__ == "__main__":
    collection_name = COLLECTION_NAME
    model = SentenceTransformer("BAAI/bge-m3", device="cuda")
    qdrant_host = "http://localhost:6333"

    neural_searcher = NeuralSearcher(
        collection_name=collection_name,
        model=model,
        qdrant_host=qdrant_host,
    )
    location = "2. งานหลักสูตรนานาชาติและหลักสูตรแนวใหม่/คณะแพทยศาสตร์/1.มคอ2แพทยศาสตรบัณฑิตปรับปรุง2563(ไทย)25พ.ย..pdf"
    location = [location.split("/")[1]]
    # print(neural_searcher.search("อาชีพผู้ดูแลระบบ"))
    file_name = neural_searcher.search(query="อาชีพ", location=location, top=10)
    for i in file_name:
        print(i['payload']['file_name'])