#!/usr/bin/env python3
"""
Seed the knowledge base with comprehensive agricultural documents.
Works standalone - connects directly to Qdrant and Ollama.
"""
import asyncio
import httpx
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import uuid
import os

# Configuration
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
COLLECTION_NAME = "agricultural_knowledge"

# Comprehensive Turkish agricultural knowledge
SAMPLE_DOCUMENTS = [
    {
        "title": "Domates Erken Yanıklık Hastalığı (Alternaria solani)",
        "category": "hastalık",
        "crop": "domates",
        "content": """Erken yanıklık (Alternaria solani) domates bitkilerinde yaygın görülen fungal bir hastalıktır.

**Belirtiler:**
- Alt yapraklarda siyah-kahverengi, halka şeklinde (hedef tahtası görünümlü) lekeler
- Lekeler zamanla büyür ve yaprak sararır, kurur
- Meyvelerde sap çevresinde siyah, çökük lekeler
- Sap ve dallar üzerinde kahverengi lekeler

**Risk Faktörleri:**
- Yüksek nem (%80+) ve ılık sıcaklık (20-25°C)
- Yetersiz havalandırma
- Azot eksikliği

**Tedavi:**
1. Enfekte yaprakları HEMEN temizleyin ve imha edin
2. Bakır bazlı fungisit (Bordö bulamacı %1) püskürtün
3. Mancozeb veya Chlorothalonil içeren fungisitler uygulayın
4. Uygulama 7-10 gün arayla tekrarlayın
5. Bitki artıklarını tarladan uzaklaştırın

**Önleme:**
- Sertifikalı, hastalıksız tohum kullanın
- Bitki aralıklarını geniş tutun (en az 60 cm)
- 3-4 yıllık münavebe uygulayın
- Damla sulama tercih edin, yaprakları ıslatmayın"""
    },
    {
        "title": "Domates Geç Yanıklık Hastalığı (Phytophthora infestans)",
        "category": "hastalık",
        "crop": "domates",
        "content": """Geç yanıklık (Phytophthora infestans) domates ve patateste çok ciddi hasara yol açan tehlikeli bir oomycete hastalığıdır. İrlanda patates kıtlığına neden olmuştur.

**Belirtiler:**
- Yapraklarda su emmis görünümünde yeşil-kahverengi lekeler
- Nemli havalarda yaprakların alt yüzünde beyaz küf sporları
- Sap ve dallarda siyah-kahverengi lekeler
- Meyvelerde koyu, sert, yağlı görünümlü lekeler
- 3-5 gün içinde tüm bitkiyi öldürebilir!

**ACİL DURUM - Hızla Yayılır!**

**Acil Tedavi (24 saat içinde):**
1. Enfekte bitkileri tamamen söküp YAKIN
2. Sağlıklı bitkilere HEMEN sistemik fungisit uygulayın:
   - Metalaxyl/Mefenoxam + Mancozeb kombinasyonu
   - Phosphorous acid (Fosetyl-Al)
3. Uygulama 5-7 gün arayla tekrarlayın

**Önleme:**
- Dayanıklı çeşitler tercih edin (Roma, Celebrity)
- Sera havalandırmasını artırın
- Yaprak ıslaklığını minimize edin
- Enfekte patates tarlalarından uzak ekin"""
    },
    {
        "title": "Domates Yaprak Küfü (Cladosporium fulvum)",
        "category": "hastalık",
        "crop": "domates",
        "content": """Yaprak küfü özellikle sera domatesciliğinde ciddi verim kayıplarına neden olur.

**Belirtiler:**
- Üst yaprak yüzeyinde soluk yeşil-sarı lekeler
- Alt yaprak yüzeyinde kahverengi-mor kadifemsi küf
- Yapraklar kıvrılıp kurur
- %75'e kadar verim kaybı olabilir

**Uygun Koşullar:**
- Yüksek nem (%85+)
- Sıcaklık 20-25°C
- Yetersiz havalandırma

**Tedavi:**
1. Sera havalandırmasını artırın
2. Enfekte yaprakları temizleyin
3. Bakır veya kükürt bazlı fungisit uygulayın
4. Dayanıklı çeşitlere geçin

**Önleme:**
- Serada nem %70'in altında tutun
- Fan ile hava sirkülasyonu sağlayın
- Bitki sıklığını azaltın"""
    },
    {
        "title": "Domates Beslenme Eksiklikleri ve Gübreleme",
        "category": "beslenme",
        "crop": "domates",
        "content": """Domates bitkilerinde yaygın beslenme eksiklikleri, tanı ve çözümleri:

**AZOT (N) EKSİKLİĞİ:**
- Belirti: Yapraklar soluk yeşil, alt yapraklar sararır ve dökülür
- Büyüme yavaşlar, meyve küçük kalır
- Çözüm: 
  - Amonyum nitrat (%33): 20-30 kg/da
  - Üre (%46): 15-20 kg/da
  - Yapraktan %2'lik üre çözeltisi

**FOSFOR (P) EKSİKLİĞİ:**
- Belirti: Yapraklar koyu yeşil-morumsu, gelişme yavaş
- Çiçeklenme gecikir
- Çözüm:
  - DAP (18-46-0): 20-25 kg/da
  - Süper fosfat: 30-40 kg/da

**POTASYUM (K) EKSİKLİĞİ:**
- Belirti: Yaprak kenarları kahverengileşir, kıvrılır
- Meyve rengi soluk, kalite düşük
- Çözüm:
  - Potasyum sülfat: 25-30 kg/da
  - Potasyum nitrat yapraktan uygulama

**KALSİYUM (Ca) EKSİKLİĞİ - ÇİÇEK UCU ÇÜRÜKLÜĞÜ:**
- Belirti: Meyve ucunda siyah, çökük leke
- Sulama düzensizliği ile tetiklenir
- Çözüm:
  - Kalsiyum nitrat yaprak gübresi %0.5
  - Düzenli sulama programı
  - Toprak pH'ını 6.0-6.8 arasında tutun"""
    },
    {
        "title": "Domates Zararlıları ve Biyolojik Mücadele",
        "category": "zararlı",
        "crop": "domates",
        "content": """Domates zararlıları, tanı ve sürdürülebilir mücadele yöntemleri:

**BEYAZ SİNEK (Bemisia tabaci):**
- Yaprak altlarında küçük beyaz böcekler
- Yapışkan bal özü, kurum hastalığı
- Mücadele:
  - Sarı yapışkan tuzaklar (10 adet/1000 m²)
  - Encarsia formosa parazitoit (2-3 adet/m²)
  - Neem yağı spreyi (%1)

**KIRMIZI ÖRÜMCEK (Tetranychus urticae):**
- Yapraklarda bronzlaşma, sararma
- Yaprak altında ince ağ
- Mücadele:
  - Phytoseiulus persimilis yırtıcı akar
  - Nem oranını %60+ tutun
  - Kükürt tozu uygulaması

**YAPRAK GALERİ SİNEĞİ (Liriomyza):**
- Yapraklarda beyaz zigzag tüneller
- Mücadele:
  - Diglyphus isaea parazitoit
  - Sarı tuzaklar
  - Enfekte yaprakları toplayın

**YEŞİL KURT (Helicoverpa armigera):**
- Yaprak ve meyvelerde delikler
- Mücadele:
  - Bacillus thuringiensis (Bt) biyopestisit
  - Feromon tuzakları
  - Elle toplama (küçük alanlarda)

**DOMATES GÜVESİ (Tuta absoluta):**
- Yaprak, sap ve meyvelerde galeri
- ÇOK CİDDİ zararlı!
- Mücadele:
  - Delta tipi feromon tuzakları
  - Nesidiocoris tenuis yırtıcı böcek
  - Spinosad içeren ilaçlar"""
    },
    {
        "title": "Organik Domates Yetiştiriciliği",
        "category": "yetiştiricilik",
        "crop": "domates",
        "content": """Organik domates yetiştirme teknikleri ve sertifikasyon gereklilikleri:

**TOPRAK HAZIRLIĞI:**
- Sonbaharda yanmış ahır gübresi (3-4 ton/da)
- Yeşil gübreleme (fiğ, yonca)
- Toprak pH: 6.0-7.0

**FİDE DİKİMİ:**
- Mayıs ortası (son dondan 2 hafta sonra)
- Sıra arası: 80-100 cm
- Sıra üzeri: 40-50 cm
- Derin dikim (ilk yapraklara kadar)

**ORGANİK GÜBRELEME:**
- Solucan gübresi: 200-300 kg/da
- Deniz yosunu özütü: 15 günde bir
- Kemik unu (fosfor): 15-20 kg/da
- Ahşap külü (potasyum): 10-15 kg/da

**ORGANİK HASTALIK KONTROLÜ:**
- Bakır hidroksit (organik sertifikalı)
- Kükürt tozu (erken saatlerde)
- Trichoderma harzianum (toprak uygulaması)
- Bacillus subtilis (yaprak püskürtme)

**SERTİFİKASYON:**
- 3 yıl geçiş süreci
- Akredite kuruluş denetimi
- Kayıt tutma zorunluluğu"""
    },
    {
        "title": "Sera İklim Kontrolü ve Sulama",
        "category": "yetiştiricilik",
        "crop": "genel",
        "content": """Sera koşullarının optimizasyonu ve verimli sulama teknikleri:

**SICAKLIK KONTROLÜ:**
- Gündüz: 22-26°C optimum
- Gece: 15-18°C (minimum 10°C)
- 35°C üzeri çiçek dökümüne neden olur
- Isıtma: Sıcak su boruları, sıcak hava jeneratörü
- Soğutma: Fan&pad, gölgeleme, havalandırma

**NEM KONTROLÜ:**
- Optimum: %60-70
- %80 üzeri: Mantar hastalıkları riski
- %50 altı: Örümcek akar problemi
- Nem düşürme: Havalandırma, ısıtma
- Nem artırma: Sisleme sistemi

**IŞIK YÖNETİMİ:**
- Minimum 8 saat gün ışığı
- Kış aylarında yapay aydınlatma
- PAR ölçümü: 400-600 μmol/m²/s optimum

**DAMLA SULAMA:**
- Günlük su ihtiyacı: 2-4 L/bitki (mevsime göre)
- EC değeri: 2.0-3.5 mS/cm
- pH: 5.8-6.5
- Sulama frekansı: Günde 3-6 kez (kısa süreli)

**FERTİGASYON (Gübreli Sulama):**
- A tankı: Kalsiyum nitrat
- B tankı: Diğer gübreler
- Enjeksiyon oranı: 1:100 veya 1:200"""
    },
    {
        "title": "Hasat ve Depolama Teknikleri",
        "category": "hasat",
        "crop": "domates",
        "content": """Domates hasadı, olgunluk kriterleri ve depolama:

**HASAT ZAMANI:**
- Tam olgun (kırmızı): Hemen tüketim için
- Yarı olgun (pembe): 2-3 gün içinde tüketim
- Yeşil olgun (breaker): Uzun süre depolama/taşıma

**HASAT TEKNİĞİ:**
- Sabah serin saatlerde toplayın
- Saplı koparın (sapçık domateste kalmalı)
- Nazikçe taşıyın, ezilmelerden kaçının
- Plastik kasalar kullanın (tahta değil)

**DEPOLAMA KOŞULLARI:**
- Yeşil olgun: 12-15°C, 28 güne kadar
- Yarı olgun: 10-12°C, 14 güne kadar
- Tam olgun: 8-10°C, 7 güne kadar
- Nem: %85-90
- ⚠️ 5°C altı: Soğuk zararı (lekelenme, yumuşama)

**OLGUNLAŞTIRMA:**
- Etilen gazı uygulaması
- 20-25°C, 3-5 gün
- Karanlık ortam

**KALİTE KAYBI NEDENLERİ:**
- Mekanik hasar
- Soğuk zararı
- Aşırı olgunluk
- Mantar/bakteri bulaşması"""
    }
]


async def get_embedding(text: str, client: httpx.AsyncClient) -> list[float]:
    """Get embedding from Ollama."""
    try:
        response = await client.post(
            f"{OLLAMA_HOST}/api/embeddings",
            json={
                "model": OLLAMA_EMBED_MODEL,
                "prompt": text[:2000]  # Limit text length
            },
            timeout=60.0
        )
        response.raise_for_status()
        return response.json().get("embedding", [])
    except Exception as e:
        print(f"  ⚠️ Embedding hatası: {e}")
        return []


async def seed_knowledge_base():
    """Seed the knowledge base with sample documents."""
    print("🌾 Topraksız Tarım AI - Bilgi Tabanı Oluşturucu")
    print("=" * 50)
    print()
    
    # Check Ollama
    print("🔍 Ollama kontrolü...")
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{OLLAMA_HOST}/api/tags", timeout=10.0)
            models = [m["name"] for m in resp.json().get("models", [])]
            print(f"  ✅ Ollama bağlantısı başarılı")
            print(f"  📦 Mevcut modeller: {models}")
            
            if not any(OLLAMA_EMBED_MODEL in m for m in models):
                print(f"\n  ⚠️ {OLLAMA_EMBED_MODEL} modeli bulunamadı!")
                print(f"  🔧 Çözüm: ollama pull {OLLAMA_EMBED_MODEL}")
                return
        except Exception as e:
            print(f"  ❌ Ollama bağlantı hatası: {e}")
            print(f"  🔧 Çözüm: ollama serve komutunu çalıştırın")
            return
    
    # Connect to Qdrant
    print(f"\n🔍 Qdrant kontrolü ({QDRANT_HOST}:{QDRANT_PORT})...")
    try:
        qdrant = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
        qdrant.get_collections()
        print(f"  ✅ Qdrant bağlantısı başarılı")
    except Exception as e:
        print(f"  ❌ Qdrant bağlantı hatası: {e}")
        print(f"  🔧 Çözüm: docker run -d -p 6333:6333 qdrant/qdrant")
        return
    
    # Create or recreate collection
    print(f"\n📦 Koleksiyon oluşturuluyor: {COLLECTION_NAME}")
    try:
        qdrant.delete_collection(COLLECTION_NAME)
        print("  ℹ️ Eski koleksiyon silindi")
    except:
        pass
    
    qdrant.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=768, distance=Distance.COSINE)
    )
    print("  ✅ Yeni koleksiyon oluşturuldu")
    
    # Add documents
    print(f"\n📝 Dökümanlar ekleniyor ({len(SAMPLE_DOCUMENTS)} adet)...")
    
    async with httpx.AsyncClient() as client:
        points = []
        for i, doc in enumerate(SAMPLE_DOCUMENTS, 1):
            print(f"  [{i}/{len(SAMPLE_DOCUMENTS)}] {doc['title'][:50]}...")
            
            # Get embedding
            full_text = f"Başlık: {doc['title']}\n\n{doc['content']}"
            embedding = await get_embedding(full_text, client)
            
            if not embedding:
                print(f"    ⚠️ Embedding alınamadı, atlanıyor")
                continue
            
            points.append(PointStruct(
                id=str(uuid.uuid4()),
                vector=embedding,
                payload={
                    "title": doc["title"],
                    "content": doc["content"],
                    "category": doc.get("category", "genel"),
                    "crop": doc.get("crop", "genel"),
                }
            ))
    
    # Upsert all points
    if points:
        qdrant.upsert(collection_name=COLLECTION_NAME, points=points)
        print(f"\n✅ {len(points)} döküman başarıyla eklendi!")
    
    # Verify
    collection_info = qdrant.get_collection(COLLECTION_NAME)
    print(f"\n📊 Koleksiyon durumu:")
    print(f"  - Toplam vektör: {collection_info.points_count}")
    print(f"  - Vektör boyutu: {collection_info.config.params.vectors.size}")
    
    # Test search
    print("\n🔍 Test araması yapılıyor...")
    test_query = "domates yaprak hastalığı tedavisi"
    async with httpx.AsyncClient() as client:
        test_embedding = await get_embedding(test_query, client)
        if test_embedding:
            results = qdrant.query_points(
                collection_name=COLLECTION_NAME,
                query=test_embedding,
                limit=3
            )
            print(f"  Sorgu: '{test_query}'")
            print(f"  Sonuçlar:")
            for r in results.points:
                print(f"    - {r.payload['title'][:50]}... (skor: {r.score:.3f})")
    
    print("\n" + "=" * 50)
    print("🎉 Bilgi tabanı hazır!")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(seed_knowledge_base())
