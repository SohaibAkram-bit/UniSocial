document.addEventListener('DOMContentLoaded', () => {
    // --- STATE & CONSTANTS ---
    const API_URL = 'http://127.0.0.1:8000';
    let token = localStorage.getItem('unisocial_token');

    // --- DOM ELEMENT SELECTORS ---
    const btnShowLogin = document.getElementById('btn-show-login');
    const btnShowSignup = document.getElementById('btn-show-signup');
    const btnLogout = document.getElementById('btn-logout');

    const authSection = document.getElementById('auth-section');
    const loginBox = document.getElementById('login-box');
    const signupBox = document.getElementById('signup-box');

    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    const loginError = document.getElementById('login-error');
    const signupError = document.getElementById('signup-error');
    const postError = document.getElementById('post-error');

    const createPostSection = document.getElementById('create-post-section');
    const createPostForm = document.getElementById('create-post-form');

    const postsContainer = document.getElementById('posts-container');

    // --- API HELPER ---

    /**
     * A generic function to make API requests.
     * @param {string} endpoint - The API endpoint to call (e.g., '/posts').
     * @param {string} method - The HTTP method (GET, POST, etc.).
     * @param {object|null} body - The request body for POST/PUT requests.
     * @returns {Promise<any>} - The JSON response from the API.
     */
    async function apiRequest(endpoint, method = 'GET', body = null) {
        const headers = new Headers({
            'Content-Type': 'application/json',
        });

        if (token) {
            headers.append('Authorization', `Bearer ${token}`);
        }

        const config = { method, headers };

        if (body) {
            config.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_URL}${endpoint}`, config);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'An unknown error occurred.');
        }

        // For 204 No Content responses
        if (response.status === 204) {
            return null;
        }

        return response.json();
    }

    // --- RENDER FUNCTIONS ---

    /**
     * Renders a single post object into an HTML element.
     * @param {object} post - The post object from the API.
     * @returns {HTMLElement} - The created post element.
     */
    function renderPost(post) {
        const postCard = document.createElement('div');
        postCard.className = 'post-card';
        postCard.dataset.postId = post.id;

        const authorName = post.is_anonymous ? 'UOL Student' : post.author.first_name;
        const postDate = new Date(post.created_at).toLocaleString();

        postCard.innerHTML = `
            <div class="post-header">
                <span class="post-author">${authorName}</span>
                <span class="post-category">${post.category}</span>
            </div>
            <p class="post-text">${post.text}</p>
            <div class="post-footer">
                <span class="post-timestamp">${postDate}</span>
            </div>
            <div class="replies-container"></div>
            ${token ? `
            <form class="reply-form">
                <input type="text" class="reply-text-input" placeholder="Write a reply..." required>
                <label><input type="checkbox" class="reply-anonymous-checkbox"> Anonymous</label>
                <button type="submit">Reply</button>
            </form>
            ` : ''}
        `;

        // Fetch and render replies for this post
        fetchAndRenderReplies(post.id, postCard.querySelector('.replies-container'));

        return postCard;
    }

    /**
     * Fetches all posts from the API and renders them to the page.
     */
    async function fetchAndRenderPosts() {
        try {
            postsContainer.innerHTML = '<p>Loading posts...</p>';
            const posts = await apiRequest('/posts');
            postsContainer.innerHTML = ''; // Clear loading message
            posts.forEach(post => {
                const postElement = renderPost(post);
                postsContainer.appendChild(postElement);
            });
        } catch (error) {
            postsContainer.innerHTML = `<p class="error-text">Failed to load posts: ${error.message}</p>`;
        }
    }

    /**
     * Fetches and renders replies for a specific post.
     * @param {number} postId - The ID of the post.
     * @param {HTMLElement} container - The container to render replies into.
     */
    async function fetchAndRenderReplies(postId, container) {
        try {
            const replies = await apiRequest(`/posts/${postId}/replies`);
            container.innerHTML = '';
            replies.forEach(reply => {
                const authorName = reply.is_anonymous ? 'UOL Student' : reply.author.first_name;
                const replyDate = new Date(reply.created_at).toLocaleTimeString();
                container.innerHTML += `
                    <div class="reply-card">
                        <div class="reply-header">
                            <span class="reply-author">${authorName}</span>
                            <span class="reply-timestamp">${replyDate}</span>
                        </div>
                        <p class="reply-text">${reply.text}</p>
                    </div>
                `;
            });
        } catch (error) {
            container.innerHTML = `<p class="error-text" style="font-size: 0.8rem;">Could not load replies.</p>`;
        }
    }

    // --- UI & STATE MANAGEMENT ---

    /**
     * Updates the UI based on whether the user is logged in or not.
     */
    function updateUI() {
        if (token) {
            // Logged in state
            btnShowLogin.classList.add('hidden');
            btnShowSignup.classList.add('hidden');
            btnLogout.classList.remove('hidden');
            authSection.classList.add('hidden');
            loginBox.classList.add('hidden');
            signupBox.classList.add('hidden');
            createPostSection.classList.remove('hidden');
        } else {
            // Logged out state
            btnShowLogin.classList.remove('hidden');
            btnShowSignup.classList.remove('hidden');
            btnLogout.classList.add('hidden');
            createPostSection.classList.add('hidden');
        }
    }

    // --- EVENT HANDLERS ---

    btnShowLogin.addEventListener('click', () => {
        authSection.classList.remove('hidden');
        loginBox.classList.remove('hidden');
        signupBox.classList.add('hidden');
    });

    btnShowSignup.addEventListener('click', () => {
        authSection.classList.remove('hidden');
        signupBox.classList.remove('hidden');
        loginBox.classList.add('hidden');
    });

    btnLogout.addEventListener('click', () => {
        token = null;
        localStorage.removeItem('unisocial_token');
        updateUI();
        // Reload posts to remove reply forms
        fetchAndRenderPosts();
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        signupError.textContent = '';
        const body = {
            email: e.target.elements['signup-email'].value,
            password: e.target.elements['signup-password'].value,
            first_name: e.target.elements['signup-firstname'].value,
        };
        try {
            await apiRequest('/auth/signup', 'POST', body);
            alert('Signup successful! Please log in.');
            signupForm.reset();
            // Switch to login view
            loginBox.classList.remove('hidden');
            signupBox.classList.add('hidden');
        } catch (error) {
            signupError.textContent = error.message;
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.textContent = '';
        // FastAPI's OAuth2PasswordRequestForm expects form data
        const formData = new URLSearchParams();
        formData.append('username', e.target.elements['login-email'].value);
        formData.append('password', e.target.elements['login-password'].value);

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Login failed.');
            }
            const data = await response.json();
            token = data.access_token;
            localStorage.setItem('unisocial_token', token);
            loginForm.reset();
            updateUI();
            fetchAndRenderPosts(); // Reload posts to show reply forms
        } catch (error) {
            loginError.textContent = error.message;
        }
    });

    createPostForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        postError.textContent = '';
        const body = {
            text: e.target.elements['post-text'].value,
            category: e.target.elements['post-category'].value,
            is_anonymous: e.target.elements['post-anonymous'].checked,
        };
        try {
            await apiRequest('/posts', 'POST', body);
            createPostForm.reset();
            fetchAndRenderPosts(); // Refresh the feed
        } catch (error) {
            postError.textContent = `Failed to create post: ${error.message}`;
        }
    });

    // Use event delegation for dynamically created reply forms
    postsContainer.addEventListener('submit', async (e) => {
        if (e.target.matches('.reply-form')) {
            e.preventDefault();
            const postCard = e.target.closest('.post-card');
            const postId = postCard.dataset.postId;
            const repliesContainer = postCard.querySelector('.replies-container');

            const body = {
                text: e.target.querySelector('.reply-text-input').value,
                is_anonymous: e.target.querySelector('.reply-anonymous-checkbox').checked,
            };

            try {
                await apiRequest(`/posts/${postId}/replies`, 'POST', body);
                e.target.reset();
                fetchAndRenderReplies(postId, repliesContainer); // Refresh just the replies for this post
            } catch (error) {
                alert(`Failed to post reply: ${error.message}`);
            }
        }
    });

    // --- INITIALIZATION ---
    updateUI();
    fetchAndRenderPosts();
});