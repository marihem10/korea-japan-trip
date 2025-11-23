// -----------------------------------------------------------
// 1. Firebase 라이브러리 가져오기
// -----------------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, increment, onSnapshot, addDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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
// ⭐ 다국어 설정
// -----------------------------------------------------------
let currentLang = 'ko'; // 기본 언어

const translations = {
    ko: {
        placeholder: "어디로 떠나볼까요?",
        all: "전체", food: "🍜 맛집", view: "🏰 관광", culture: "🏛️ 유적", station: "🚇 교통",

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
        popup_like: "좋아요",
        review_write: "리뷰 쓰기",
        review_read: "리뷰 보기",
        modal_write_title: "📝 리뷰 쓰기",
        modal_read_title: "📋 여행자 생생 리뷰",
        placeholder_review: "이곳의 후기를 남겨주세요! (예: 야경이 정말 예뻐요)",
        btn_submit: "등록하기",
        no_reviews: "아직 작성된 리뷰가 없어요.<br>첫 번째 리뷰를 남겨보세요! ✍️",
        msg_loading: "로딩중... ⌛",
        score_unit: "점",
        alert_input_empty: "내용을 입력해주세요!",
        alert_success: "리뷰가 등록되었습니다!",
        alert_already_reviewed: "이미 이 장소에 리뷰를 작성하셨습니다!",
        placeholder_nickname: "닉네임"
    },
    ja: {
        placeholder: "どこへ行きますか？",
        all: "すべて", food: "🍜 グルメ", view: "🏰 観光", culture: "🏛️ 遺跡", station: "🚇 交通",

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
        popup_like: "いいね",
        review_write: "レビューを書く",
        review_read: "レビューを見る",
        modal_write_title: "📝 レビューを書く",
        modal_read_title: "📋 旅行者のリアルな口コミ",
        placeholder_review: "ここに感想を残してください！ (例: 夜景がとても綺麗です)",
        btn_submit: "登録する",
        no_reviews: "まだレビューがありません。<br>最初のレビューを投稿しましょう！ ✍️",
        msg_loading: "読み込み中... ⌛",
        score_unit: "点",
        alert_input_empty: "内容を入力してください！",
        alert_success: "レビューが登録されました！",
        alert_already_reviewed: "すでにこの場所のレビューを作成しました！",
        placeholder_nickname: "ニックネーム"
    }
};


// -----------------------------------------------------------
// 3. 지도 및 기본 설정
// -----------------------------------------------------------
// 화면 너비가 600px보다 작으면 모바일로 간주
var isMobile = window.innerWidth < 600;

// 모바일이면 줌 7 (멀리), PC면 줌 8 (가깝게)
var initialZoom = isMobile ? 7 : 7;

// 중심 좌표: 부산과 후쿠오카의 중간 지점
var map = L.map('map', { zoomControl: false }).setView([34.4, 129.5], initialZoom);

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);
L.control.zoom({ position: 'bottomright' }).addTo(map);

var markerCluster = L.markerClusterGroup({
    maxClusterRadius: 50,      // 마커를 묶는 최대 반경 (50px)
    disableClusteringAtZoom: 13, // 클러스터링 해제 Zoom Level (13)
    
    // ⭐ [핵심 수정] 클러스터 아이콘 생성 함수 정의
    iconCreateFunction: function(cluster) {
        var count = cluster.getChildCount(); // 클러스터 내부 마커 개수
        var className = 'marker-cluster'; // 라이브러리 기본 클래스
        var colorClass = ''; // 색상을 결정하는 클래스

        // 1. 크기(외형)를 결정하는 기본 클래스 적용 (Leaflet.markercluster의 기본 디자인 유지)
        if (count < 10) {
            className += ' marker-cluster-small';
        } else if (count < 100) {
            className += ' marker-cluster-medium';
        } else {
            className += ' marker-cluster-large';
        }

        // 2. ⭐ 요청하신 개수에 따른 색상 클래스 적용
        if (count <= 10) {
            colorClass = ' mc-green'; // mc-green 클래스 추가
        } else if (count <= 30) {
            colorClass = ' mc-yellow'; // mc-yellow 클래스 추가
        } else if (count <= 50) {
            colorClass = ' mc-orange'; // mc-orange 클래스 추가
        } else {
            colorClass = ' mc-red'; // mc-red 클래스 추가
        }
        
        // 최종 클래스 조합: Leaflet 기본 디자인 + 커스텀 색상
        className += colorClass;

        return L.divIcon({ 
            html: '<div><span>' + count + '</span></div>', 
            className: className, 
            iconSize: new L.Point(40, 40) // Leaflet 기본값 유지
        });
    }
});
map.addLayer(markerCluster);

// ⭐ 현재 열려있는 팝업(장소)의 ID를 기억하는 변수
let selectedPlaceId = null; 


// -----------------------------------------------------------
// 4. 기능 함수들 (환율, 날씨)
// -----------------------------------------------------------
async function fetchExchangeRate() {
    const diffEl = document.querySelector('.exchange-diff');
    const descEl = document.querySelector('.exchange-desc');
    const rateEl = document.getElementById('rate-text');
    
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
fetchExchangeRate(); 

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
// 5. Firebase 데이터 연동 & 로직 통합
// -----------------------------------------------------------
var locations = [];

const placesCol = collection(db, "places");

onSnapshot(placesCol, (snapshot) => {
    try {
        locations = []; 
        snapshot.forEach((doc) => {
            locations.push({ id: doc.id, ...doc.data() });
        });
        
        // 데이터 로드 후 현재 필터 상태에 맞춰 갱신
        const activeBtn = document.querySelector('.filter-btn.active');
        const currentCategory = activeBtn ? activeBtn.dataset.category : 'all';
        filterCategory(currentCategory);
        
        // 데이터 로드 완료 후 탭 이벤트를 다시 연결합니다.
        // (이 로직은 보통 HTML 로드 후 한 번만 실행하는 것이 좋지만, onSnapshot 내부에서도 작동합니다.)
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                filterCategory(button.dataset.category);
            });
        });
        
    } catch (e) {
        // 이 에러가 보인다면 보안 규칙이나 연결 설정을 다시 확인해야 합니다.
        console.error("Firebase 실시간 데이터 로드 중 오류 발생:", e);
        // alert("Firebase 데이터 로드 중 오류가 발생했습니다. (보안 규칙 문제일 가능성 높음)");
    }
});

window.toggleLike = async function(docId) {
    // 1. 클릭하자마자 '현재 보고 있는 장소'로 설정
    selectedPlaceId = docId; 

    const docRef = doc(db, "places", docId);
    
    // 2. 내 컴퓨터 목록 가져오기
    let myLikes = JSON.parse(localStorage.getItem('myLikedPlaces')) || [];
    const isLiked = myLikes.includes(docId);

    if (isLiked) {
        // 이미 눌렀으니 취소 (목록에서 제거)
        myLikes = myLikes.filter(id => id !== docId);
    } else {
        // 안 눌렀으니 추가 (목록에 추가)
        myLikes.push(docId);
    }
    // 저장!
    localStorage.setItem('myLikedPlaces', JSON.stringify(myLikes));

    // 3. 이제 서버에 숫자 변경 요청 (비동기)
    try {
        if (isLiked) {
            await updateDoc(docRef, { likes: increment(-1) }); // -1
        } else {
            await updateDoc(docRef, { likes: increment(1) });  // +1
        }
    } catch (e) {
        console.error("좋아요 실패:", e);
        alert("오류가 발생했습니다.");
    }
}

// -----------------------------------------------------------

// -----------------------------------------------------------
// 4.1. 카테고리별 커스텀 마커 아이콘 설정
// -----------------------------------------------------------
const categoryIcons = {
    food: { icon: 'fa-utensils', color: '#e67e22' },   // 주황색
    view: { icon: 'fa-mountain', color: '#3498db' },   // 파란색
    culture: { icon: 'fa-archway', color: '#9b59b6' }, // 보라색
    station: { icon: 'fa-subway', color: '#2c3e50' }   // 진한 회색
};

/**
 * 카테고리에 맞는 Font Awesome 아이콘을 가진 커스텀 마커 아이콘을 생성합니다.
 */
function getCustomIcon(category) {
    const iconData = categoryIcons[category] || { icon: 'fa-map-pin', color: '#7f8c8d' };
    
    // custom-marker 클래스는 CSS에서 정의된 핀 모양 디자인을 적용합니다.
    const htmlContent = `<div class="custom-marker" style="background-color: ${iconData.color};">
                             <i class="fas ${iconData.icon}"></i>
                         </div>`;

    return L.divIcon({
        className: 'custom-marker-wrapper', // CSS에서 Leaflet 기본 스타일을 덮어쓰기 위한 래퍼
        html: htmlContent,
        iconSize: [30, 42],     // 마커의 크기 (CSS와 일치)
        iconAnchor: [15, 42]    // 핀의 뾰족한 끝이 정확한 좌표를 가리키도록 설정
    });
}

// [수정] 공통 함수 (리뷰 버튼 중앙 정렬 완벽 적용)
function updateMapMarkers(targetLocations) {
    markerCluster.clearLayers(); 
    const t = translations[currentLang]; 
    const myLikes = JSON.parse(localStorage.getItem('myLikedPlaces')) || [];

    // 현재 필터링된 목록에서 "station" 카테고리가 포함되어 있는지 확인
    const isStationCategory = targetLocations.some(loc => loc.category === 'station'); 

    // 카테고리별 제목 스타일 설정
    const categoryStyles = {
        food:    { color: '#d35400', icon: 'fa-utensils' },
        view:    { color: '#2980b9', icon: 'fa-mountain' },
        culture: { color: '#8e44ad', icon: 'fa-archway' },
        station: { color: '#2c3e50', icon: 'fa-train' },
        airport: { color: '#2c3e50', icon: 'fa-plane' },
        shopping:{ color: '#f39c12', icon: 'fa-shopping-bag' },
        default: { color: '#333333', icon: 'fa-map-marker-alt' }
    };

    targetLocations.forEach(loc => {
        const customIcon = getCustomIcon(loc.category);
        var marker = L.marker([loc.lat, loc.lng], {
            icon: customIcon 
        });
        
        let displayName = loc.name;
        if (currentLang === 'ja' && loc.name_ja) {
            displayName = loc.name_ja;
        }

        const isLiked = myLikes.includes(loc.id);
        const heartColor = isLiked ? "#ff4757" : "#ccc"; 
        const heartIcon = isLiked ? "fas" : "far"; 

        const myStyle = categoryStyles[loc.category] || categoryStyles.default;

        const popupContent = `
            <div class="popup-content" style="min-width: 220px; display: flex; flex-direction: column; gap: 8px;">
                
                <span class="popup-title" style="font-size: 15px; font-weight: bold; color: ${myStyle.color}; margin-bottom: 5px;">
                    <i class="fas ${myStyle.icon}" style="margin-right: 5px;"></i>${displayName}
                </span>
                
                <button class="weather-btn" style="width: 100%; display: flex; justify-content: center; align-items: center; margin: 0;" 
                        onclick="fetchWeather(${loc.lat}, ${loc.lng}, '${displayName}')">
                    <i class="fas fa-cloud-sun"></i> ${t.popup_weather}
                </button>
                
                <div style="display:flex; gap:6px; width: 100%;">
                    <button class="weather-btn" style="background: linear-gradient(135deg, #FF9966 0%, #FF5E62 100%); flex:1; display: flex; justify-content: center; align-items: center; margin:0; padding: 8px 0;" 
                            onclick="openReviewModal('${loc.id}', '${displayName}')">
                        <i class="fas fa-pen"></i> ${t.review_write}
                    </button>
                    <button class="weather-btn" style="background: linear-gradient(135deg, #56CCF2 0%, #2F80ED 100%); flex:1; display: flex; justify-content: center; align-items: center; margin:0; padding: 8px 0;" 
                            onclick="openReadReviewModal('${loc.id}')">
                        <i class="fas fa-book"></i> ${t.review_read}
                    </button>
                </div>
                
                <button class="weather-btn" style="width: 100%; background: white; border: 1px solid #ddd; color: #333; display: flex; justify-content: center; align-items: center; margin:0;" 
                        onclick="toggleLike('${loc.id}')">
                    <i class="${heartIcon} fa-heart" style="color: ${heartColor}; margin-right: 5px;"></i>
                    <span style="font-weight:bold; color:${heartColor};">${loc.likes || 0}</span>
                    <span style="font-size:11px; color:#888; margin-left:5px;">${t.popup_like}</span>
                </button>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        
        marker.on('click', () => { 
            selectedPlaceId = loc.id; 
        });
        
        marker.on('popupclose', () => {
            setTimeout(() => { if (selectedPlaceId === loc.id) {} }, 100);
        });

        markerCluster.addLayer(marker);

        if (selectedPlaceId === loc.id) {
            setTimeout(() => { marker.openPopup(); }, 100);
        }
    });
}

// [카테고리 필터]
window.filterCategory = function(category) {
    let filtered;
    
    // ⭐ [핵심 수정] 'all' 탭을 눌렀을 때 'station' 카테고리만 제외하고 필터링합니다.
    if (category === 'all') {
        filtered = locations; // 모든 장소 다 보여줌
    } else {
        // 'food', 'view', 'culture', 'station' 등 특정 탭을 누른 경우
        filtered = locations.filter(loc => loc.category === category);
    }
    
    updateMapMarkers(filtered); // 공통 함수 호출
    updateBtnStyle(category);
}

function updateBtnStyle(category) {
    const buttons = document.querySelectorAll('.filter-btn');
    
    buttons.forEach(btn => {
        // 1. 일단 모든 버튼에서 'active'(검은색) 뺏기
        btn.classList.remove('active');
        
        // 2. 내가 누른 버튼(카테고리가 일치하는 것)만 'active' 주기
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });
}

// -----------------------------------------------------------
// [검색 기능] 검색어 필터링 + 엔터키 이동
// -----------------------------------------------------------
const searchInput = document.getElementById('search-input');

// 1. 입력할 때마다 핀 필터링 (기존 기능)
searchInput.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase(); 
    
    const searched = locations.filter(loc => {
        const koName = loc.name.toLowerCase();
        const jaName = loc.name_ja ? loc.name_ja.toLowerCase() : "";
        return koName.includes(searchTerm) || jaName.includes(searchTerm);
    });

    updateMapMarkers(searched);
});

// 2. [추가됨] 엔터(Enter) 키 누르면 그 위치로 이동!
searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const searchTerm = e.target.value.toLowerCase(); 

        // 다시 한 번 검색 결과 찾기
        const searched = locations.filter(loc => {
            const koName = loc.name.toLowerCase();
            const jaName = loc.name_ja ? loc.name_ja.toLowerCase() : "";
            return koName.includes(searchTerm) || jaName.includes(searchTerm);
        });

        if (searched.length === 0) {
            return; // 결과 없으면 가만히 있음
        }

        // A. 결과가 딱 1개면 -> 거기로 '슝~' 날아가기
        if (searched.length === 1) {
            const target = searched[0];
            map.flyTo([target.lat, target.lng], 15, { duration: 1.5 });
        } 
        // B. 결과가 여러 개면 -> 다 보이게 지도 줌 조절
        else {
            const bounds = searched.map(loc => [loc.lat, loc.lng]);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
    }
});

// -----------------------------------------------------------
// 6. 언어 전환 함수
// -----------------------------------------------------------
window.toggleLanguage = function() {
    currentLang = currentLang === 'ko' ? 'ja' : 'ko';
    
    if (currentLang === 'ja') {
        document.body.classList.add('is-jp');
    } else {
        document.body.classList.remove('is-jp');
    }

    // 디자인 스위치
    if (currentLang === 'ko') {
        document.getElementById('lang-ko').classList.add('active');
        document.getElementById('lang-ja').classList.remove('active');
    } else {
        document.getElementById('lang-ko').classList.remove('active');
        document.getElementById('lang-ja').classList.add('active');
    }
    
    const t = translations[currentLang];
    
    // 텍스트 변경
    document.getElementById('search-input').placeholder = t.placeholder;
    document.getElementById('btn-all').innerText = t.all;
    document.getElementById('btn-food').innerText = t.food;
    document.getElementById('btn-view').innerText = t.view;
    document.getElementById('btn-culture').innerText = t.culture;
    document.getElementById('btn-station').innerText = t.station;

    document.getElementById('exchange-title').innerText = t.exchangeTitle;
    document.getElementById('city-name').innerText = t.cityNeed; 
    document.querySelector('.weather-desc').innerText = t.weatherDesc;
    document.getElementById('modal-write-title').innerText = t.modal_write_title;
    document.getElementById('modal-read-title').innerText = t.modal_read_title;
    document.getElementById('review-text').placeholder = t.placeholder_review;
    document.getElementById('btn-submit').innerText = t.btn_submit;
    
    const currentScore = document.getElementById('review-rating').value;
    document.getElementById('rating-value').innerText = currentScore + t.score_unit;
    document.getElementById('review-nickname').placeholder = t.placeholder_nickname;
    
    fetchExchangeRate(); 

    const activeBtn = document.querySelector('.filter-btn.active');
    const currentCategory = activeBtn ? activeBtn.dataset.category : 'all';
    filterCategory(currentCategory);
}

// -----------------------------------------------------------
// 7. 리뷰 모달 기능
// -----------------------------------------------------------
let currentReviewPlaceId = null;

window.openReviewModal = function(id, name) {
    currentReviewPlaceId = id;
    document.getElementById('modal-place-name').innerText = `Target: ${name}`;
    document.getElementById('review-text').value = ''; 
    document.getElementById('review-nickname').value = ''; // ⭐ [추가] 닉네임 초기화
    
    setRating(0); 
    document.getElementById('review-modal').style.display = 'flex';
}

window.closeReviewModal = function() {
    document.getElementById('review-modal').style.display = 'none';
}

window.setRating = function(score) {
    document.getElementById('review-rating').value = score;

    const t = translations[currentLang]; 
    document.getElementById('rating-value').innerText = score + t.score_unit;
    
    const stars = document.querySelectorAll('.star-rating span');
    stars.forEach((star, index) => {
        if (index < score) star.style.opacity = '1';
        else star.style.opacity = '0.3';
    });
}

// 리뷰 저장 함수
window.submitReview = async function() {
    const nickname = document.getElementById('review-nickname').value; // ⭐ 닉네임 가져오기
    const text = document.getElementById('review-text').value;
    const rating = document.getElementById('review-rating').value;
    const t = translations[currentLang];

    // ⭐ [추가] 닉네임 입력 확인
    if (!nickname) {
        alert(currentLang === 'ko' ? "닉네임을 입력해주세요!" : "ニックネームを入力してください！");
        return;
    }

    if (!text) { alert(t.alert_input_empty); return; }

    let myReviews = JSON.parse(localStorage.getItem('myReviewedPlaces')) || [];
    if (myReviews.includes(currentReviewPlaceId)) {
        alert(t.alert_already_reviewed); return; 
    }

    try {
        const userCountry = currentLang === 'ko' ? 'KR' : 'JP';

        await addDoc(collection(db, "reviews"), {
            placeId: currentReviewPlaceId,
            nickname: nickname, // ⭐ 닉네임 저장!
            text: text,
            rating: parseInt(rating),
            createdAt: new Date().toISOString(),
            country: userCountry
        });

        myReviews.push(currentReviewPlaceId);
        localStorage.setItem('myReviewedPlaces', JSON.stringify(myReviews));

        alert(t.alert_success);
        closeReviewModal();
    } catch (e) {
        console.error("리뷰 저장 실패:", e);
        alert("Error.");
    }
}

window.openReadReviewModal = async function(placeId) {
    const container = document.getElementById('review-list-container');
    const modal = document.getElementById('read-review-modal');
    const t = translations[currentLang]; 
    
    modal.style.display = 'flex';
    container.innerHTML = `<div style="text-align:center; padding:20px; color:#999;">${t.msg_loading}</div>`;

    try {
        const q = query(
            collection(db, "reviews"), 
            where("placeId", "==", placeId),
            orderBy("createdAt", "desc") 
        );
        
        const querySnapshot = await getDocs(q);
        let html = "";
        
        if (querySnapshot.empty) {
            html = `<div style="text-align:center; padding:40px; color:#999; line-height:1.6;">${t.no_reviews}</div>`;
        } else {
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const stars = "⭐".repeat(data.rating);
                
                // 날짜 변환
                let dateStr = data.createdAt;
                const dateObj = new Date(data.createdAt);
                if (!isNaN(dateObj.getTime())) { 
                    if (currentLang === 'ko') dateStr = dateObj.toLocaleString('ko-KR');
                    else dateStr = dateObj.toLocaleString('ja-JP');
                }

                // 국적 뱃지
                let userBadge = "";
                if (data.country === 'KR') {
                    userBadge = `<span style="color:#0047A0; font-weight:bold; font-size:12px; margin-right:5px; background:#eef6ff; padding:2px 6px; border-radius:4px;">🇰🇷</span>`;
                } else if (data.country === 'JP') {
                    userBadge = `<span style="color:#BC002D; font-weight:bold; font-size:12px; margin-right:5px; background:#fff0f0; padding:2px 6px; border-radius:4px;">🇯🇵</span>`;
                } else {
                    userBadge = `<span style="color:#555; font-weight:bold; font-size:12px; margin-right:5px; background:#eee; padding:2px 6px; border-radius:4px;">🌏</span>`;
                }

                // ⭐ [추가] 닉네임 없으면 '익명' 처리
                const nicknameDisplay = data.nickname ? `<span style="font-weight:bold; font-size:13px; color:#333; margin-right:5px;">${data.nickname}</span>` : `<span style="color:#999; font-size:12px; margin-right:5px;">(익명)</span>`;

                const safeText = data.text.replace(/"/g, '&quot;').replace(/'/g, "&#39;");
                const btnText = currentLang === 'ko' ? "🤖 번역" : "🤖 翻訳";

                html += `
                    <div class="review-item">
                        <div class="review-header" style="align-items: center; margin-bottom: 8px;">
                            <div style="display: flex; align-items: center;">
                                ${userBadge}
                                ${nicknameDisplay} <span class="review-stars" style="font-size:12px;">${stars}</span>
                            </div>
                            <span style="color:#aaa; font-size:11px;">${dateStr}</span> 
                        </div>
                        <div class="review-text" id="review-text-${doc.id}" style="margin-bottom: 8px;">${data.text}</div>
                        
                        <div id="trans-result-${doc.id}" style="font-size:13px; color:#4facfe; margin-bottom:5px; display:none; background:#f0f8ff; padding:8px; border-radius:8px;"></div>

                        <button onclick="translateReview('${doc.id}', '${safeText}')" 
                        style="font-size:11px; background:white; border:1px solid #ddd; border-radius:12px; padding:4px 10px; cursor:pointer; color:#555; display:flex; align-items:center; gap:4px;">
                            ${btnText}
                        </button>
                    </div>
                `;
            });
        }
        container.innerHTML = html;
    } catch (e) {
        console.error(e);
        if(e.message.includes("index")) alert("Firebase 콘솔에서 색인(Index)을 생성해야 합니다.");
        container.innerHTML = "Error.";
    }
}

window.closeReadReviewModal = function() {
    document.getElementById('read-review-modal').style.display = 'none';
}

// ==========================================
// MyMemory 무료 번역 API 함수
// ==========================================
window.translateReview = async function(docId, text) {
    const resultBox = document.getElementById(`trans-result-${docId}`);
    
    if (resultBox.style.display === 'block') {
        resultBox.style.display = 'none';
        return;
    }

    resultBox.style.display = 'block';
    resultBox.innerText = "Translating... ⌛";

    try {
        // 목표 언어(Target) = 현재 사이트 언어(currentLang)
        // 출발 언어(Source) = 자동 감지(Autodetect)
        
        // 예: 한국어(KR) 모드일 때 -> 결과물은 무조건 '한국어'여야 함.
        // 예: 일본어(JP) 모드일 때 -> 결과물은 무조건 '일본어'여야 함.
        
        const targetLang = currentLang; 

        // API 요청: langpair=Autodetect|도착언어
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=Autodetect|${targetLang}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        const translatedText = data.responseData.translatedText;

        // 1. API가 "야, 원문이랑 도착 언어가 똑같잖아!" 라고 에러를 보낸 경우
        if (translatedText.includes("PLEASE SELECT TWO DISTINCT LANGUAGES") || 
            translatedText.includes("IS INVALID")) {
            
            resultBox.innerText = "ℹ️ " + (currentLang === 'ko' ? "이미 한국어입니다." : "すでに日本語です。");
            
        } 
        // 2. 번역된 결과가 원문이랑 토씨 하나 안 틀리고 똑같은 경우 (혹시 몰라서 확인)
        else if (translatedText.trim() === text.trim()) {
            
            resultBox.innerText = "ℹ️ " + (currentLang === 'ko' ? "이미 한국어입니다." : "すでに日本語です。");
            
        } 
        // 3. 정상 번역
        else {
            resultBox.innerText = "✅ " + translatedText;
        }

    } catch (e) {
        console.error("번역 에러:", e);
        resultBox.innerText = "Network Error";
    }
}


// -----------------------------------------------------------
// 8. 데이터 업로드 (필요할 때만 주석 풀기)
// -----------------------------------------------------------
async function uploadData() {
    const placesCol = collection(db, "places");
    if (!confirm("데이터를 업로드하시겠습니까?")) return;
    console.log(`총 ${initialData.length}개 업로드 시작...`);
    for (const item of initialData) {
        try { await addDoc(placesCol, item); } catch (e) { console.error(e); }
    }
    alert("업로드 완료!");
}
//uploadData();