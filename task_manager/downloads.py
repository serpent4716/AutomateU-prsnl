import nltk

print("[Build Script] Downloading NLTK 'words' package...")
nltk.download('words')
print("[Build Script] Downloading NLTK 'stopwords' package...")
nltk.download('stopwords') # You will probably need this next.

# Add any other nltk.download() or spaCy.load() commands here.
# e.g., nltk.download('punkt')

print("[Build Script] All models downloaded successfully.")