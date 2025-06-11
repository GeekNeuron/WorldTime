document.addEventListener('DOMContentLoaded', () => {
    const clocksContainer = document.getElementById('clocks-container');
    const searchInput = document.getElementById('search-input');
    const themeSwitcher = document.getElementById('theme-switcher');
    const moreClocksBtn = document.getElementById('more-clocks-btn');
    const body = document.body;

    let map;
    // خواندن لیست علاقه‌مندی‌ها از حافظه مرورگر یا استف.اده از لیست پیش‌فرض
    let favorites = JSON.parse(localStorage.getItem('worldTimeFavorites')) || ['America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney', 'Europe/Paris', 'Europe/Moscow', 'Asia/Dubai', 'America/Los_Angeles'];
    let allClocksData = [];

    // لیست کامل مناطق زمانی با نام فارسی و مختصات
    const timezones = [
        { name: "تهران", name_en: "Tehran", tz: "Asia/Tehran", lat: 35.6892, lng: 51.3890 },
        { name: "نیویورک", name_en: "New York", tz: "America/New_York", lat: 40.7128, lng: -74.0060 },
        { name: "لندن", name_en: "London", tz: "Europe/London", lat: 51.5072, lng: -0.1276 },
        { name: "توکیو", name_en: "Tokyo", tz: "Asia/Tokyo", lat: 35.6762, lng: 139.6503 },
        { name: "پاریس", name_en: "Paris", tz: "Europe/Paris", lat: 48.8566, lng: 2.3522 },
        { name: "سیدنی", name_en: "Sydney", tz: "Australia/Sydney", lat: -33.8688, lng: 151.2093 },
        { name: "مسکو", name_en: "Moscow", tz: "Europe/Moscow", lat: 55.7558, lng: 37.6173 },
        { name: "دبی", name_en: "Dubai", tz: "Asia/Dubai", lat: 25.276987, lng: 55.296249 },
        { name: "لس آنجلس", name_en: "Los Angeles", tz: "America/Los_Angeles", lat: 34.0522, lng: -118.2437 },
        { name: "پکن", name_en: "Beijing", tz: "Asia/Shanghai", lat: 39.9042, lng: 116.4074 },
        { name: "قاهره", name_en: "Cairo", tz: "Africa/Cairo", lat: 30.0444, lng: 31.2357 },
        { name: "استانبول", name_en: "Istanbul", tz: "Europe/Istanbul", lat: 41.0082, lng: 28.9784 },
        { name: "دهلی نو", name_en: "New Delhi", tz: "Asia/Kolkata", lat: 28.6139, lng: 77.2090 },
        { name: "شیکاگو", name_en: "Chicago", tz: "America/Chicago", lat: 41.8781, lng: -87.6298 },
        { name: "سنگاپور", name_en: "Singapore", tz: "Asia/Singapore", lat: 1.3521, lng: 103.8198 },
        { name: "تورنتو", name_en: "Toronto", tz: "America/Toronto", lat: 43.6532, lng: -79.3832 },
        { name: "ریو", name_en: "Rio", tz: "America/Sao_Paulo", lat: -22.9068, lng: -43.1729 }
    ];

    let visibleClocksCount = 6;

    // تابع اصلی برای راه‌اندازی نقشه
    window.initMap = () => {
        map = new google.maps.Map(document.getElementById("map"), {
            center: { lat: 20, lng: 0 },
            zoom: 2,
            disableDefaultUI: true,
            styles: [] // استایل نقشه از طریق CSS مدیریت می‌شود
        });
    };

    const createClockCard = (cityData) => {
    const { name, tz, lat, lng } = cityData;
    const card = document.createElement('div');
    card.className = 'clock-card';
    card.dataset.tz = tz;
    card.dataset.lat = lat;
    card.dataset.lng = lng;

    const isFavorited = favorites.includes(tz);

    // یک div جدید برای نشانگر روز/شب اضافه شده است
    card.innerHTML = `
        <div class="city">${name}</div>
        <div class="time"></div>
        <div class="date"></div>
        <span class="favorite-star ${isFavorited ? 'favorited' : ''}" title="Add to favorites">★</span>
        <div class="day-night-indicator"></div>
    `;
    
    // حرکت نقشه با کلیک روی کارت
    card.addEventListener('click', (e) => {
        if (e.target.classList.contains('favorite-star')) return;
        map.panTo({ lat: parseFloat(lat), lng: parseFloat(lng) });
        map.setZoom(5);
    });
    
    // مدیریت کلیک روی ستاره
    card.querySelector('.favorite-star').addEventListener('click', () => toggleFavorite(tz));
    
    return card;
};

    const updateTimes = () => {
    const now = new Date(); // فقط یک بار آبجکت Date را می‌سازیم برای بهینه‌سازی

    document.querySelectorAll('.clock-card').forEach(card => {
        const timeZone = card.dataset.tz;
        try {
            // نمایش زمان و تاریخ
            const timeString = now.toLocaleTimeString('fa-IR', { timeZone, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const dateString = now.toLocaleDateString('fa-IR', { timeZone, weekday: 'long', day: 'numeric', month: 'long' });

            card.querySelector('.time').textContent = timeString;
            card.querySelector('.date').textContent = dateString;
            
            // --- بخش جدید: منطق تشخیص روز و شب ---
            // استخراج ساعت در فرمت ۲۴ ساعته برای منطقه زمانی مشخص
            const hourString = now.toLocaleTimeString('en-US', { timeZone, hour: '2-digit', hour12: false });
            const currentHour = parseInt(hourString.split(':')[0]); // ساعت را به عدد تبدیل می‌کنیم

            const indicator = card.querySelector('.day-night-indicator');
            
            // اگر ساعت بین ۶ صبح (شامل) و ۶ عصر (غیرشامل) باشد، روز است
            if (currentHour >= 6 && currentHour < 18) {
                indicator.innerHTML = '☀️';
                indicator.title = 'Day';
            } else {
                indicator.innerHTML = '🌙';
                indicator.title = 'Night';
            }
            // --------------------------------------

        } catch (error) {
            card.querySelector('.time').textContent = 'خطا در منطقه زمانی';
        }
    });
};

    const toggleFavorite = (tz) => {
    const index = favorites.indexOf(tz);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.unshift(tz);
    }
    localStorage.setItem('worldTimeFavorites', JSON.stringify(favorites));

    // بازسازی لیست اصلی بر اساس علاقه مندی ها
    allClocksData.sort((a, b) => {
        const aIsFav = favorites.includes(a.tz);
        const bIsFav = favorites.includes(b.tz);
        if (aIsFav && !bIsFav) return -1;
        if (!bIsFav && aIsFav) return 1;
        if (aIsFav && bIsFav) return favorites.indexOf(a.tz) - favorites.indexOf(b.tz);
        return 0;
    });

    // بررسی اینکه آیا جستجویی فعال است یا خیر
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        // اگر جستجو فعال است، لیست فیلتر شده را دوباره رندر کن
        const filteredClocks = allClocksData.filter(city => 
            city.name.toLowerCase().includes(searchTerm) || 
            city.name_en.toLowerCase().includes(searchTerm)
        );
        renderClocks(filteredClocks);
    } else {
        // در غیر این صورت، لیست پیش‌فرض را رندر کن
        renderClocks(allClocksData.slice(0, visibleClocksCount));
    }
};
    
    const renderClocks = (clocksToRender = allClocksData) => {
    // مرتب‌سازی لیست اصلی ساعت‌ها بر اساس لیست علاقه‌مندی‌ها
    allClocksData = [...timezones].sort((a, b) => {
        const aIsFav = favorites.includes(a.tz);
        const bIsFav = favorites.includes(b.tz);
        if (aIsFav && !bIsFav) return -1;
        if (!bIsFav && aIsFav) return 1;
        if (aIsFav && bIsFav) return favorites.indexOf(a.tz) - favorites.indexOf(b.tz);
        return 0;
    });

    // اگر لیست ورودی خالی باشد (یعنی اولین بار اجرا می‌شود)، از لیست کامل استفاده کن
    if(clocksToRender === allClocksData) {
        clocksToRender = allClocksData.slice(0, visibleClocksCount);
    }

    clocksContainer.innerHTML = ''; // پاک کردن ساعت‌های قبلی

    clocksToRender.forEach(cityData => {
        const clockElement = createClockCard(cityData);
        clocksContainer.appendChild(clockElement);
    });

    // دکمه "More Clocks" فقط زمانی نمایش داده شود که جستجویی فعال نباشد
    const isSearching = searchInput.value.length > 0;
    if(visibleClocksCount >= allClocksData.length || isSearching) {
        moreClocksBtn.style.display = 'none';
    } else {
        moreClocksBtn.style.display = 'inline-block';
    }

    updateTimes();
};

    // تغییر تم با کلیک روی هدر
    themeSwitcher.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        body.classList.toggle('light-theme');
    });

    // دکمه "More Clocks"
moreClocksBtn.addEventListener('click', () => {
    visibleClocksCount += 4; // نمایش ۴ ساعت بیشتر
    const clocksToDisplay = allClocksData.slice(0, visibleClocksCount);
    renderClocks(clocksToDisplay);
});
    
    // Event Listener for Search Input
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();

    if (searchTerm === '') {
        visibleClocksCount = 8; // ریست کردن تعداد ساعت‌های قابل مشاهده
        renderClocks(allClocksData.slice(0, visibleClocksCount)); // نمایش لیست اولیه
        return;
    }

    const filteredClocks = allClocksData.filter(city => {
        return city.name.toLowerCase().includes(searchTerm) || 
               city.name_en.toLowerCase().includes(searchTerm);
    });

    renderClocks(filteredClocks); // نمایش نتایج فیلتر شده
});
    
    // راه‌اندازی اولیه
    renderClocks();
    setInterval(updateTimes, 1000); // به‌روزرسانی زمان در هر ثانیه
});
