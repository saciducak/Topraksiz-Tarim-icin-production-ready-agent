#!/bin/bash
# Setup script for Topraksız Tarım AI Agent

echo "🌾 Topraksız Tarım AI Agent - Kurulum"
echo "======================================"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker bulunamadı. Lütfen Docker yükleyin."
    exit 1
fi
echo "✅ Docker mevcut"

# Check Ollama
if ! command -v ollama &> /dev/null; then
    echo "⚠️  Ollama bulunamadı. Lütfen ollama.com'dan yükleyin."
else
    echo "✅ Ollama mevcut"
    
    # Pull required models
    echo ""
    echo "📦 Ollama modelleri indiriliyor..."
    ollama pull llama3.2
    ollama pull nomic-embed-text
fi

# Create .env if not exists
if [ ! -f .env ]; then
    echo ""
    echo "📝 .env dosyası oluşturuluyor..."
    cp .env.example .env
    echo "✅ .env oluşturuldu"
else
    echo "✅ .env mevcut"
fi

# Create Python venv for local development
echo ""
echo "🐍 Python ortamı hazırlanıyor..."
cd backend
python3 -m venv venv 2>/dev/null || python -m venv venv
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate
pip install -r requirements.txt -q
cd ..
echo "✅ Python bağımlılıkları yüklendi"

# Install Node modules
echo ""
echo "📦 Node.js bağımlılıkları yükleniyor..."
cd frontend
npm install --silent
cd ..
echo "✅ Node.js bağımlılıkları yüklendi"

# Done
echo ""
echo "======================================"
echo "🎉 Kurulum tamamlandı!"
echo ""
echo "Başlatmak için:"
echo "  make up          # Docker ile başlat"
echo "  make backend     # Sadece backend (yerel)"
echo "  make frontend    # Sadece frontend (yerel)"
echo ""
echo "Ollama'yı başlatmayı unutmayın:"
echo "  ollama serve"
