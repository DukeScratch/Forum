// script.js - minimal client-only forum using localStorage

const STORAGE_KEY = 'forum_posts_v1';
const USERS_KEY = 'forum_users_v1';
const AUTH_KEY = 'forum_auth_v1';
const CATEGORIES = ['Announcements','Suggestions','Polls','Questions','Show and Tell','Other'];
let posts = [];
let activeCategory = 'All';
let currentUser = null;

// DOM refs
const loginPage = document.getElementById('login-page');
const signupPage = document.getElementById('signup-page');
const forumPage = document.getElementById('forum-page');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const signupUsername = document.getElementById('signup-username');
const signupEmail = document.getElementById('signup-email');
const signupPassword = document.getElementById('signup-password');
const signupConfirm = document.getElementById('signup-confirm');
const toSignupLink = document.getElementById('to-signup');
const toLoginLink = document.getElementById('to-login');
const userGreeting = document.getElementById('user-greeting');
const logoutBtn = document.getElementById('logout-btn');
const categoriesMenu = document.getElementById('categories-menu');
const postsListEl = document.getElementById('posts-list');
const postForm = document.getElementById('post-form');
const titleInput = document.getElementById('post-title');
const categorySelect = document.getElementById('post-category');
const contentInput = document.getElementById('post-content');
const isPollCheckbox = document.getElementById('is-poll');
const pollChoicesInput = document.getElementById('poll-choices');
const clearFormBtn = document.getElementById('clear-form');
const resetSampleBtn = document.getElementById('reset-sample');

function id(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

// Auth functions
function loadUsers(){
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveUsers(users){
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadAuth(){
  const raw = localStorage.getItem(AUTH_KEY);
  return raw ? JSON.parse(raw) : null;
}

function saveAuth(auth){
  if(auth) localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  else localStorage.removeItem(AUTH_KEY);
}

function signup(username, email, password, confirmPassword){
  if(password !== confirmPassword){
    alert('Passwords do not match');
    return false;
  }
  const users = loadUsers();
  if(users[email]){
    alert('Email already registered');
    return false;
  }
  users[email] = { username, email, password };
  saveUsers(users);
  alert('Account created! Please sign in.');
  showLoginPage();
  return true;
}

function login(email, password){
  const users = loadUsers();
  if(!users[email]){
    alert('Email not found');
    return false;
  }
  if(users[email].password !== password){
    alert('Incorrect password');
    return false;
  }
  currentUser = users[email];
  saveAuth({ email, username: currentUser.username });
  showForumPage();
  return true;
}

function logout(){
  currentUser = null;
  saveAuth(null);
  showLoginPage();
}

function showLoginPage(){
  loginPage.classList.remove('hidden');
  signupPage.classList.add('hidden');
  forumPage.classList.add('hidden');
  loginForm.reset();
}

function showSignupPage(){
  loginPage.classList.add('hidden');
  signupPage.classList.remove('hidden');
  forumPage.classList.add('hidden');
  signupForm.reset();
}

function showForumPage(){
  loginPage.classList.add('hidden');
  signupPage.classList.add('hidden');
  forumPage.classList.remove('hidden');
  userGreeting.textContent = `Welcome, ${currentUser.username}!`;
  renderAll();
}

// Forum functions
function loadPosts(){
  const raw = localStorage.getItem(STORAGE_KEY);
  posts = raw ? JSON.parse(raw) : [];
}

function savePosts(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function renderCategories(){
  const links = categoriesMenu.querySelectorAll('.category-link');
  links.forEach(link => {
    link.classList.remove('active');
    if(link.dataset.category === activeCategory){
      link.classList.add('active');
    }
  });
}

function renderAll(){
  renderCategories();
  renderPosts();
}

function renderPosts(){
  postsListEl.innerHTML = '';
  const list = posts.slice().reverse(); // newest first
  const filtered = (activeCategory==='All') ? list : list.filter(p=>p.category===activeCategory);
  if(filtered.length===0){ postsListEl.innerHTML = '<p><small>No posts yet.</small></p>'; return; }
  filtered.forEach(p=>{
    const div = document.createElement('div');
    div.className = 'post';
    const meta = document.createElement('div'); meta.className='post-meta';
    meta.textContent = `${p.category} • ${new Date(p.created).toLocaleString()}`;
    const title = document.createElement('h3'); title.className='post-title'; title.textContent = p.title;
    const content = document.createElement('div'); content.className='post-content'; content.textContent = p.content;
    div.appendChild(meta); div.appendChild(title); div.appendChild(content);

    if(p.type==='poll'){
      const choicesWrap = document.createElement('div'); choicesWrap.className='poll-choices';
      p.choices.forEach((ch,idx)=>{
        const cb = document.createElement('div'); cb.className='choice';
        const text = document.createElement('div'); text.textContent = `${ch.text} — ${ch.votes} vote${ch.votes===1?'':'s'}`;
        const btn = document.createElement('button'); btn.className='vote-btn'; btn.textContent='Vote';
        btn.onclick = ()=>{ voteOnPoll(p.id, idx); };
        cb.appendChild(text); cb.appendChild(btn);
        choicesWrap.appendChild(cb);
      })
      div.appendChild(choicesWrap);
    }

    postsListEl.appendChild(div);
  })
}

function voteOnPoll(postId, choiceIndex){
  const p = posts.find(x=>x.id===postId);
  if(!p || p.type!=='poll') return;
  p.choices[choiceIndex].votes = (p.choices[choiceIndex].votes || 0) + 1;
  savePosts(); renderPosts();
}

// Event listeners
toSignupLink.addEventListener('click', (e)=>{ e.preventDefault(); showSignupPage(); });
toLoginLink.addEventListener('click', (e)=>{ e.preventDefault(); showLoginPage(); });

loginForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  login(loginEmail.value, loginPassword.value);
});

signupForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  if(signup(signupUsername.value, signupEmail.value, signupPassword.value, signupConfirm.value)){
    // success
  }
});

logoutBtn.addEventListener('click', logout);

categoriesMenu.addEventListener('click', (e)=>{
  if(e.target.classList.contains('category-link')){
    e.preventDefault();
    activeCategory = e.target.dataset.category;
    renderAll();
  }
});

postForm.addEventListener('submit', e=>{
  e.preventDefault();
  const title = titleInput.value.trim();
  const category = categorySelect.value;
  const content = contentInput.value.trim();
  const isPoll = isPollCheckbox.checked;
  let post = { id: id(), title, category, content, created: new Date().toISOString(), author: currentUser.username };
  if(isPoll){
    const raw = pollChoicesInput.value.split(',').map(s=>s.trim()).filter(Boolean);
    const choices = raw.length ? raw.map(c=>({ text:c, votes:0 })) : [{text:'Yes',votes:0},{text:'No',votes:0}];
    post.type='poll'; post.choices=choices;
  } else { post.type='post'; }
  posts.push(post); savePosts(); renderPosts(); postForm.reset();
});

clearFormBtn.addEventListener('click', ()=>postForm.reset());
resetSampleBtn.addEventListener('click', ()=>{ if(confirm('Reset to sample posts? This will erase your local posts.')){ loadSamplePosts(); savePosts(); loadPosts(); renderAll(); }});

function loadSamplePosts(){
  posts = [
    { id:id(), title:'Welcome — Read the rules', category:'Announcements', content:'Welcome to the simple forum. Be kind and follow community guidelines.', created:new Date().toISOString(), type:'post', author:'Admin' },
    { id:id(), title:'Feature idea: Dark mode', category:'Suggestions', content:'It would be great to have a dark theme option.', created:new Date().toISOString(), type:'post', author:'User1' },
    { id:id(), title:'Which logo do you prefer?', category:'Polls', content:'Vote for your favorite logo.', created:new Date().toISOString(), type:'poll', author:'Admin', choices:[{text:'Blue',votes:3},{text:'Green',votes:2}] },
    { id:id(), title:'How do I embed a project?', category:'Questions', content:'I want to show my project in a post. How can I embed code or images?', created:new Date().toISOString(), type:'post', author:'User2' },
    { id:id(), title:'My latest build', category:'Show and Tell', content:'I made a small robot that draws patterns. Here are a few photos (add links).', created:new Date().toISOString(), type:'post', author:'User3' },
  ];
}

// Init
const auth = loadAuth();
loadPosts();
if(auth){
  currentUser = { username: auth.username, email: auth.email };
  if(posts.length===0) { loadSamplePosts(); savePosts(); loadPosts(); }
  showForumPage();
} else {
  showLoginPage();
}