// -----------------------------------------------------------
// 1. Firebase 라이브러리 가져오기
// -----------------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, increment, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { initialData } from './data.js'; 

// -----------------------------------------------------------
// 2. Firebase 설정 
// -----------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBT1Mwd1rRLGn0JisQ4E_0h_-f_g3FKiII",
  authDomain: "korea-japan-trip.firebaseapp.com",
  projectId: "korea-japan-trip",
  storageBucket: "korea-japan-trip.firebasestorage.app",
  messagingSenderId: "850077166396",
  appId: "1:850077166396:web:7cbb5cad174b9a1db00c39",
  measurementId: "G-2MEV1JR83X"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// -----------------------------------------------------------
// ⭐ [중요] 다국어 설정 (가장 먼저 정의해야 함!)
// -----------------------------------------------------------
let currentLang = 'ko'; // 기본 언어

const translations = {
    ko: {
        placeholder: "어디로 떠나볼까요?",
        all: "전체", food: "🍜 맛집", view: "🏰 관광", culture: "💛 문화",
        exchangeTitle: "🇯🇵 JPY 100 ➔ 🇰🇷 KRW",
        starbucks: "스벅 라떼가 한국보다",
        cheap: "원 싸요!", expensive: "원 비싸요.",
        weatherDesc: "지도에서 핀을 눌러 날씨를 확인하세요!",
        cityNeed: "지역 선택 필요",
        w_hot: "너무 더워요! 실내 추천 🥵",
        w_warm: "반팔 입기 좋은 날씨! 👕",
        w_good: "여행하기 최고의 날씨! ✨",
        w_cool: "쌀쌀해요! 겉옷 챙기세요 🧥",
        w_cold: "너무 추워요! 패딩 필수 🧣",
        popup_weather: "날씨 확인",
        popup_like: "좋아요"
    },
    ja: {
        placeholder: "どこへ行きますか？",
        all: "すべて", food: "🍜 グルメ", view: "🏰 観光", culture: "💛 文化",
        exchangeTitle: "🇰🇷 KRW 1000 ➔ 🇯🇵 JPY",
        starbucks: "スタバのラテが日本より",
        cheap: "円 安い！", expensive: "円 高い。",
        weatherDesc: "ピンをクリックして天気を確認！",
        cityNeed: "地域を選択",
        w_hot: "暑すぎます！室内がおすすめ 🥵",
        w_warm: "半袖でいい天気！ 👕",
        w_good: "旅行に最高の天気！ ✨",
        w_cool: "肌寒いです！上着が必要 🧥",
        w_cold: "寒いです！ダウン必須 🧣",
        popup_weather: "天気予報",
        popup_like: "いいね"
    }
};


// -----------------------------------------------------------
// 3. 지도 및 기본 설정
// -----------------------------------------------------------
var map = L.map('map', { zoomControl: false }).setView([36.5, 133], 5);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);
L.control.zoom({ position: 'bottomright' }).addTo(map);

var markerCluster = L.markerClusterGroup({
    maxClusterRadius: 30,      
    disableClusteringAtZoom: 11 
});
map.addLayer(markerCluster);


// -----------------------------------------------------------
// 4. 기능 함수들 (환율, 날씨)
// -----------------------------------------------------------
async function fetchExchangeRate() {
    const diffEl = document.querySelector('.exchange-diff');
    const descEl = document.querySelector('.exchange-desc');
    const rateEl = document.getElementById('rate-text');
    
    // ⭐ 이제 translations가 위에 있어서 에러 안 남!
    const t = translations[currentLang]; 

    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/JPY');
        const data = await response.json();
        const rate = data.rates.KRW; 

        if (currentLang === 'ko') {
            const result = (rate * 100).toFixed(0);
            rateEl.innerText = `₩ ${result}`;
            
            const jpLatteInKrw = 490 * rate; 
            const diff = (5000 - jpLatteInKrw).toFixed(0);
            
            descEl.innerText = `"${t.starbucks} ${diff}${t.cheap}"`;
            diffEl.innerText = "▼ 슈퍼 엔저 찬스!";
            diffEl.style.color = "#2ecc71";

        } else {
            const result = (1000 / rate).toFixed(0);
            rateEl.innerText = `¥ ${result}`;

            const krLatteInJpy = 5000 / rate;
            const diff = (krLatteInJpy - 490).toFixed(0);

            descEl.innerText = `"${t.starbucks} ${diff}${t.expensive}"`; 
            diffEl.innerText = "▲ 韓国の方が高い"; 
            diffEl.style.color = "#e74c3c"; 
        }

    } catch (error) {
        console.error(error);
        rateEl.innerText = "Error";
    }
}
fetchExchangeRate(); // 실행

// 날씨 함수
window.fetchWeather = async function(lat, lng, cityName) {
    try {
        const t = translations[currentLang]; 

        document.getElementById('city-name').innerText = cityName;
        document.getElementById('current-temp').innerText = "..";
        
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
        const data = await response.json();
        const temp = data.current_weather.temperature;
        
        document.getElementById('current-temp').innerText = `${temp}°C`;
        
        const descEl = document.querySelector('.weather-desc');
        const iconEl = document.querySelector('.weather-header i');

        if (temp >= 30) {
            descEl.innerText = t.w_hot;
            iconEl.className = "fas fa-sun";
        } else if (temp >= 23) {
            descEl.innerText = t.w_warm;
            iconEl.className = "fas fa-cloud-sun";
        } else if (temp >= 15) {
            descEl.innerText = t.w_good;
            iconEl.className = "fas fa-smile";
        } else if (temp >= 5) {
            descEl.innerText = t.w_cool;
            iconEl.className = "fas fa-wind";
        } else {
            descEl.innerText = t.w_cold;
            iconEl.className = "fas fa-snowflake";
        }

    } catch (error) { console.error(error); }
}


// -----------------------------------------------------------
// 5. Firebase 데이터 연동 & 좋아요 & 필터
// -----------------------------------------------------------
var locations = [];

const placesCol = collection(db, "places");

onSnapshot(placesCol, (snapshot) => {
    locations = []; 
    snapshot.forEach((doc) => {
        locations.push({ id: doc.id, ...doc.data() });
    });
    
    const activeBtn = document.querySelector('.filter-btn.active');
    const currentCategory = activeBtn ? activeBtn.dataset.category : 'all';
    filterCategory(currentCategory);
});

window.toggleLike = async function(docId) {
    const docRef = doc(db, "places", docId);
    try {
        await updateDoc(docRef, { likes: increment(1) });
        console.log("좋아요 성공!");
    } catch (e) {
        console.error("좋아요 실패:", e);
    }
}

window.filterCategory = function(category) {
    markerCluster.clearLayers();
    const t = translations[currentLang]; 

    const filtered = category === 'all' 
        ? locations 
        : locations.filter(loc => loc.category === category);

    filtered.forEach(loc => {
        var marker = L.marker([loc.lat, loc.lng]);
        
        // ⭐ [핵심] 현재 언어에 따라 이름 고르기
        // 일본어 모드면 name_ja를 보여주고, 없으면 그냥 한국어 name 보여줌
        let displayName = loc.name;
        if (currentLang === 'ja' && loc.name_ja) {
            displayName = loc.name_ja;
        }

        const popupContent = `
            <div class="popup-content">
                <span class="popup-title">${displayName}</span>
                <button class="weather-btn" onclick="fetchWeather(${loc.lat}, ${loc.lng}, '${displayName}')">
                    <i class="fas fa-cloud-sun"></i> ${t.popup_weather}
                </button>
                <br>
                <div class="like-box" onclick="toggleLike('${loc.id}')">
                    <i class="fas fa-heart"></i>
                    <span class="like-count">${loc.likes || 0}</span>
                    <span style="font-size:12px; margin-left:3px;">${t.popup_like}</span>
                </div>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        marker.on('click', () => { map.flyTo([loc.lat, loc.lng], 14, { duration: 1.5 }); });
        markerCluster.addLayer(marker);
    });
    
    updateBtnStyle(category);
}

function updateBtnStyle(category) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });
}

// -----------------------------------------------------------
// 6. 언어 전환 함수
// -----------------------------------------------------------
window.toggleLanguage = function() {
    currentLang = currentLang === 'ko' ? 'ja' : 'ko';
    
    document.getElementById('lang-icon').innerText = currentLang === 'ko' ? "🇰🇷" : "🇯🇵";

    const t = translations[currentLang];
    
    // 텍스트 갈아끼우기
    document.getElementById('search-input').placeholder = t.placeholder;
    document.getElementById('btn-all').innerText = t.all;
    document.getElementById('btn-food').innerText = t.food;
    document.getElementById('btn-view').innerText = t.view;
    document.getElementById('btn-culture').innerText = t.culture;
    document.getElementById('exchange-title').innerText = t.exchangeTitle;
    
    // ⭐ [추가] 여기가 빠져있어서 번역이 안 됐던 겁니다!
    document.getElementById('city-name').innerText = t.cityNeed; 
    
    document.querySelector('.weather-desc').innerText = t.weatherDesc;
    
    // 기능 새로고침
    fetchExchangeRate(); 

    const activeBtn = document.querySelector('.filter-btn.active');
    const currentCategory = activeBtn ? activeBtn.dataset.category : 'all';
    filterCategory(currentCategory);
}

// script.js 파일의 6. 언어 전환 함수 부분 뒤에 추가
// -----------------------------------------------------------
// 7. 검색 기능 (추가)
// -----------------------------------------------------------
document.getElementById('search-input').addEventListener('input', function(e) {
    const searchText = e.target.value.toLowerCase();
    
    // 현재 활성화된 카테고리 필터링 결과를 가져와서 한 번 더 필터링
    const activeCategory = document.querySelector('.filter-btn.active').dataset.category;
    const filteredByCategory = activeCategory === 'all' 
        ? locations 
        : locations.filter(loc => loc.category === activeCategory);
    
    // 검색 텍스트로 필터링
    const filteredBySearch = filteredByCategory.filter(loc => {
        const koName = loc.name.toLowerCase();
        const jaName = loc.name_ja ? loc.name_ja.toLowerCase() : '';
        return koName.includes(searchText) || jaName.includes(searchText);
    });
    
    // 필터링된 결과로 지도 핀을 다시 그립니다.
    redrawMarkers(filteredBySearch);
});

// filterCategory 함수에서 마커를 다시 그리는 로직을 별도 함수로 분리
function redrawMarkers(data) {
    markerCluster.clearLayers();
    const t = translations[currentLang]; 

    data.forEach(loc => {
        var marker = L.marker([loc.lat, loc.lng]);
        
        let displayName = loc.name;
        if (currentLang === 'ja' && loc.name_ja) {
            displayName = loc.name_ja;
        }

        const popupContent = `
            <div class="popup-content">
                <span class="popup-title">${displayName}</span>
                <button class="weather-btn" onclick="fetchWeather(${loc.lat}, ${loc.lng}, '${displayName}')">
                    <i class="fas fa-cloud-sun"></i> ${t.popup_weather}
                </button>
                <br>
                <div class="like-box" onclick="toggleLike('${loc.id}')">
                    <i class="fas fa-heart"></i>
                    <span class="like-count">${loc.likes || 0}</span>
                    <span style="font-size:12px; margin-left:3px;">${t.popup_like}</span>
                </div>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        marker.on('click', () => { map.flyTo([loc.lat, loc.lng], 14, { duration: 1.5 }); });
        markerCluster.addLayer(marker);
    });
}

// filterCategory 함수 변경: 마지막 부분만 수정
window.filterCategory = function(category) {
    // ... (중략) ...
    const filtered = category === 'all' 
        ? locations 
        : locations.filter(loc => loc.category === category);

    // 검색창의 텍스트가 있다면, 검색어 기준으로 한 번 더 필터링
    const searchText = document.getElementById('search-input').value.toLowerCase();
    const finalFiltered = searchText 
        ? filtered.filter(loc => {
            const koName = loc.name.toLowerCase();
            const jaName = loc.name_ja ? loc.name_ja.toLowerCase() : '';
            return koName.includes(searchText) || jaName.includes(searchText);
        })
        : filtered;

    redrawMarkers(finalFiltered); // 새로 분리한 함수 호출
    updateBtnStyle(category);
}

// onSnapshot 함수 변경: 초기 로드 시에도 redrawMarkers 사용
onSnapshot(placesCol, (snapshot) => {
    locations = []; 
    snapshot.forEach((doc) => {
        locations.push({ id: doc.id, ...doc.data() });
    });
    
    const activeBtn = document.querySelector('.filter-btn.active');
    const currentCategory = activeBtn ? activeBtn.dataset.category : 'all';
    // filterCategory를 호출하면 내부에서 redrawMarkers를 호출합니다.
    filterCategory(currentCategory); 
});

// ==========================================
// 🚨 [데이터 업로드 도구]
// ==========================================
async function uploadData() {
    const placesCol = collection(db, "places");
    if (!confirm("정말로 데이터를 업로드 하시겠습니까? (중복 주의)")) return;
    console.log(`총 ${initialData.length}개의 데이터를 업로드합니다...`);
    for (const item of initialData) {
        try { await addDoc(placesCol, item); console.log(`[성공] ${item.name}`); } 
        catch (e) { console.error(`[실패] ${item.name}`, e); }
    }
    alert("업로드 끝!");
}
//uploadData();