import React, { useState } from "react";
import "./App.css";

const App = () => {
    const [chatStarted, setChatStarted] = useState(false);
    const [theme, setTheme] = useState("light");
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState("");

    const toggleTheme = () => {
        setTheme(theme === "light" ? "dark" : "light");
    };

    const startChat = () => {
        setChatStarted(true);
    };

    const sendMessage = async () => {
        if (!userInput.trim()) return;

        const userMessage = { sender: "user", text: userInput };
        setMessages([...messages, userMessage]);
        setUserInput("");

        const response = await fetch("/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: userInput })
        });
        
        const data = await response.json();
        const botMessage = { sender: "bot", text: data.response };
        setMessages((prev) => [...prev, botMessage]);
    };

    return (
        <div className={`app ${theme}`}>
            {!chatStarted ? (
                <div className="home">
                    <h1>Mental Health Chatbot</h1>
                    <p>Your personal AI companion for emotional well-being.</p>
                    <button onClick={startChat}>Start Chat</button>
                    <button onClick={toggleTheme}>Toggle Theme</button>
                </div>
            ) : (
                <div className="chat-container">
                    <h3>Mental Health Chatbot</h3>
                    <div className="messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.sender}`}>{msg.text}</div>
                        ))}
                    </div>
                    <div className="input-container">
                        <input 
                            type="text" 
                            value={userInput} 
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Type a message..."
                            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                        />
                        <button onClick={sendMessage}>Send</button>
                    </div>
                    <button onClick={toggleTheme}>Toggle Theme</button>
                </div>
            )}
        </div>
    );
};

export default App;
