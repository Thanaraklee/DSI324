from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchText, MatchAny

from config.config import COLLECTION_NAME

class TextSearcher:
    def __init__(self, collection_name: str, qdrant_host: str = "http://localhost:6333"):
        """
        Args:
            collection_name (str): The name of the collection to search in.
            qdrant_host (str, optional): The address of the Qdrant server. Defaults to "http://localhost:6333".
        """
        self.collection_name = collection_name
        self.qdrant_client = QdrantClient(qdrant_host)


    def search(self, query: str, location: list = None, top: int = 5) -> list:
        """
        Search for the most similar items to the given text in the collection.
        If location is provided, return top-N results per location.
        """
        all_payloads = []

        if location:
            for loc in location:
                scroll_filter = Filter(
                    must=[
                        FieldCondition(
                            key="content",
                            match=MatchText(text=query),
                        ),
                        FieldCondition(
                            key="location",
                            match=MatchText(text=loc),
                        )
                    ]
                )

                search_result = self.qdrant_client.scroll(
                    collection_name=self.collection_name,
                    scroll_filter=scroll_filter,
                    with_payload=True,
                    with_vectors=False,
                    limit=top
                )
                payloads = [
                    {"payload": hit.payload, "score": "N/A"}
                    for hit in search_result[0]
                ]
                all_payloads.extend(payloads)
        else:
            scroll_filter = Filter(
                must=[
                    FieldCondition(
                        key="content",
                        match=MatchText(text=query),
                    )
                ]
            )

            search_result = self.qdrant_client.scroll(
                collection_name=self.collection_name,
                scroll_filter=scroll_filter,
                with_payload=True,
                with_vectors=False,
                limit=top
            )
            all_payloads = [
                {"payload": hit.payload, "score": "N/A"}
                for hit in search_result[0]
            ]

        return all_payloads

if __name__ == "__main__":
    collection_name = COLLECTION_NAME
    qdrant_host = "http://localhost:6333"
    searcher = TextSearcher(
        collection_name=collection_name,
        qdrant_host=qdrant_host
    )
    location = "2. งานหลักสูตรนานาชาติและหลักสูตรแนวใหม่/คณะแพทยศาสตร์/1.มคอ2แพทยศาสตรบัณฑิตปรับปรุง2563(ไทย)25พ.ย..pdf"
    location = [location.split("/")[1]]
    file_name = searcher.search(query="อาชีพ", location=location, top=10)
    for i in file_name:
        print(i['payload']['file_name'])
