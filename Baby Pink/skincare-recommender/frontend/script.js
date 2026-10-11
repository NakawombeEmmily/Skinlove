// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
let currentUser = null;
let currentToken = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
        currentToken = savedToken;
        currentUser = JSON.parse(savedUser);
        showMainApp();
    } else {
        showPage('auth');
    }

    // Setup range input listeners
    document.getElementById('oiliness')?.addEventListener('input', (e) => {
        document.getElementById('oilValue').textContent = e.target.value;
    });

    document.getElementById('moisture')?.addEventListener('input', (e) => {
        document.getElementById('moistureValue').textContent = e.target.value;
    });

    document.getElementById('sensitivity')?.addEventListener('input', (e) => {
        document.getElementById('sensitivityValue').textContent = e.target.value;
    });

    // Image input handler
    document.getElementById('imageInput')?.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            document.getElementById('analyzeImageBtn').style.display = 'block';
        }
    });

    loadProducts();
    loadStores();
});

// Show main app
function showMainApp() {
    document.getElementById('authModal').style.display = 'none';
    showPage('home');
    if (currentUser.isAdmin) {
        document.getElementById('adminLink').style.display = 'block';
        loadAdminStats();
    }
}

// Authentication
async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const email = form.elements[0].value;
    const password = form.elements[1].value;

    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }

    try {
        console.log('Logging in with email:', email);
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password }),
            mode: 'cors',
            credentials: 'omit'
        });

        console.log('Login response status:', response.status);
        const data = await response.json();
        console.log('Login response data:', data);

        if (response.ok) {
            currentToken = data.token;
            currentUser = data.user;
            localStorage.setItem('token', currentToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
            showMainApp();
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    const username = form.elements[0].value;
    const email = form.elements[1].value;
    const password = form.elements[2].value;

    if (!username || !email || !password) {
        alert('Please fill in all fields');
        return;
    }

    try {
        console.log('Registering with:', { username, email, password: '***' });
        
        const payload = { username, email, password };
        console.log('Payload:', JSON.stringify(payload));
        
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload),
            mode: 'cors',
            credentials: 'omit'
        });

        console.log('Register response status:', response.status);
        console.log('Register response headers:', response.headers);
        
        const data = await response.json();
        console.log('Register response data:', data);

        if (response.ok) {
            alert('Registration successful! Please login.');
            form.reset();
            switchAuthTab('login');
        } else {
            alert(data.error || data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        console.error('Error stack:', error.stack);
        alert('Registration failed: ' + error.message);
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentToken = null;
    currentUser = null;
    location.reload();
}

// Page Navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    const page = document.getElementById(pageId);
    if (page) {
        page.classList.add('active');
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
}

function switchAuthTab(tabName) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authTabs = document.querySelectorAll('.auth-tab-btn');

    authTabs.forEach(tab => tab.classList.remove('active'));

    if (tabName === 'login') {
        loginForm.style.display = 'flex';
        registerForm.style.display = 'none';
        authTabs[0].classList.add('active');
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'flex';
        authTabs[1].classList.add('active');
    }
}

// Quiz
async function submitQuiz(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const answers = Object.fromEntries(formData);

    try {
        const response = await fetch(`${API_BASE_URL}/skinanalysis/quiz`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ answers })
        });

        const data = await response.json();
        
        // Track usage
        await fetch(`${API_BASE_URL}/usage/track`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ feature: 'skinQuiz' })
        });

        displayQuizResults(data.skinType, data.recommendations);
    } catch (error) {
        console.error('Quiz error:', error);
        alert('Error analyzing skin type');
    }
}

function displayQuizResults(skinType, recommendations) {
    document.getElementById('skinTypeResult').textContent = skinType.toUpperCase();
    const productsDiv = document.getElementById('recommendedProducts');
    
    productsDiv.innerHTML = '<h4 style="margin-top: 20px; margin-bottom: 20px;">Recommended Products for Your Skin:</h4>';
    
    recommendations.forEach(product => {
        const productCard = createProductCard(product);
        productsDiv.appendChild(productCard);
    });

    document.getElementById('quizResults').style.display = 'block';
    currentUser.skinType = skinType;
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <div class="product-image">💄</div>
        <div class="product-info">
            <h3>${product.name}</h3>
            <p class="product-brand">${product.brand || 'Unknown Brand'}</p>
            <p class="product-price">$${product.price.toFixed(2)}</p>
            <p class="product-description">${product.description || ''}</p>
            <div class="product-rating">${'⭐'.repeat(Math.round(product.rating))}</div>
        </div>
    `;
    return card;
}

// Products
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function displayProducts(products) {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';
    
    products.forEach(product => {
        const card = createProductCard(product);
        grid.appendChild(card);
    });
}

function filterProducts() {
    const skinType = document.getElementById('skinTypeFilter').value;
    const url = skinType ? `${API_BASE_URL}/products?skinType=${skinType}` : `${API_BASE_URL}/products`;
    
    fetch(url)
        .then(res => res.json())
        .then(products => displayProducts(products))
        .catch(error => console.error('Filter error:', error));
}

// Stores
async function loadStores() {
    try {
        const response = await fetch(`${API_BASE_URL}/stores`);
        const stores = await response.json();
        displayStores(stores);
    } catch (error) {
        console.error('Error loading stores:', error);
    }
}

function displayStores(stores) {
    const grid = document.getElementById('storesGrid');
    grid.innerHTML = '';
    
    stores.forEach(store => {
        const card = document.createElement('div');
        card.className = 'store-card';
        card.innerHTML = `
            <h3>${store.name}</h3>
            <div class="store-info">
                <strong>📍 Address:</strong> ${store.address || 'Not available'}
            </div>
            <div class="store-info">
                <strong>📞 Phone:</strong> ${store.phone || 'Not available'}
            </div>
            <div class="store-info">
                <strong>⏰ Hours:</strong> ${store.hours || 'Not available'}
            </div>
            <div class="store-distance">${store.distance || 'N/A'} km away</div>
        `;
        grid.appendChild(card);
    });
}

async function findNearbyStores() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
            // Update user location
            await fetch(`${API_BASE_URL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({
                    coordinates: { lat: latitude, lng: longitude }
                })
            });

            // Get nearby stores
            const response = await fetch(`${API_BASE_URL}/stores/nearby`, {
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });

            const stores = await response.json();
            displayStores(stores);

            // Track usage
            await fetch(`${API_BASE_URL}/usage/track`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({ feature: 'nearbyStores' })
            });
        } catch (error) {
            console.error('Error fetching nearby stores:', error);
            alert('Error finding nearby stores');
        }
    }, (error) => {
        alert('Error accessing geolocation: ' + error.message);
    });
}

// Image upload
document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyzeImageBtn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', async () => {
            const imageInput = document.getElementById('imageInput');
            if (!imageInput.files[0]) {
                alert('Please select an image first');
                return;
            }

            const formData = new FormData();
            formData.append('image', imageInput.files[0]);

            try {
                const response = await fetch(`${API_BASE_URL}/skinanalysis/image`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${currentToken}`
                    },
                    body: formData
                });

                const data = await response.json();
                displayQuizResults(data.skinType, data.recommendations);

                // Track usage
                await fetch(`${API_BASE_URL}/usage/track`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${currentToken}`
                    },
                    body: JSON.stringify({ feature: 'imageAnalysis' })
                });
            } catch (error) {
                console.error('Image upload error:', error);
                alert('Error analyzing image');
            }
        });
    }
});

// Chatbot
let chatVisible = false;

function toggleChat() {
    const chatBox = document.getElementById('chatBox');
    chatVisible = !chatVisible;
    chatBox.style.display = chatVisible ? 'flex' : 'none';
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;

    // Display user message
    const messagesDiv = document.getElementById('chatMessages');
    const userMsg = document.createElement('div');
    userMsg.className = 'message user-message';
    userMsg.textContent = message;
    messagesDiv.appendChild(userMsg);
    input.value = '';

    // Send to chatbot API
    fetch(`${API_BASE_URL}/chatbot/message`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({ message })
    })
    .then(res => res.json())
    .then(data => {
        const botMsg = document.createElement('div');
        botMsg.className = 'message bot-message';
        botMsg.textContent = data.message;
        messagesDiv.appendChild(botMsg);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    })
    .catch(error => {
        console.error('Chat error:', error);
        const errorMsg = document.createElement('div');
        errorMsg.className = 'message bot-message';
        errorMsg.textContent = 'Sorry, I encountered an error. Please try again.';
        messagesDiv.appendChild(errorMsg);
    });
}

function handleChatInput(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
}

// Admin Dashboard
async function loadAdminStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        const data = await response.json();
        document.getElementById('totalUsers').textContent = data.totalUsers;
        document.getElementById('totalAnalyses').textContent = data.totalAnalyses;

        // Display usage stats
        const usageDiv = document.getElementById('usageStats');
        usageDiv.innerHTML = '<table style="width: 100%; text-align: left;"><tr><th>Feature</th><th>Usage Count</th></tr>';
        data.usageStats.forEach(stat => {
            usageDiv.innerHTML += `<tr><td>${stat._id}</td><td>${stat.count}</td></tr>`;
        });
        usageDiv.innerHTML += '</table>';
    } catch (error) {
        console.error('Error loading admin stats:', error);
    }
}

// Initialize auth tabs on load
document.addEventListener('DOMContentLoaded', () => {
    switchAuthTab('login');
});
