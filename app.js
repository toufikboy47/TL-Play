// YouTube Clone Application
// API Key from user
const API_KEY = 'AIzaSyDcOjQQp2wNvzDc4hiuIKajD1ld1YuK38I';
const BASE_URL = 'https://www.googleapis.com/youtube/v3';
const EMBED_URL = 'https://www.youtube.com/embed';

// DOM Elements
const videoGrid = document.getElementById('videoGrid');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
const mainContent = document.getElementById('mainContent');
const categoriesBar = document.getElementById('categoriesBar');
const videoModal = document.getElementById('videoModal');
const closeModal = document.getElementById('closeModal');
const videoPlayer = document.getElementById('videoPlayer');
const videoInfo = document.getElementById('videoInfo');
const modalVideoInfo = document.querySelector('.modal-video-info');
const relatedVideosEl = document.querySelector('.related-videos');
const loading = document.getElementById('loading');
const noResults = document.getElementById('noResults');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const loadingOverlay = document.getElementById('loadingOverlay');
const mobileSearchBar = document.getElementById('mobileSearchBar');
const mobileSearchInput = document.getElementById('mobileSearchInput');
const mobileSearchBtn = document.getElementById('mobileSearchBtn');
const mobileBackBtn = document.getElementById('mobileBackBtn');
const mobileBottomNav = document.getElementById('mobileBottomNav');

// State
let currentSearchQuery = '';
let currentCategory = 'all';
let isLiked = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTrendingVideos();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Search
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            searchVideos(query);
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                searchVideos(query);
            }
        }
    });

    // Menu toggle
    menuBtn.addEventListener('click', () => {
        openSidebar();
    });

    // Sidebar close button
    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', closeSidebar);
    }

    // Sidebar overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Close modal
    closeModal.addEventListener('click', closeVideoModal);

    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeVideoModal();
        }
    });

    // Close modal on backdrop click
    videoModal.addEventListener('click', (e) => {
        if (e.target === videoModal) {
            closeVideoModal();
        }
    });

    // Category chips
    const categoryChips = document.querySelectorAll('.category-chip');
    categoryChips.forEach(chip => {
        chip.addEventListener('click', () => {
            categoryChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentCategory = chip.dataset.category;
            
            if (currentSearchQuery) {
                searchVideos(currentSearchQuery, currentCategory);
            } else {
                if (currentCategory === 'all') {
                    loadTrendingVideos();
                } else {
                    searchVideos('', currentCategory);
                }
            }
        });
    });

    // Sidebar category items
    const sidebarCategoryItems = document.querySelectorAll('.category-item');
    sidebarCategoryItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const category = item.dataset.category;
            searchVideos('', category);
            sidebarCategoryItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            closeSidebar();
        });
    });

    // Mobile search
    if (mobileSearchBtn) {
        mobileSearchBtn.addEventListener('click', () => {
            const query = mobileSearchInput.value.trim();
            if (query) {
                searchVideos(query);
                closeMobileSearch();
            }
        });
    }

    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = mobileSearchInput.value.trim();
                if (query) {
                    searchVideos(query);
                    closeMobileSearch();
                }
            }
        });
    }

    if (mobileBackBtn) {
        mobileBackBtn.addEventListener('click', closeMobileSearch);
    }

    // Handle window resize
    window.addEventListener('resize', handleResize);

    // Initial responsive check
    handleResize();
}

// Open Sidebar
function openSidebar() {
    sidebar.classList.add('mobile-open');
    sidebar.classList.remove('collapsed');
    if (sidebarOverlay) {
        sidebarOverlay.classList.add('active');
    }
    document.body.style.overflow = 'hidden';
}

// Close Sidebar
function closeSidebar() {
    sidebar.classList.remove('mobile-open');
    sidebar.classList.add('collapsed');
    if (sidebarOverlay) {
        sidebarOverlay.classList.remove('active');
    }
    document.body.style.overflow = '';
}

// Open Mobile Search
function openMobileSearch() {
    if (mobileSearchBar) {
        mobileSearchBar.classList.add('active');
        mobileSearchInput.focus();
    }
}

// Close Mobile Search
function closeMobileSearch() {
    if (mobileSearchBar) {
        mobileSearchBar.classList.remove('active');
        mobileSearchInput.value = '';
    }
}

// Handle Window Resize
function handleResize() {
    const width = window.innerWidth;
    
    // Show/hide mobile elements based on screen size
    if (width <= 768) {
        // Mobile view
        if (mobileBottomNav) {
            mobileBottomNav.style.display = 'flex';
        }
        mainContent.style.marginBottom = '56px';
    } else {
        // Desktop view
        if (mobileBottomNav) {
            mobileBottomNav.style.display = 'none';
        }
        mainContent.style.marginBottom = '0';
    }

    // Adjust sidebar for tablet
    if (width > 768 && width <= 1024) {
        sidebar.classList.remove('mobile-open');
        sidebar.classList.add('collapsed');
    }

    // Show header center on larger mobile screens
    if (width > 600) {
        // Can show search in header
    }
}

// API Functions
async function fetchFromAPI(endpoint, params = {}) {
    const url = new URL(`${BASE_URL}/${endpoint}`);
    url.searchParams.set('key', API_KEY);
    Object.keys(params).forEach(key => {
        url.searchParams.set(key, params[key]);
    });

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        showToast('Error fetching data from YouTube API');
        return null;
    }
}

// Load Trending Videos
async function loadTrendingVideos() {
    showLoading();
    currentSearchQuery = '';
    
    const data = await fetchFromAPI('videos', {
        part: 'snippet,statistics,contentDetails',
        chart: 'mostPopular',
        maxResults: 20,
        regionCode: 'US'
    });

    hideLoading();
    
    if (data && data.items) {
        displayVideos(data.items);
    } else {
        showNoResults();
    }
}

// Search Videos
async function searchVideos(query, category = '') {
    showLoading();
    currentSearchQuery = query;
    
    let params = {
        part: 'snippet',
        maxResults: 20,
        q: query,
        type: 'video'
    };

    if (category && category !== 'all') {
        params.relevanceLanguage = 'en';
        params.videoCategoryId = getCategoryId(category);
    }

    const data = await fetchFromAPI('search', params);

    hideLoading();
    
    if (data && data.items) {
        const videoIds = data.items.map(item => item.id.videoId).join(',');
        const videoDetails = await fetchFromAPI('videos', {
            part: 'snippet,statistics,contentDetails',
            id: videoIds
        });

        if (videoDetails && videoDetails.items) {
            displayVideos(videoDetails.items);
        }
    } else {
        showNoResults();
    }
}

// Get Category ID
function getCategoryId(category) {
    const categoryIds = {
        music: '10',
        sports: '17',
        gaming: '20',
        movies: '1',
        news: '25',
        live: '15',
        education: '27',
        technology: '28',
        comedy: '23',
        entertainment: '24'
    };
    return categoryIds[category] || '';
}

// Display Videos
function displayVideos(videos) {
    videoGrid.innerHTML = '';
    noResults.style.display = 'none';
    
    videos.forEach((video, index) => {
        const videoCard = createVideoCard(video, index);
        videoGrid.appendChild(videoCard);
    });
}

// Create Video Card
function createVideoCard(video, index) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.style.animationDelay = `${index * 0.05}s`;
    
    const snippet = video.snippet;
    const statistics = video.statistics || {};
    const contentDetails = video.contentDetails || {};
    
    const thumbnail = getThumbnailUrl(snippet.thumbnails);
    const channelAvatar = snippet.thumbnails?.default?.url || '';
    const videoId = video.id;
    const title = snippet.title;
    const channelName = snippet.channelTitle;
    const viewCount = formatNumber(statistics.viewCount || 0);
    const publishedAt = formatDate(snippet.publishedAt);
    const duration = contentDetails.duration || '';
    
    card.innerHTML = `
        <div class="thumbnail-container">
            <img class="thumbnail" src="${thumbnail}" alt="${title}" loading="lazy">
            <div class="thumbnail-overlay">
                <i class="fas fa-play-circle play-icon"></i>
            </div>
            <span class="duration">${formatDuration(duration)}</span>
        </div>
        <div class="video-info">
            <img class="channel-avatar" src="${channelAvatar}" alt="${channelName}" onerror="this.style.display='none'">
            <div class="video-details">
                <h3 class="video-title">${title}</h3>
                <a class="channel-name" href="#" onclick="event.preventDefault(); showChannelInfo('${snippet.channelId}')">${channelName}</a>
                <div class="video-meta">
                    <span>${viewCount} views</span>
                    <span>•</span>
                    <span>${publishedAt}</span>
                </div>
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => {
        openVideoModal(videoId);
    });
    
    return card;
}

// Open Video Modal
async function openVideoModal(videoId) {
    videoPlayer.src = `${EMBED_URL}/${videoId}?autoplay=1&rel=0`;
    videoModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Adjust for mobile
    const width = window.innerWidth;
    if (width <= 768) {
        videoModal.style.top = '0';
        videoModal.style.height = '100vh';
    } else {
        videoModal.style.top = '';
        videoModal.style.height = '';
    }
    
    // Fetch video details
    await loadVideoDetails(videoId);
    
    // Fetch related videos
    await loadRelatedVideos(videoId);
    
    // Fetch comments
    await loadComments(videoId);
}

// Close Video Modal
function closeVideoModal() {
    videoModal.classList.remove('active');
    videoPlayer.src = '';
    document.body.style.overflow = '';
    isLiked = false;
}

// Load Video Details
async function loadVideoDetails(videoId) {
    const data = await fetchFromAPI('videos', {
        part: 'snippet,statistics,contentDetails,replies',
        id: videoId
    });

    if (data && data.items && data.items.length > 0) {
        const video = data.items[0];
        const snippet = video.snippet;
        const statistics = video.statistics || {};
        
        videoInfo.innerHTML = `
            <div class="video-info-container">
                <div class="modal-video-info">
                    <h1 class="modal-video-title">${snippet.title}</h1>
                    <div class="video-stats">
                        <span>${formatNumber(statistics.viewCount || 0)} views</span>
                        <span>•</span>
                        <span>${formatDate(snippet.publishedAt)}</span>
                    </div>
                    <div class="video-actions">
                        <button class="action-btn" onclick="likeVideo()">
                            <i class="fas fa-thumbs-up"></i>
                            <span>${formatNumber(statistics.likeCount || 0)}</span>
                        </button>
                        <button class="action-btn" onclick="dislikeVideo()">
                            <i class="fas fa-thumbs-down"></i>
                        </button>
                        <button class="action-btn">
                            <i class="fas fa-share"></i>
                            <span>Share</span>
                        </button>
                        <button class="action-btn">
                            <i class="fas fa-download"></i>
                            <span>Download</span>
                        </button>
                        <button class="action-btn">
                            <i class="fas fa-bookmark"></i>
                            <span>Save</span>
                        </button>
                        <button class="action-btn">
                            <i class="fas fa-ellipsis-h"></i>
                        </button>
                    </div>
                    <div class="channel-info">
                        <img class="channel-avatar-large" src="${snippet.thumbnails?.medium?.url || ''}" alt="${snippet.channelTitle}" onerror="this.style.display='none'">
                        <div class="channel-details">
                            <h3 class="channel-title">${snippet.channelTitle}</h3>
                            <span class="channel-subscribers">1.2M subscribers</span>
                        </div>
                        <button class="subscribe-btn" onclick="toggleSubscribe(this)">Subscribe</button>
                    </div>
                    <div class="video-description">
                        <p class="description-text">${snippet.description || 'No description available.'}</p>
                        <div class="description-meta">
                            <span>${snippet.tags ? snippet.tags.length + ' tags' : ''}</span>
                        </div>
                    </div>
                    <div class="comments-section">
                        <div class="comments-header">
                            <span class="comments-count">${formatNumber(statistics.commentCount || 0)} comments</span>
                            <button class="comment-sort-btn">
                                <i class="fas fa-sort"></i>
                                Sort by
                            </button>
                        </div>
                        <div class="comment-input-container">
                            <img class="comment-avatar" src="" alt="Your avatar" onerror="this.style.display='none'">
                            <input type="text" class="comment-input" placeholder="Add a comment...">
                            <button class="comment-btn">Comment</button>
                        </div>
                        <div class="comments-list" id="commentsList">
                        </div>
                    </div>
                </div>
                <div class="related-videos" id="relatedVideos">
                </div>
            </div>
        `;
    }
}

// Load Related Videos
async function loadRelatedVideos(videoId) {
    const data = await fetchFromAPI('search', {
        part: 'snippet',
        relatedToVideoId: videoId,
        type: 'video',
        maxResults: 10
    });

    const relatedContainer = document.getElementById('relatedVideos');
    
    if (relatedContainer && data && data.items && data.items.length > 0) {
        const videoIds = data.items.map(item => item.id.videoId).join(',');
        const videoDetails = await fetchFromAPI('videos', {
            part: 'snippet,statistics,contentDetails',
            id: videoIds
        });

        if (videoDetails && videoDetails.items) {
            relatedContainer.innerHTML = '<h3>Up next</h3>';
            
            videoDetails.items.forEach(video => {
                const card = createRelatedVideoCard(video);
                relatedContainer.appendChild(card);
            });
        }
    }
}

// Create Related Video Card
function createRelatedVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'related-video-card';
    
    const snippet = video.snippet;
    const statistics = video.statistics || {};
    const thumbnail = getThumbnailUrl(snippet.thumbnails);
    const videoId = video.id;
    
    card.innerHTML = `
        <img class="related-thumbnail" src="${thumbnail}" alt="${snippet.title}" loading="lazy">
        <div class="related-info">
            <h4 class="related-title">${snippet.title}</h4>
            <p class="related-channel">${snippet.channelTitle}</p>
            <p class="related-meta">
                ${formatNumber(statistics.viewCount || 0)} views
            </p>
        </div>
    `;
    
    card.addEventListener('click', () => {
        openVideoModal(videoId);
    });
    
    return card;
}

// Load Comments
async function loadComments(videoId) {
    const data = await fetchFromAPI('commentThreads', {
        part: 'snippet,replies',
        videoId: videoId,
        maxResults: 10
    });

    const commentsList = document.getElementById('commentsList');
    
    if (data && data.items && data.items.length > 0) {
        commentsList.innerHTML = '';
        
        data.items.forEach(comment => {
            const card = createCommentCard(comment);
            commentsList.appendChild(card);
        });
    } else {
        commentsList.innerHTML = '<p style="color: var(--text-secondary);">No comments available.</p>';
    }
}

// Create Comment Card
function createCommentCard(comment) {
    const card = document.createElement('div');
    card.className = 'comment';
    
    const snippet = comment.snippet.topLevelComment.snippet;
    const authorName = snippet.authorDisplayName;
    const authorAvatar = snippet.authorProfileImageUrl || '';
    const commentText = snippet.textDisplay;
    const publishedAt = formatDate(snippet.publishedAt);
    const likeCount = formatNumber(snippet.likeCount || 0);
    
    card.innerHTML = `
        <img class="comment-avatar" src="${authorAvatar}" alt="${authorName}" onerror="this.style.display='none'">
        <div class="comment-content">
            <div class="comment-author">${authorName} • ${publishedAt}</div>
            <p class="comment-text">${commentText}</p>
            <div class="comment-actions">
                <span class="comment-action">
                    <i class="fas fa-thumbs-up"></i>
                    ${likeCount}
                </span>
                <span class="comment-action">
                    <i class="fas fa-thumbs-down"></i>
                </span>
                <span class="comment-action">Reply</span>
            </div>
        </div>
    `;
    
    return card;
}

// Show Channel Info
async function showChannelInfo(channelId) {
    const data = await fetchFromAPI('channels', {
        part: 'snippet,statistics,contentDetails',
        id: channelId
    });

    if (data && data.items && data.items.length > 0) {
        const channel = data.items[0];
        showToast(`Channel: ${channel.snippet.title}`);
    }
}

// Like Video
function likeVideo() {
    isLiked = !isLiked;
    const btn = document.querySelector('.action-btn:first-child');
    if (isLiked) {
        btn.classList.add('liked');
        showToast('Added to liked videos');
    } else {
        btn.classList.remove('liked');
        showToast('Removed from liked videos');
    }
}

// Dislike Video
function dislikeVideo() {
    showToast('Dislike registered');
}

// Toggle Subscribe
function toggleSubscribe(btn) {
    if (btn.classList.contains('subscribed')) {
        btn.classList.remove('subscribed');
        btn.textContent = 'Subscribe';
        showToast('Unsubscribed');
    } else {
        btn.classList.add('subscribed');
        btn.textContent = 'Subscribed';
        showToast('Subscribed!');
    }
}

// Go Home
function goHome() {
    currentSearchQuery = '';
    searchInput.value = '';
    loadTrendingVideos();
    
    // Reset category chips
    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.classList.remove('active');
        if (chip.dataset.category === 'all') {
            chip.classList.add('active');
        }
    });
}

// Utility Functions
function getThumbnailUrl(thumbnails) {
    if (!thumbnails) return 'https://via.placeholder.com/640x360';
    return thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || 'https://via.placeholder.com/640x360';
}

function formatNumber(num) {
    if (!num) return '0';
    num = parseInt(num);
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
        return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return months === 1 ? '1 month ago' : `${months} months ago`;
    } else {
        const years = Math.floor(diffDays / 365);
        return years === 1 ? '1 year ago' : `${years} years ago`;
    }
}

function formatDuration(duration) {
    if (!duration) return '0:00';
    
    // Parse ISO 8601 duration
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';
    
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function showLoading() {
    loading.style.display = 'flex';
    videoGrid.style.display = 'none';
    noResults.style.display = 'none';
}

function hideLoading() {
    loading.style.display = 'none';
    videoGrid.style.display = 'grid';
}

function showNoResults() {
    videoGrid.innerHTML = '';
    noResults.style.display = 'block';
}

function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Export functions for HTML onclick handlers
window.goHome = goHome;
window.showChannelInfo = showChannelInfo;
window.likeVideo = likeVideo;
window.dislikeVideo = dislikeVideo;
window.toggleSubscribe = toggleSubscribe;
window.openMobileSearch = openMobileSearch;
