# Topraksız Tarım AI Agent: Frontend Mühendisliği Mülakat Hazırlığı

Bu belge, geliştirdiğiniz projedeki ön yüz (Frontend) mimarisini merkeze alarak, tamamen bir **Frontend/UI Engineer** veya **React Developer** mülakatında karşınıza çıkabilecek zorlayıcı teknik soruları ve bu soruların kod blokları ile desteklenmiş "Mühendisçe" savunmalarını içermektedir.

---

## 1. State Yönetimi ve Performans (Re-render Optimizasyonu)

> [!CAUTION]
> React mülakatlarında en çok sorulan konuların başında gereksiz re-render'lar ve `useMemo` / `useCallback` kullanımı gelir. 

### Soru 1.1: "Puanlama (Score) Algoritması Neden useMemo İçerisinde?"
**Sıkıştırma Noktası:** "Kod tabanında `Home.tsx` dosyasını incelerken `healthScore` adında bir değişken tanımladığını gördüm. Bunu doğrudan bir fonksiyon ile hesaplamak varken neden `useMemo` içerisine hapsettin? `useMemo` kullanımının bu projeye kattığı gerçek değer nedir?"

**Mühendisçe Savunma:**
*   `healthScore` bitkinin sağlığını YOLO modelinin bulgularına ve Confidence (Güven) değerlerinin ortalamasına göre karmaşık bir matematikle (Array reduce işlemleriyle) hesaplıyor.
*   Frontend'de aynı ekranda bir IoT Sensör Paneli form data'sı bulunuyor (`ph`, `ec`, `temperature`). Kullanıcı sensör değerlerini değiştirdikçe `setSensorData` tetiklenerek ana component'i sürekli (re-render) ediyor.
*   **Optimizasyon:** Eğer `healthScore`'u `useMemo`'ya almasaydım, kullanıcı `pH` değerini her değiştirdiğinde React, bitki sağlığı matematiksel hesaplamasını (reduce döngülerini) boş yere tekrar tekrar çalıştıracaktı. `useMemo`'ya `[result]` bağımlılığını (dependency) vererek bu hesaplamayı sadece yeni bir analiz raporu geldiğinde çalışacak şekilde izole ettim.

### Soru 1.2: Dropzone ve Render Döngüleri
**Sıkıştırma Noktası:** "Görsel yüklemek için `react-dropzone` kullanmışsın ve `onDrop` event'ini `useCallback` içine almışsın. Bunun sebebi nedir?"

**Mühendisçe Savunma:**
*   `useDropzone` hook'una dışarıdan bir fonksiyon geçirirken, React'ın her render'da bu fonksiyonu (object reference'ı) baştan yaratmasını istemedim. 
*   `onDrop` tetiklendiğinde `setSelectedImage`, `setPreviewUrl`, `setResult(null)` gibi 4 farklı state'i aynı anda tetikliyorum. React 18 ile birlikte gelen **Automatic Batching** sayesinde bu 4 state güncellenmesi ayrı ayrı 4 render oluşturmak yerine, React tarafından paketlenip (batch) tek bir render döngüsünde hallediliyor. 

---

## 2. Ağır Veri Yükü (Large File) ve Asenkron İletişim

> [!TIP]
> Modern web uygulamalarında File manipulation (Dosya manipülasyonu) ve tarayıcı performansıyla ilgili detaylara değinmek "Senior" bir bakış açısı sunar.

### Soru 2.1: "Görsel Önizlemesi (Preview URL) Nasıl Çalışıyor?"
**Sıkıştırma Noktası:** "Kullanıcı 8 MB boyutunda bir yaprak fotoğrafı yüklediğinde, bunu Backend'e gönderip oradan bir URL almak yerine Frontend'de (Tarayıcıda) nasıl anında gösteriyorsun? Tarayıcıyı şişiren bellek sızıntılarına (Memory Leak) karşı bir önlemin var mı?"

**Mühendisçe Savunma:**
*   Kullanıcı resmi seçtiği an, resmi Backend API'a yüklemeden önce `URL.createObjectURL(file)` Web API'sini kullanarak tarayıcının geçici hafızasında bir local pointer yaratıyorum.
*   Bu yaklaşım, kullanıcıya Zero-Latency (sıfır gecikme) ile seçtiği resmi göstermemi sağlıyor. API'a sadece formData üzerinden asıl asenkron post işlemini arka planda tetikliyorum.
*   *Özeleştiri/İyileştirme Planı:* İlerleyen versiyonlarda `useEffect` callback'i içerisinde component unmount edildiğinde veya yeni bir resim yüklendiğinde eski referansı öldürmek adına `URL.revokeObjectURL()` fonksiyonunu da ekleyerek tarayıcı taraflı Memory Leak'in (bellek sızıntısı) tamamen önüne geçeceğim.

---

## 3. Dinamik Arayüz (UI/UX) ve Veri Görselleştirme

### Soru 3.1: "Yüzdelik Skoru (Score Ring) SVG ile Nasıl Kendiniz Çizdiniz?"
**Sıkıştırma Noktası:** "Frontend'de analiz sonucunu gösteren yuvarlak bir puan çemberi (`<ScoreRing />`) var. Bootstrap veya Ant Design gibi hazır bir dairesel bar grafiği kullanmak yerine neden saf SVG'yi tercih ettin? Matematiksel altyapısı nasıl çalışıyor?"

**Mühendisçe Savunma:**
*   **Bağımlılık (Dependency) Azaltma:** Projeye sadece basit bir yuvarlak çember çizmek için ağır bir chart kütüphanesi yüklemek bundle (paket) boyutunu gereksiz şişirir. Bu nedenle saf SVG ve matematik ile sıfırdan komponent yazdım.
*   **İşleyiş:** `Home.tsx` içerisindeki `<ScoreRing />` componentinde `radius = 52` alıp çember çevresini (`circumference = 2 * Math.PI * radius`) hesaplattım. Gelen skora (0-100) göre bir oran bulup SVG `strokeDashoffset` özelliğine dinamik olarak uygulayarak o çemberin içinin ne kadar dolacağını (Animasyonlu bir şekilde) CSS desteğiyle hallettim. Ayrıca skora göre renkleri (Yüksek skor=Yeşil, Orta=Sarı, Kritik=Kırmızı) dinamik Tailwind utility (`cn()` / `clsx`) yapısıyla kontrol ettim.

### Soru 3.2: Saf TailwindCSS vs Şartlı CSS Yükü
**Sıkıştırma Noktası:** "YOLO'dan gelen sonuçların tehlike seviyesine göre (High, Medium, Low) TailwindCSS sınıflarını dinamik değiştiriyorsun. Tailwind'in `class` isimlerini string içinden okurken React tarafında herhangi bir conflict (çakışma) veya tarz silinmesi sorunuyla (`CSS Purge`) karşılaştın mı?"

**Mühendisçe Savunma:**
*   Evet, React'ta değişkenlere dayalı CSS (örneğin: `bg-${color}-500`) verince Tailwind purge algoritması build esnasında bu sınıfları silebiliyor. 
*   Ancak benim kodumda `clsx` ve `tailwind-merge` birleşimi olan ortak standart `cn()` utility fonksiyonunu oluşturdum (Örnek: `Home.tsx` içerisindeki `PriorityBadge` modülü). `badge-danger` ve `badge-warning` gibi class string'lerini koşullara (Conditional Rendering) bağlı tam adlarıyla yazarak Tailwind compiler'ın sınıfları algılamasını sağladım.

---

## 4. WebGL ve 3D Componentler (@react-three/fiber)

### Soru 4.1: "React DOM ile WebGL Canvas Entegrasyonu"
**Sıkıştırma Noktası:** "Arka plan için kullandığın `ThreeBackground.tsx` dosyasında bir `<Canvas />` var. Normal React DOM ile Three.js'in WebGL işleme döngüsü aynı Event Loop'u mu kullanıyor? Performans sorunu yaratmaz mı?"

**Mühendisçe Savunma:**
*   Fiber (React 18'in render engine'i) ve `react-three-fiber` mükemmel bir uyumla çalışır, ancak Canvas kendi context'ini alır. 
*   Ben DOM ve WebGL bağlamını ayırdım. 5000 parçacığın pozisyonunu (buffer geometry dizisi) ilk render dışına kaydırıp RAM'de statik bıraktım. Parçacık dönüş hızını (rotation) normal DOM ref'lerinden güncellemek yerine WebGL'nin native animasyon döngüsünü sağlayan `useFrame` hook'u içine taşıdım. Böylece React DOM `setState` veya event loop'unu meşgul etmeden saniyede 60 FPS (Frame per second) animasyon sağladım. Z-index `-10` vererek tüm tıkla-sürükle eventlerinden CSS pointer-events aracılığıyla muaf tuttum.

---

## 5. İleri Seviye (Senior) Ek Sorulara Yanıt Stratejisi

Eğer *(Olası Mülakatçı)* sistemi kırmak üzerine ek sorular sorarsa bu taktikleri uygula:

*   **Soru: "Yapay zeka metni çok uzun dönüp Markdown (`<ReactMarkdown />`) içindeki tablo bozuk gözükürse ne olur?"**
    *   *Senin Yanıtın:* "Bunun için Tailwind'in `@tailwindcss/typography` plugin'ini (kodunuzda kurulu) kullandım. `ReactMarkdown` renderına `prose` (veya custom `analysis-prose`) sınıfını vererek, AI'ın ürettiği markdown ne kadar karmaşık olursa olsun, padding, margin, table-layout gibi stil özelliklerini genel CSS kapsamına hapsettim (scoped css) ve sayfa layout'unun bozulmasını kilitledim."
*   **Soru: "Projeyi Production'da CloudFlare veya Vercel'e atarken, build sürecinde hangi optimizasyonları yaptın?"**
    *   *Senin Yanıtın:* "Vite kullanıyorum çünkü Webpack tabanlı (CRA) sistemlerden çok daha hızlı cold-start ve build (esbuild kaynaklı) veriyor. package.json tarafında `tsc && vite build` yapım mevcut, sadece tipler doğrulanırsa build aldırıyorum. Three.js gibi kocaman paketleri ise *Code Splitting* (Dynamic Import - React.lazy) ile ana app bundle'dan koparıp, kullanıcı sayfaya girdiğinde parça parça çekilecek şekilde optimize edebilirim (Gelecek Vizyonu)."
