import streamlit as st
import tensorflow as tf
import numpy as np
import gdown
import os
from PIL import Image
import cv2

# -----------------------------
# CONFIGURATION
# -----------------------------
# Google Drive link for your model (.h5 file)
# Example: https://drive.google.com/file/d/1AbCdEfGhIjKlMn/view?usp=sharing
# Replace the ID below with your actual file ID
GOOGLE_DRIVE_FILE_ID = "YOUR_FILE_ID_HERE"

MODEL_PATH = "plant_disease_model.h5"

# -----------------------------
# DOWNLOAD MODEL IF NOT PRESENT
# -----------------------------
def download_model():
    if not os.path.exists(MODEL_PATH):
        st.info("📥 Downloading model from Google Drive...")
        try:
            gdown.download(
                f"https://drive.google.com/uc?id={GOOGLE_DRIVE_FILE_ID}",
                MODEL_PATH,
                quiet=False
            )
            st.success("✅ Model downloaded successfully!")
        except Exception as e:
            st.error(f"❌ Failed to download model: {e}")

# -----------------------------
# LOAD MODEL
# -----------------------------
@st.cache_resource
def load_model():
    download_model()
    model = tf.keras.models.load_model(MODEL_PATH)
    return model

model = load_model()

# -----------------------------
# CLASS LABELS
# -----------------------------
class_names = [
    "Apple___Black_rot",
    "Apple___Healthy",
    "Corn___Common_rust",
    "Corn___Gray_leaf_spot",
    "Corn___Healthy",
    "Potato___Early_blight",
    "Potato___Healthy",
    "Potato___Late_blight",
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Healthy",
    "Tomato___Late_blight"
]

# -----------------------------
# STREAMLIT UI
# -----------------------------
st.title("🌿 Plant Leaf Disease Identification System")
st.markdown("Upload a leaf image to predict the disease using a trained CNN model.")

uploaded_file = st.file_uploader("📤 Upload a leaf image...", type=["jpg", "jpeg", "png"])

if uploaded_file is not None:
    # Read and display image
    image = Image.open(uploaded_file)
    st.image(image, caption="Uploaded Image", use_column_width=True)
    
    # Convert image for model
    img = np.array(image)
    img = cv2.resize(img, (224, 224))  # adjust to your training input size
    img = img / 255.0
    img = np.expand_dims(img, axis=0)
    
    # Prediction
    with st.spinner("🔍 Identifying disease..."):
        predictions = model.predict(img)
        predicted_class = np.argmax(predictions, axis=1)[0]
        result = class_names[predicted_class] if predicted_class < len(class_names) else "Unknown"

    st.success(f"🌱 **Predicted Disease:** {result}")

st.markdown("---")
st.caption("🚀 Built with Streamlit & TensorFlow | Deployed on Streamlit Cloud")
