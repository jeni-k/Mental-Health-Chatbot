import re
import pickle
import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForCausalLM
from huggingface_hub import login
import warnings
warnings.filterwarnings("ignore")
load_dotenv()
login(os.getenv("Hugging_face_token"))

app = Flask(__name__)
CORS(app, resources={r"/predict": {"origins": "*"}})  

# Load trained SVM model & vectorizer
with open("svm_model.pkl", "rb") as model_file:
    Loaded_model = pickle.load(model_file)
    Loaded_model.classes_ = ["Negative", "Neutral", "Positive"]

with open("tfidf_vectorizer.pkl", "rb") as vectorizer_file:
    vectorizer = pickle.load(vectorizer_file)

# Load Hugging Face model
tokenizer = AutoTokenizer.from_pretrained("google/gemma-3-1b-it")
model = AutoModelForCausalLM.from_pretrained("google/gemma-3-1b-it")
if tokenizer is None:
    raise ValueError("Tokenizer failed to load! Check your model name or authentication.")

def clean_text(text):
    text = str(text).lower()
    text = re.sub(r"http\S+|www\S+", "", text) 
    text = re.sub(r"\d+", "", text)  
    text = re.sub(r"[^\w\s]", "", text)  
    return text

def predict_sentiment(text):
    cleaned_text = clean_text(text)
    text_vectorized = vectorizer.transform([cleaned_text]).toarray()  
    prediction = Loaded_model.predict(text_vectorized)  
    return prediction[0]


def chat_with_model(user_message, history):
    prompt = "You are an empathetic mental health chatbot trained to give mental health support and make the end user happy. Respond in a short English messege.\n"

    for i in history:
        prompt += "User: " + i["User"] + "Bot: " + i["Bot"] + "\n"
    
    prompt = prompt + "User: " + user_message + "\n" + "Bot: "
    input_ids = tokenizer(prompt, return_tensors="pt").input_ids
    output_ids = model.generate(
        input_ids,
        max_new_tokens=80,
        temperature=0.65,
        top_p=0.75,
        eos_token_id=tokenizer.eos_token_id,
        do_sample=True,
    )
    output_text = tokenizer.decode(output_ids[0], skip_special_tokens=True)
    print(output_text)
    return output_text[len(prompt):].split("User:")[0]


# Route for UI
@app.route("/")
def index():
    return render_template("index.html")

# Prediction API
@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    user_message = data["message"]
    feeling = data["feeling"]
    history = data["history"]
    prediction = predict_sentiment(user_message)

    responses = {
        "Negative": "I'm sorry to hear that. You are not alone. Would you like to talk more about it?",
        "Neutral": "That sounds neutral. I'm here to listen if you want to share anything.",
        "Positive": "That's great! Stay positive and keep going!\n (The chat bot ended as you are now satisfied and happy) \n Refresh the page to continue"
    }
    bot_response = responses[prediction]

    if feeling == "Neutral":
        pass
    elif feeling == "Negative" :
        print("generating bot response")
        bot_response = chat_with_model(user_message, history)
    else:
        pass
    
    return jsonify({"response": bot_response, "feeling": prediction})


app.run(host="0.0.0.0", port=8000)
