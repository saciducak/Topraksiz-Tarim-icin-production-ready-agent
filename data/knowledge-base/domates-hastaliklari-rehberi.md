# Topraksız Tarımda Domates Hastalıkları ve Tedavi Yöntemleri

## 1. Erken Yanıklık (Alternaria solani)

Erken yanıklık, domates bitkilerinde en yaygın fungal hastalıklardan biridir. Etmeni Alternaria solani mantarıdır. Hastalık özellikle alt yapraklardan başlar ve yukarı doğru ilerler.

### Belirtiler
- Alt yapraklarda halka şeklinde ("hedef tahtası" görünümünde) kahverengi-siyah lekeler
- Lekeler genellikle 5-10 mm çapında olup eş merkezli halkalar içerir
- Şiddetli enfeksiyonlarda yaprak sararıp düşer
- Meyvelerde sap çukuru çevresinde koyu, çökmüş lekeler
- Gövde ve dallarda da benzer lekeler oluşabilir

### Risk Faktörleri
- Yüksek nem (%80 üzeri) ve ılık sıcaklıklar (24-29°C)
- Yaprakların uzun süre ıslak kalması
- Azot eksikliği veya dengesiz gübreleme
- Topraksız sistemlerde yetersiz havalandırma
- Monokültür uygulaması

### Tedavi Planı
**Kimyasal Mücadele:**
- Mancozeb (ethylene bisdithiocarbamate): 200 g/100L su, 7-10 gün arayla
- Klorotalonil (Daconil): 150 g/100L su, koruyucu olarak
- Azoksistrobin (Amistar): 50 ml/100L su, sistemik etki
- Uygulama sabah erken saatlerde yapılmalıdır

**Biyolojik Mücadele:**
- Trichoderma harzianum preparatları: 250 g/100L su
- Bacillus subtilis bazlı biyofungisitler
- Neem yağı: 3-5 ml/L su (koruyucu)

**Kültürel Önlemler:**
- Enfekte yaprakları hemen uzaklaştırın ve imha edin
- Damla sulama kullanın, yaprakları ıslatmayın
- Bitki aralığını artırarak hava sirkülasyonunu iyileştirin
- Serada nemhavalandırma kontrol sistemleri kullanın

## 2. Geç Yanıklık (Phytophthora infestans)

Geç yanıklık, tarihteki en yıkıcı bitki hastalıklarından biridir. İrlanda Patates Kıtlığı'na (1845-1852) neden olan bu hastalık, domates bitkilerini de şiddetle etkiler.

### Belirtiler
- Yapraklarda geniş, suya batmış görünümde yeşil-kahverengi lekeler
- Lekelerin alt yüzeyinde beyaz küf tabakası (sporangium)
- Nemli koşullarda hızla yayılır, tüm bitkiyi 3-5 günde öldürebilir
- Meyvelerde kahverengi, sert çürük alanlar
- Gövdede koyu kahve-siyah lekeler

### Tedavi Planı
**Acil Müdahale (İlk 24 Saat):**
1. Enfekte bitkileri derhal izole edin
2. Metalaksil-M + Mancozeb (Ridomil Gold MZ): 250 g/100L su
3. Seranın nemini %60'ın altına düşürün
4. Havalandırmayı maksimuma çıkarın

**Uzun Vadeli Kontrol:**
- Dirençli çeşitler tercih edin
- Sporun yayılmasını engellemek için sulama stratejisini değiştirin
- Sera girişlerinde dezenfeksiyon havuzları kullanın

## 3. Kloroz ve Beslenme Bozuklukları

Topraksız tarımda beslenme bozuklukları, toprağın tampon etkisinin olmadığı durumlarda daha hızlı ortaya çıkar.

### Demir (Fe) Eksikliği Klorozu
- **Belirtiler:** Genç yapraklarda damarlar arası sararma, damarlar yeşil kalır
- **pH İlişkisi:** pH 7.0 üzerinde demir alımı dramatik olarak azalır
- **Tedavi:** Fe-EDDHA şelatı 20-40 ppm, besin çözeltisi pH'ını 5.5-6.5 aralığına ayarlayın
- **Yapraktan Uygulama:** %0.5 demir sülfat çözeltisi

### Azot (N) Eksikliği
- **Belirtiler:** Alt yapraklardan başlayarak genel sararma, gelişme geriliği
- **Tedavi:** 150-200 ppm N (kalsiyum nitrat formunda)
- **Dikkat:** Fazla azot çiçek dökümüne ve mantar hastalıklarına davetiye çıkarır

### Magnezyum (Mg) Eksikliği
- **Belirtiler:** Yaşlı yapraklarda damarlar arası sararma (demir eksikliğinden farklı olarak yaşlı yapraklar etkilenir)
- **Tedavi:** Magnezyum sülfat (Epsom tuzu) 2-4 g/L besin çözeltisi
- **Yapraktan:** %2 MgSO4 çözeltisi, 10 gün arayla

## 4. IoT Sensör Entegrasyonu ve Optimal Değerler

Topraksız tarımda sensör verileri, erken teşhis için kritik öneme sahiptir.

### Optimal Parametreler (Domates)
| Parametre | Optimal Aralık | Kritik Alt | Kritik Üst |
|-----------|---------------|------------|------------|
| pH        | 5.5 - 6.5    | 4.5        | 7.5        |
| EC (mS/cm)| 2.0 - 3.5   | 1.0        | 5.0        |
| Sıcaklık  | 20 - 28°C    | 10°C       | 35°C       |
| Nem (%)   | 60 - 75      | 40         | 90         |

### Sensör-Hastalık Korelasyonları
- **Yüksek pH (>7.0) + Yaprak Sararması → Demir Eksikliği Klorozu**
- **Yüksek Nem (>85%) + Kahverengi Lekeler → Geç Yanıklık Riski**
- **Yüksek EC (>4.0) + Yaprak Kenarı Yanığı → Tuz Stresi**
- **Düşük Sıcaklık (<15°C) + Mor Yaprak → Fosfor Alım Bozukluğu**
