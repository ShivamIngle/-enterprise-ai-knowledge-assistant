
const API_BASE = "";

const elements = {
    chatView: document.getElementById("chatView"),
    documentsView: document.getElementById("documentsView"),
    chatMessages: document.getElementById("chatMessages"),
    welcomeScreen: document.getElementById("welcomeScreen"),
    questionInput: document.getElementById("questionInput"),
    sendBtn: document.getElementById("sendBtn"),
    typingIndicator: document.getElementById("typingIndicator"),
    connectionStatus: document.getElementById("connectionStatus"),
    documentsList: document.getElementById("documentsList"),
    pdfInput: document.getElementById("pdfInput"),
    uploadStatus: document.getElementById("uploadStatus"),
    dropZone: document.getElementById("dropZone"),
    historyList: document.getElementById("historyList")
};

let isSending = false;
let isUploading = false;
let conversationHistory = [];


/* --------------------------------
   GENERAL API REQUEST
-------------------------------- */

async function apiRequest(url, options = {}) {

    const response = await fetch(API_BASE + url, options);

    const contentType = response.headers.get("content-type") || "";

    let data;

    if (contentType.includes("application/json")) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    if (!response.ok) {
        const message =
            typeof data === "object"
                ? data.detail || data.message || JSON.stringify(data)
                : data;

        throw new Error(message || `HTTP Error ${response.status}`);
    }

    return data;
}


/* --------------------------------
   BACKEND HEALTH CHECK
-------------------------------- */

async function checkBackend() {

    const dot = document.querySelector(".status-dot");

    try {

        const data = await apiRequest("/health");

        if (data.status === "healthy") {

            elements.connectionStatus.textContent = "Backend Connected";

            dot.classList.add("online");

        } else {

            throw new Error("Backend is not healthy");
        }

    } catch (error) {

        elements.connectionStatus.textContent = "Backend Disconnected";

        dot.classList.remove("online");

        console.error("Backend health check:", error);
    }
}


/* --------------------------------
   NAVIGATION
-------------------------------- */

function showView(view) {

    const isChat = view === "chat";

    elements.chatView.classList.toggle("hidden", !isChat);
    elements.documentsView.classList.toggle("hidden", isChat);

    document.querySelectorAll(".nav-item").forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.view === view
        );

    });

    document.getElementById("pageTitle").textContent =
        isChat ? "AI Knowledge Assistant" : "Document Management";

    if (!isChat) {
        loadDocuments();
    }
}


document.querySelectorAll(".nav-item").forEach(button => {

    button.addEventListener("click", () => {

        showView(button.dataset.view);

    });

});


/* --------------------------------
   CHAT MESSAGE UI
-------------------------------- */

function addMessage(role, text, sources = []) {

    elements.welcomeScreen.classList.add("hidden");

    const message = document.createElement("div");

    message.className =
        `message ${role === "user" ? "user-message" : "ai-message"}`;

    const avatar = document.createElement("div");

    avatar.className =
        `avatar ${role === "user" ? "user-avatar" : "ai-avatar"}`;

    avatar.textContent = role === "user" ? "YOU" : "AI";

    const content = document.createElement("div");

    content.className = "message-content";

    const label = document.createElement("div");

    label.className = "message-label";

    label.textContent =
        role === "user" ? "You" : "Knowledge AI";

    const textElement = document.createElement("div");

    textElement.className = "message-text";

    // textContent prevents untrusted document content
    // from being interpreted as HTML.
    textElement.textContent = text;

    content.appendChild(label);
    content.appendChild(textElement);

    if (sources.length > 0) {

        const sourceContainer = document.createElement("div");

        sourceContainer.className = "source-list";

        sources.forEach(source => {

            const chip = document.createElement("div");

            chip.className = "source-chip";

            const filename = source.filename || "Unknown document";

            const page = source.page
                ? ` · Page ${source.page}`
                : "";

            chip.textContent = `📄 ${filename}${page}`;

            sourceContainer.appendChild(chip);

        });

        content.appendChild(sourceContainer);
    }

    message.appendChild(avatar);
    message.appendChild(content);

    elements.chatMessages.appendChild(message);

    elements.chatMessages.scrollTop =
        elements.chatMessages.scrollHeight;

    return message;
}


/* --------------------------------
   CHAT HISTORY
-------------------------------- */

function updateHistory(question) {

    const item = document.createElement("div");

    item.className = "history-item";

    item.textContent = question;

    elements.historyList.prepend(item);

    while (elements.historyList.children.length > 8) {

        elements.historyList.lastElementChild.remove();

    }

    const placeholder = elements.historyList.querySelector(".muted");

    if (placeholder) {
        placeholder.remove();
    }
}


/* --------------------------------
   ASK AI QUESTION
-------------------------------- */

async function sendQuestion(customQuestion = null) {

    if (isSending) return;

    const question =
        (customQuestion || elements.questionInput.value).trim();

    if (!question) return;

    isSending = true;

    elements.sendBtn.disabled = true;
    elements.sendBtn.textContent = "Thinking...";

    addMessage("user", question);

    updateHistory(question);

    elements.questionInput.value = "";

    elements.typingIndicator.classList.remove("hidden");

    try {

        const response = await apiRequest("/api/chat", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                question: question
            })

        });

        if (!response.answer) {

            throw new Error("The AI returned an empty response.");
        }

        addMessage(
            "assistant",
            response.answer,
            response.sources || []
        );

        conversationHistory.push({
            question: question,
            answer: response.answer,
            sources: response.sources || []
        });

    } catch (error) {

        console.error("Chat error:", error);

        addMessage(
            "assistant",
            "Unable to generate an answer. " + error.message
        );

    } finally {

        elements.typingIndicator.classList.add("hidden");

        elements.sendBtn.disabled = false;

        elements.sendBtn.textContent = "Send ↑";

        isSending = false;

        elements.questionInput.focus();
    }
}


/* --------------------------------
   CHAT BUTTON EVENTS
-------------------------------- */

elements.sendBtn.addEventListener("click", () => {

    sendQuestion();

});


elements.questionInput.addEventListener("keydown", event => {

    if (event.key === "Enter" && !event.shiftKey) {

        event.preventDefault();

        sendQuestion();
    }

});


document.querySelectorAll(".suggestion-card").forEach(button => {

    button.addEventListener("click", () => {

        sendQuestion(button.dataset.question);

    });

});


/* --------------------------------
   NEW CONVERSATION
-------------------------------- */

document.getElementById("newChatBtn").addEventListener("click", () => {

    if (isSending) return;

    elements.chatMessages.replaceChildren();

    elements.welcomeScreen.classList.remove("hidden");

    conversationHistory = [];

    elements.questionInput.value = "";

    elements.historyList.replaceChildren();

    const placeholder = document.createElement("p");

    placeholder.className = "muted";

    placeholder.textContent = "No conversations yet";

    elements.historyList.appendChild(placeholder);

    showView("chat");

});


/* --------------------------------
   PDF UPLOAD
-------------------------------- */

async function uploadPDF(file) {

    if (isUploading) return;

    if (!file) return;

    if (file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")) {

        showUploadStatus("Please select a valid PDF file.", true);

        return;
    }

    const MAX_SIZE = 20 * 1024 * 1024;

    if (file.size > MAX_SIZE) {

        showUploadStatus("PDF must be smaller than 20 MB.", true);

        return;
    }

    isUploading = true;

    showUploadStatus("Uploading and processing PDF... Please wait.");

    const formData = new FormData();

    formData.append("file", file);

    try {

        const response = await apiRequest("/api/upload", {

            method: "POST",

            body: formData

        });

        showUploadStatus(
            `Success! ${response.filename} uploaded. ` +
            `${response.chunks_created} chunks created.`
        );

        await loadDocuments();

        // Refresh the document listing from the backend.

    } catch (error) {

        console.error("Upload error:", error);

        showUploadStatus(
            "Upload failed: " + error.message,
            true
        );

    } finally {

        isUploading = false;

        elements.pdfInput.value = "";
    }
}


/* --------------------------------
   UPLOAD STATUS
-------------------------------- */

function showUploadStatus(message, isError = false) {

    elements.uploadStatus.textContent = message;

    elements.uploadStatus.classList.remove("hidden", "error");

    if (isError) {

        elements.uploadStatus.classList.add("error");

    }
}


/* --------------------------------
   FILE SELECTION
-------------------------------- */

document.getElementById("browseBtn").addEventListener("click", () => {

    elements.pdfInput.click();

});


document.getElementById("documentUploadBtn").addEventListener("click", () => {

    elements.pdfInput.click();

});


document.getElementById("welcomeUploadBtn").addEventListener("click", () => {

    showView("documents");

    elements.pdfInput.click();

});


elements.pdfInput.addEventListener("change", event => {

    const file = event.target.files[0];

    if (file) {
        uploadPDF(file);
    }

});


/* --------------------------------
   DRAG AND DROP
-------------------------------- */

elements.dropZone.addEventListener("dragover", event => {

    event.preventDefault();

    elements.dropZone.classList.add("dragover");

});


elements.dropZone.addEventListener("dragleave", () => {

    elements.dropZone.classList.remove("dragover");

});


elements.dropZone.addEventListener("drop", event => {

    event.preventDefault();

    elements.dropZone.classList.remove("dragover");

    const file = event.dataTransfer.files[0];

    if (file) {
        uploadPDF(file);
    }

});


/* --------------------------------
   LOAD DOCUMENTS
-------------------------------- */

async function loadDocuments() {

    elements.documentsList.innerHTML =
        '<div class="empty-state">Loading documents...</div>';

    try {

        const response = await apiRequest("/api/documents");

        const documents = response.documents || [];

        elements.documentsList.replaceChildren();

        if (documents.length === 0) {

            const empty = document.createElement("div");

            empty.className = "empty-state";

            empty.textContent =
                "No documents uploaded yet. Upload a PDF to get started.";

            elements.documentsList.appendChild(empty);

            return;
        }

        documents.forEach(documentData => {

            const card = document.createElement("div");

            card.className = "document-card";

            const icon = document.createElement("div");

            icon.className = "pdf-icon";

            icon.textContent = "PDF";

            const info = document.createElement("div");

            info.className = "document-info";

            const name = document.createElement("strong");

            name.textContent = documentData.filename || "Unnamed PDF";

            const details = document.createElement("span");

            details.textContent =
                `${documentData.chunks || 0} text chunks · Indexed in knowledge base`;

            info.appendChild(name);

            info.appendChild(details);

            card.appendChild(icon);

            card.appendChild(info);

            elements.documentsList.appendChild(card);

        });

    } catch (error) {

        console.error("Document loading error:", error);

        const errorBox = document.createElement("div");

        errorBox.className = "empty-state";

        errorBox.textContent =
            "Unable to load documents: " + error.message;

        elements.documentsList.replaceChildren(errorBox);
    }
}


/* --------------------------------
   REFRESH DOCUMENTS
-------------------------------- */

document.getElementById("refreshDocumentsBtn")
    .addEventListener("click", loadDocuments);


/* --------------------------------
   INITIALIZE APPLICATION
-------------------------------- */

async function initializeApp() {

    await checkBackend();

    await loadDocuments();

    console.log("Enterprise AI Knowledge Assistant initialized.");

}

initializeApp();
