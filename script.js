// Конфигурация - замените на свои данные
const CONFIG = {
    githubUser: 'ваш_логин_github',
    repoName: 'ваш_репозиторий',
    folderPath: 'OS', // Папка с ISO файлами
    branch: 'main' // Ветка репозитория
};

// DOM элементы
const isoList = document.getElementById('isoList');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const repoLink = document.getElementById('repoLink');
const lastUpdate = document.getElementById('lastUpdate');

// URL для GitHub API
const API_URL = `https://api.github.com/repos/${CONFIG.githubUser}/${CONFIG.repoName}/contents/${CONFIG.folderPath}?ref=${CONFIG.branch}`;

// Массив для хранения ISO файлов
let isoFiles = [];

// Иконки для разных типов ОС
const osIcons = {
    windows: 'fab fa-windows',
    linux: 'fab fa-linux',
    ubuntu: 'fab fa-ubuntu',
    android: 'fab fa-android',
    apple: 'fab fa-apple',
    default: 'fas fa-compact-disc'
};

// Форматирование размера файла
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Байт';
    
    const sizes = ['Байт', 'КБ', 'МБ', 'ГБ', 'ТБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return Math.round(bytes / Math.pow(1024, i) * 10) / 10 + ' ' + sizes[i];
}

// Определение типа ОС по имени файла
function getOSIcon(filename) {
    const lowerName = filename.toLowerCase();
    
    if (lowerName.includes('windows') || lowerName.includes('win')) {
        return osIcons.windows;
    } else if (lowerName.includes('ubuntu')) {
        return osIcons.ubuntu;
    } else if (lowerName.includes('linux')) {
        return osIcons.linux;
    } else if (lowerName.includes('android')) {
        return osIcons.android;
    } else if (lowerName.includes('mac') || lowerName.includes('apple')) {
        return osIcons.apple;
    } else {
        return osIcons.default;
    }
}

// Получение даты из строки
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Загрузка ISO файлов из GitHub
async function loadISOFiles() {
    try {
        loading.style.display = 'flex';
        errorMessage.style.display = 'none';
        
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        
        const files = await response.json();
        
        // Фильтрация ISO файлов
        isoFiles = files.filter(file => 
            file.name.toLowerCase().endsWith('.iso') || 
            file.name.toLowerCase().endsWith('.img')
        ).map(file => ({
            name: file.name,
            size: file.size,
            downloadUrl: file.download_url,
            rawUrl: `https://raw.githubusercontent.com/${CONFIG.githubUser}/${CONFIG.repoName}/${CONFIG.branch}/${CONFIG.folderPath}/${file.name}`,
            gitUrl: file.html_url,
            updated: file.updated_at || file.created_at,
            icon: getOSIcon(file.name)
        }));
        
        // Обновление ссылки на репозиторий
        repoLink.href = `https://github.com/${CONFIG.githubUser}/${CONFIG.repoName}`;
        
        // Обновление времени последнего обновления
        if (isoFiles.length > 0) {
            const latestUpdate = isoFiles.reduce((latest, file) => {
                const fileDate = new Date(file.updated);
                return fileDate > latest ? fileDate : latest;
            }, new Date(0));
            
            lastUpdate.textContent = formatDate(latestUpdate);
        }
        
        // Отображение файлов
        displayISOFiles(isoFiles);
        
    } catch (error) {
        console.error('Ошибка загрузки файлов:', error);
        errorMessage.style.display = 'flex';
        isoList.innerHTML = '';
    } finally {
        loading.style.display = 'none';
    }
}

// Отображение ISO файлов
function displayISOFiles(files) {
    if (files.length === 0) {
        isoList.innerHTML = `
            <div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <i class="fas fa-search" style="font-size: 3rem; color: #ddd; margin-bottom: 20px;"></i>
                <h3 style="color: #7f8c8d;">ISO файлы не найдены</h3>
                <p>Проверьте настройки репозитория или попробуйте изменить поисковый запрос</p>
            </div>
        `;
        return;
    }
    
    isoList.innerHTML = files.map(file => `
        <div class="iso-item">
            <div class="iso-icon">
                <i class="${file.icon}"></i>
            </div>
            <div class="iso-name">${file.name}</div>
            <div class="iso-details">
                <p><i class="fas fa-hdd"></i> Размер: ${formatFileSize(file.size)}</p>
                <p><i class="fas fa-calendar-alt"></i> Обновлено: ${formatDate(file.updated)}</p>
                <p><i class="fas fa-file-alt"></i> Формат: ${file.name.split('.').pop().toUpperCase()}</p>
            </div>
            <a href="${file.downloadUrl}" class="download-btn" download="${file.name}">
                <i class="fas fa-download"></i> Скачать
            </a>
        </div>
    `).join('');
}

// Фильтрация и сортировка файлов
function filterAndSortFiles() {
    const searchTerm = searchInput.value.toLowerCase();
    const sortBy = sortSelect.value;
    
    let filteredFiles = isoFiles;
    
    // Фильтрация
    if (searchTerm) {
        filteredFiles = isoFiles.filter(file => 
            file.name.toLowerCase().includes(searchTerm)
        );
    }
    
    // Сортировка
    filteredFiles.sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'date':
                return new Date(b.updated) - new Date(a.updated);
            case 'date-old':
                return new Date(a.updated) - new Date(b.updated);
            default:
                return 0;
        }
    });
    
    displayISOFiles(filteredFiles);
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    // Загрузка файлов при загрузке страницы
    loadISOFiles();
    
    // Поиск
    searchInput.addEventListener('input', filterAndSortFiles);
    
    // Сортировка
    sortSelect.addEventListener('change', filterAndSortFiles);
    
    // Кнопка перезагрузки
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            loadISOFiles();
        }
    });
});