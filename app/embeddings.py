
import requests

from app.config import EMBEDDING_MODEL, OLLAMA_URL


def generate_embeddings(texts):

    embeddings = []

    for text in texts:

        response = requests.post(
            f"{OLLAMA_URL}/api/embeddings",

            json={
                "model": EMBEDDING_MODEL,
                "prompt": text
            },

            timeout=120
        )

        response.raise_for_status()

        embedding = response.json()["embedding"]

        embeddings.append(embedding)

    return embeddings
