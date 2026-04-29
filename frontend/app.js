// Detect local environment (localhost, 127.0.0.1, or opened directly as a file)
const isLocal = window.location.hostname === '127.0.0.1' || 
                window.location.hostname === 'localhost' || 
                window.location.protocol === 'file:';

// Replace the URL below with your NEW Back4App URL
const API_BASE_URL = isLocal ? 'http://127.0.0.1:8000' : 'https://unisocial-o9738oda.b4a.run/';

/**
 * A helper function to make API requests.
 * @param {string} endpoint - The API endpoint to call (e.g., '/posts').
 * @param {string} method - The HTTP method (e.g., 'GET', 'POST').
 * @param {object} [body=null] - The request body for POST/PUT requests.
 * @param {string} [token=null] - The JWT token for authentication.
 * @returns {Promise<any>} - The JSON response from the server.
 */
async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || 'An unknown API error occurred.');
    }
    
    if (response.status === 204) {
        return null;
    }
    return response.json();
}

/**
 * Creates the HTML element for a single post.
 * @param {object} post - The post object from the API.
 * @param {number} [post.vibe_count=0] - The total number of vibes.
 * @param {boolean} [post.has_vibed=false] - True if the current user vibed this post.
 * @returns {HTMLElement} - The post card element.
 */
function renderPost(post) {
    const postCard = document.createElement('div');
    postCard.className = 'post-card';
    postCard.dataset.postId = post.id;

    const postHeader = document.createElement('div');
    postHeader.className = 'post-header';

    const authorName = document.createElement('span');
    authorName.className = 'post-author';
    authorName.textContent = post.author.first_name;

    const postCategory = document.createElement('span');
    postCategory.className = 'post-category';
    postCategory.textContent = post.category;

    postHeader.append(authorName, postCategory);

    const postText = document.createElement('p');
    postText.className = 'post-text';
    postText.textContent = post.text;

    const postMeta = document.createElement('div');
    postMeta.className = 'meta';
    postMeta.textContent = `Posted on ${new Date(post.created_at).toLocaleString()}`;

    const postActions = document.createElement('div');
    postActions.className = 'post-actions';

    const replyButton = document.createElement('button');
    replyButton.className = 'reply-btn';
    replyButton.textContent = 'Replies';
    replyButton.dataset.action = 'toggle-replies';

    const vibeButton = document.createElement('button');
    vibeButton.className = 'vibe-btn';
    if (post.has_vibed) {
        vibeButton.classList.add('vibed'); // Set initial state from API
    }
    vibeButton.textContent = 'Vibe';
    vibeButton.dataset.action = 'toggle-vibe';

    const vibeCountSpan = document.createElement('span');
    vibeCountSpan.className = 'vibe-count';
    vibeCountSpan.textContent = post.vibe_count ?? 0;

    postActions.append(replyButton, vibeButton, vibeCountSpan);
    postCard.append(postHeader, postText, postMeta, postActions);

    const repliesSection = document.createElement('div');
    repliesSection.className = 'replies-section hidden';
    const repliesContainer = document.createElement('div');
    repliesContainer.className = 'replies-container';
    repliesSection.append(repliesContainer);
    postCard.append(repliesSection);

    return postCard;
}

let currentPostsPage = 1;
let currentCategory = '';
let currentTrending = false;

async function fetchAndRenderPosts(append = false) {
    const postsContainer = document.getElementById('posts-container');
    if (!append) {
        postsContainer.innerHTML = '<p>Loading posts...</p>';
        currentPostsPage = 1;
    }

    try {
        const token = localStorage.getItem('token');
        let url = `/posts?page=${currentPostsPage}`;
        if (currentCategory) url += `&category=${encodeURIComponent(currentCategory)}`;
        if (currentTrending) url += `&trending=true`;

        const response = await apiRequest(url, 'GET', null, token);
        const posts = response.items;
        
        if (!append) {
            postsContainer.innerHTML = '';
        }
        
        const loadMoreBtn = document.getElementById('load-more-posts-btn');
        if (loadMoreBtn) loadMoreBtn.remove();
        
        if (!append && posts.length === 0) {
            postsContainer.innerHTML = '<p>No posts yet. Be the first to share something!</p>';
            return;
        }
        const fragment = document.createDocumentFragment();
        posts.forEach(post => fragment.appendChild(renderPost(post)));
        postsContainer.appendChild(fragment);

        if (response.page < response.total_pages) {
            const btn = document.createElement('button');
            btn.id = 'load-more-posts-btn';
            btn.className = 'load-more-btn';
            btn.textContent = 'Load More Posts';
            btn.addEventListener('click', () => {
                currentPostsPage++;
                fetchAndRenderPosts(true);
            });
            postsContainer.appendChild(btn);
        }
    } catch (error) {
        if (!append) {
            postsContainer.innerHTML = `<p class="error">Failed to load posts: ${error.message}</p>`;
        } else {
            alert(`Failed to load more posts: ${error.message}`);
        }
    }
}

/**
 * Toggles UI elements based on the user's login status.
 * @param {boolean} isLoggedIn - True if the user is logged in.
 */
function updateAuthState(isLoggedIn) {
    const loginBtn = document.getElementById('btn-show-login');
    const signupBtn = document.getElementById('btn-show-signup');
    const logoutBtn = document.getElementById('btn-logout');
    const createPostSection = document.getElementById('create-post-section');
    const authSection = document.getElementById('auth-section');

    loginBtn.classList.toggle('hidden', isLoggedIn);
    signupBtn.classList.toggle('hidden', isLoggedIn);
    logoutBtn.classList.toggle('hidden', !isLoggedIn);
    createPostSection.classList.toggle('hidden', !isLoggedIn);

    // Hide auth forms if user is logged in
    if (isLoggedIn) {
        authSection.classList.add('hidden');
    }
}

/**
 * Handles the login form submission.
 * @param {Event} event - The form submission event.
 */
async function handleLogin(event) {
    event.preventDefault();
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = '';
    const form = event.target;
    const formData = new FormData(form);
    // FastAPI's OAuth2PasswordRequestForm expects 'username' and 'password' in a form-urlencoded body.
    const body = new URLSearchParams();
    body.append('username', formData.get('login-email'));
    body.append('password', formData.get('login-password'));

    try {
        // We use fetch directly here because this is the only endpoint
        // that requires 'application/x-www-form-urlencoded' instead of JSON.
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            body: body,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(errorData.detail || 'Login failed.');
        }

        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        updateAuthState(true);
        await fetchAndRenderPosts(); // Re-fetch posts to show vibed status
        form.reset();
    } catch (error) {
        errorEl.textContent = error.message;
    }
}

/**
 * Handles the signup form submission.
 * @param {Event} event - The form submission event.
 */
async function handleSignup(event) {
    event.preventDefault();
    const errorEl = document.getElementById('signup-error');
    errorEl.textContent = '';
    const form = event.target;
    const body = {
        first_name: form.elements['signup-firstname'].value,
        email: form.elements['signup-email'].value,
        password: form.elements['signup-password'].value,
    };

    try {
        await apiRequest('/auth/signup', 'POST', body);
        alert('Signup successful! Please log in.');
        // Switch to login view
        document.getElementById('signup-box').classList.add('hidden');
        document.getElementById('login-box').classList.remove('hidden');
        form.reset();
    } catch (error) {
        errorEl.textContent = error.message;
    }
}

/**
 * Handles the create post form submission.
 * @param {Event} event - The form submission event.
 */
async function handleCreatePost(event) {
    event.preventDefault();
    const errorEl = document.getElementById('post-error');
    errorEl.textContent = '';
    const form = event.target;
    const body = {
        text: form.elements['post-text'].value,
        category: form.elements['post-category'].value,
        is_anonymous: form.elements['post-anonymous'].checked,
    };

    if (!body.category) {
        errorEl.textContent = 'Please select a category.';
        return;
    }

    try {
        const token = localStorage.getItem('token');
        await apiRequest('/posts', 'POST', body, token);
        form.reset();
        await fetchAndRenderPosts(); // Refresh the feed
    } catch (error) {
        errorEl.textContent = error.message;
    }
}

/** Handles logging the user out. */
function handleLogout() {
    localStorage.removeItem('token');
    updateAuthState(false);
    fetchAndRenderPosts(); // Re-fetch posts for guest view
}
/**
 * Handles clicks on the Vibe button with an optimistic update.
 * @param {Event} event - The click event.
 */
async function handleVibeClick(event) {
    const button = event.target;
    const postCard = button.closest('.post-card');
    if (!postCard) return;

    const postId = postCard.dataset.postId;
    const vibeCountSpan = postCard.querySelector('.vibe-count');
    const token = localStorage.getItem('token');

    if (!token) {
        alert('You must be logged in to vibe posts.');
        document.getElementById('btn-show-login').click();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    // Optimistic Updates: Update UI before the API call
    const wasVibed = button.classList.contains('vibed');
    const currentCount = parseInt(vibeCountSpan.textContent, 10);

    button.classList.toggle('vibed');
    vibeCountSpan.textContent = wasVibed ? currentCount - 1 : currentCount + 1;

    try {
        const data = await apiRequest(`/posts/${postId}/vibe`, 'POST', {}, token);

        // Sync UI with the authoritative server response
        button.classList.toggle('vibed', data.action === 'added');
        vibeCountSpan.textContent = data.vibe_count;
    } catch (error) {
        console.error('Failed to toggle vibe:', error.message);
        // If the API call fails, revert the optimistic update
        button.classList.toggle('vibed', wasVibed);
        vibeCountSpan.textContent = currentCount;
        alert(`Error: ${error.message}`);
    }
}

async function loadMoreReplies(postId, container, btn) {
    const page = parseInt(btn.dataset.page, 10);
    btn.textContent = 'Loading...';
    btn.disabled = true;
    try {
        const response = await apiRequest(`/posts/${postId}/replies?page=${page}`);
        const replies = response.items;
        
        btn.remove(); // remove current load more button

        replies.forEach(reply => {
            const replyEl = document.createElement('div');
            replyEl.className = 'reply-card';
            const authorStrong = document.createElement('strong');
            authorStrong.textContent = `${reply.author.first_name}:`;
            replyEl.appendChild(authorStrong);
            replyEl.appendChild(document.createTextNode(` ${reply.text}`));
            
            const form = container.querySelector('.nested-reply-form');
            const loginMsg = container.querySelector('.login-message');
            if (form) {
                container.insertBefore(replyEl, form);
            } else if (loginMsg) {
                container.insertBefore(replyEl, loginMsg);
            } else {
                container.appendChild(replyEl);
            }
        });

        if (response.page < response.total_pages) {
            const newBtn = document.createElement('button');
            newBtn.className = 'load-more-replies-btn load-more-btn';
            newBtn.textContent = 'Load More Replies';
            newBtn.dataset.page = page + 1;
            newBtn.addEventListener('click', () => {
                loadMoreReplies(postId, container, newBtn);
            });
            
            const form = container.querySelector('.nested-reply-form');
            const loginMsg = container.querySelector('.login-message');
            if (form) {
                container.insertBefore(newBtn, form);
            } else if (loginMsg) {
                container.insertBefore(newBtn, loginMsg);
            } else {
                container.appendChild(newBtn);
            }
        }
    } catch (error) {
        alert(`Failed to load more replies: ${error.message}`);
        btn.textContent = 'Load More Replies';
        btn.disabled = false;
    }
}

/**
 * Handles toggling the replies section and loading replies.
 * @param {Event} event - The click event.
 */
async function handleToggleRepliesClick(event) {
    const button = event.target;
    const postCard = button.closest('.post-card');
    if (!postCard) return;

    const postId = postCard.dataset.postId;
    const repliesSection = postCard.querySelector('.replies-section');
    const repliesContainer = postCard.querySelector('.replies-container');
    
    repliesSection.classList.toggle('hidden');
    
    if (!repliesSection.classList.contains('hidden') && repliesContainer.innerHTML === '') {
        repliesContainer.innerHTML = '<p>Loading replies...</p>';
        try {
            const response = await apiRequest(`/posts/${postId}/replies?page=1`);
            const replies = response.items;
            repliesContainer.innerHTML = '';
            
            if (replies.length === 0) {
                repliesContainer.innerHTML = '<p class="no-replies">No replies yet. Be the first!</p>';
            } else {
                replies.forEach(reply => {
                    const replyEl = document.createElement('div');
                    replyEl.className = 'reply-card';
                    const authorStrong = document.createElement('strong');
                    authorStrong.textContent = `${reply.author.first_name}:`;
                    replyEl.appendChild(authorStrong);
                    replyEl.appendChild(document.createTextNode(` ${reply.text}`));
                    repliesContainer.appendChild(replyEl);
                });
            }
            
            if (response.page < response.total_pages) {
                const btn = document.createElement('button');
                btn.className = 'load-more-replies-btn load-more-btn';
                btn.textContent = 'Load More Replies';
                btn.dataset.page = 2;
                btn.addEventListener('click', () => {
                    loadMoreReplies(postId, repliesContainer, btn);
                });
                repliesContainer.appendChild(btn);
            }

            const token = localStorage.getItem('token');
            if (token) {
                const form = document.createElement('form');
                form.className = 'nested-reply-form';
                form.innerHTML = `
                    <textarea name="reply-text" class="reply-textarea" placeholder="Write a reply..." required></textarea>
                    <div class="reply-form-actions">
                        <label class="reply-anon-label"><input type="checkbox" name="reply-anonymous"> Reply Anonymously</label>
                        <button type="submit" class="reply-submit-btn">Post Reply</button>
                    </div>
                `;
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const submitBtn = form.querySelector('button[type="submit"]');
                    const text = form.elements['reply-text'].value;
                    const is_anonymous = form.elements['reply-anonymous'].checked;
                    
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Posting...';
                    
                    try {
                        const newReply = await apiRequest(`/posts/${postId}/replies`, 'POST', { text, is_anonymous }, token);
                        form.reset();
                        
                        const noReplies = repliesContainer.querySelector('.no-replies');
                        if (noReplies) noReplies.remove();
                        
                        const newReplyEl = document.createElement('div');
                        newReplyEl.className = 'reply-card';
                        const authorStrong = document.createElement('strong');
                        authorStrong.textContent = `${newReply.author.first_name}:`;
                        newReplyEl.appendChild(authorStrong);
                        newReplyEl.appendChild(document.createTextNode(` ${newReply.text}`));
                        repliesContainer.insertBefore(newReplyEl, form);
                    } catch (error) {
                        alert(`Error: ${error.message}`);
                    } finally {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Post Reply';
                    }
                });
                repliesContainer.appendChild(form);
            } else {
                const loginMessage = document.createElement('p');
                loginMessage.className = 'login-message';
                loginMessage.style.textAlign = 'center';
                loginMessage.style.marginTop = '15px';
                loginMessage.innerHTML = 'You must be logged in to reply. <a href="#">Log in here</a>.';
                
                loginMessage.querySelector('a').addEventListener('click', (e) => {
                    e.preventDefault();
                    document.getElementById('btn-show-login').click();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
                repliesContainer.appendChild(loginMessage);
            }
        } catch (error) {
            repliesContainer.innerHTML = `<p class="error">Failed to load replies: ${error.message}</p>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const postsContainer = document.getElementById('posts-container');
    const token = localStorage.getItem('token');

    // Set initial UI state based on whether a token exists
    updateAuthState(!!token);
    fetchAndRenderPosts();

    // --- Filter & Trending UI Setup ---
    const filterBar = document.createElement('div');
    filterBar.className = 'filter-bar';
    filterBar.style.marginBottom = '20px';
    filterBar.style.display = 'flex';
    filterBar.style.gap = '10px';
    filterBar.innerHTML = `
        <button id="btn-trending" class="trending-btn" style="padding: 5px 10px; cursor: pointer;">🔥 Trending (24h)</button>
        <select id="select-category" class="category-select" style="padding: 5px;">
            <option value="">All Categories</option>
            <option value="Academic">Academic</option>
            <option value="Mental Health">Mental Health</option>
            <option value="Social">Social</option>
            <option value="Rant">Rant</option>
            <option value="Advice">Advice</option>
        </select>
    `;
    postsContainer.parentNode.insertBefore(filterBar, postsContainer);

    document.getElementById('btn-trending').addEventListener('click', (e) => {
        currentTrending = !currentTrending;
        e.target.style.backgroundColor = currentTrending ? '#ddd' : '';
        currentPostsPage = 1; // reset page on filter change
        fetchAndRenderPosts();
    });
    document.getElementById('select-category').addEventListener('change', (e) => {
        currentCategory = e.target.value;
        currentPostsPage = 1; // reset page on filter change
        fetchAndRenderPosts();
    });

    // Event Delegation for dynamically created post buttons (vibes and replies)
    postsContainer.addEventListener('click', (event) => {
        if (event.target.dataset.action === 'toggle-vibe') {
            handleVibeClick(event);
        } else if (event.target.dataset.action === 'toggle-replies') {
            handleToggleRepliesClick(event);
        }
    });

    // --- Auth & UI Event Listeners ---
    const loginBtn = document.getElementById('btn-show-login');
    const signupBtn = document.getElementById('btn-show-signup');
    const logoutBtn = document.getElementById('btn-logout');
    const authSection = document.getElementById('auth-section');
    const loginBox = document.getElementById('login-box');
    const signupBox = document.getElementById('signup-box');

    loginBtn.addEventListener('click', () => {
        authSection.classList.remove('hidden');
        loginBox.classList.remove('hidden');
        signupBox.classList.add('hidden');
    });

    signupBtn.addEventListener('click', () => {
        authSection.classList.remove('hidden');
        signupBox.classList.remove('hidden');
        loginBox.classList.add('hidden');
    });

    logoutBtn.addEventListener('click', handleLogout);
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-form').addEventListener('submit', handleSignup);
    document.getElementById('create-post-form').addEventListener('submit', handleCreatePost);
});