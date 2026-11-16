
import chromadb
import uuid

from app.config import (
    CHROMA_DIR,
    COLLECTION_NAME,
    TOP_K
)

from app.embeddings import generate_embeddings


client = chromadb.PersistentClient(
    path=CHROMA_DIR
)

collection = client.get_or_create_collection(
    name=COLLECTION_NAME,
    metadata={"hnsw:space": "cosine"}
)


def store_chunks(chunks, document_id, filename):

    if not chunks:
        return 0

    texts = [chunk["text"] for chunk in chunks]

    embeddings = generate_embeddings(texts)

    ids = [
        str(uuid.uuid4())
        for _ in chunks
    ]

    metadatas = []

    for chunk in chunks:

        metadatas.append({
            "document_id": document_id,
            "filename": filename,
            "page": chunk["page"],
            "chunk_index": chunk["chunk_index"]
        })

    collection.add(
        ids=ids,
        documents=texts,
        embeddings=embeddings,
        metadatas=metadatas
    )

    return len(chunks)


def search_chunks(question):

    if collection.count() == 0:
        return []

    query_embedding = generate_embeddings([question])

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=min(TOP_K, collection.count()),
        include=[
            "documents",
            "metadatas",
            "distances"
        ]
    )

    retrieved_chunks = []

    if not results["documents"]:
        return retrieved_chunks

    for i, document in enumerate(results["documents"][0]):

        metadata = results["metadatas"][0][i]

        distance = results["distances"][0][i]

        retrieved_chunks.append({
            "text": document,
            "filename": metadata["filename"],
            "page": metadata["page"],
            "distance": distance
        })

    return retrieved_chunks


def get_all_documents():

    results = collection.get(
        include=["metadatas"]
    )

    documents = {}

    for metadata in results["metadatas"]:

        doc_id = metadata["document_id"]

        if doc_id not in documents:

            documents[doc_id] = {
                "document_id": doc_id,
                "filename": metadata["filename"],
                "chunks": 0
            }

        documents[doc_id]["chunks"] += 1

    return list(documents.values())
