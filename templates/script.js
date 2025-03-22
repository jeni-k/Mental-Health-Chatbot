let feeling = "Neutral";
let prev = [];

function slice_prev(){
    if(prev.length < 3){
        return prev;
    }
    return prev.slice(prev.length - 3);
}

function sendMessage() {
    let userText = document.getElementById("userInput").value;
    let messagesDiv = document.getElementById("messages");

    // Add user message
    let userMessage = document.createElement("div");
    userMessage.className = "message user";
    userMessage.innerText = "You: " + userText;
    messagesDiv.appendChild(userMessage);
    showTypingIndicator();

    // Send to Flask API
    fetch("/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, feeling:feeling, history:slice_prev() })
    })
    .then(response => response.json())
    .then(data => {
        feeling = data.feeling;
        let botMessage = document.createElement("div");
        botMessage.className = "message bot";
        botMessage.innerText = "Bot: " + data.response;
        messagesDiv.appendChild(botMessage);
        prev.push({"User": userText, "Bot": data.response})
    }).finally(() => {
        hideTypingIndicator();
    });

    document.getElementById("userInput").value = "";
}

function showTypingIndicator() {
    let typingIndicator = document.getElementById("typingIndicator");
    typingIndicator.style.display = "block";
}

function hideTypingIndicator() {
    document.getElementById("typingIndicator").style.display = "none";
}

function handleKeyPress(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
}