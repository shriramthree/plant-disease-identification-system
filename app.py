import streamlit as st
import tensorflow as tf
import numpy as np
from PIL import Image
import cv2

# -------------------------------
# 🧠 Load your trained model
# -------------------------------
@st.cache_resource
def load_model():
    model = tf.keras.models.load_model("plant_disease_model.h5")
    return model

model = load_model()

# -------------------------------
# ⚙️ Define helper: preprocess image
# -------------------------------
def preprocess_image(img):
    img = img.resize((128, 128))  # resize to your model's input size
    img_array = np.array(img)
    img_array = img_array / 255.0  # normalize
    img_array = np.expand_dims(img_array, axis=0)
    return img_array

# -------------------------------
# 🌿 Streamlit UI
# -------------------------------
st.set_page_config(page_title="Plant Leaf Disease Identification", layout="centered")
st.title("🌱 Plant Leaf Disease Identification")
st.write("Upload a leaf image to predict the disease using a trained CNN model.")

uploaded_file = st.file_uploader("Upload a leaf image...", type=["jpg", "jpeg", "png"])

if uploaded_file is not None:
    # Display image
    image = Image.open(uploaded_file)
    st.image(image, caption="Uploaded Leaf", use_column_width=True)

    # Preprocess
    st.write("Analyzing image...")
    processed_image = preprocess_image(image)

    # Predict
    prediction = model.predict(processed_image)
    predicted_class = np.argmax(prediction, axis=1)[0]

    # Replace this list with your real class names
    class_names = ["Apple___Black_rot", "Apple___Healthy", "Corn___Common_rust", "Corn___Healthy"]
    result = class_names[predicted_class] if predicted_class < len(class_names) else "Unknown"

    # Display result
    st.success(f"✅ Predicted Disease: **{result}**")

st.markdown("---")
st.markdown("👨‍🔬 *Built using Streamlit and TensorFlow*")

