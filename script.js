// script.js - minimal client-only forum using localStorage

const STORAGE_KEY = 'forum_posts_v1';
const CATEGORIES = ['Announcements','Suggestions','Polls','Questions','Show and Tell','Other'];
let posts = [];
let activeCategory = 'All';

// DOM refs
const categoriesEl = document.getElementById('categories');
const postsListEl = document.getElementById('posts-list');
const postForm = document.getElementById('post-form');
const titleInput = document.getElementById('post-title');
const categorySelect = document.getElementById('post-category');
const contentInput = document.getElementById('post-content');
const isPollCheckbox = document.getElementById('is-poll');
const pollChoicesInput = document.getElementById('poll-choices');
const clearFormBtn = document.getElementById('clear-form');
const resetSampleBtn = document.getElementById('reset-sample');

function loadPosts(){
  const raw = localStorage.getItem(STORAGE_KEY);
  posts = raw ? JSON.parse(raw) : [];
}

function savePosts(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function id(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

function renderCategories(){
  categoriesEl.innerHTML = '';
  const allBtn = document.createElement('button');
  allBtn.className = 'category' + (activeCategory==='All' ? ' active' : '');
  allBtn.textContent = 'All';
  allBtn.onclick = ()=>{ activeCategory='All'; renderAll(); };
  categoriesEl.appendChild(allBtn);
  CATEGORIES.forEach(c=>{
    const btn = document.createElement('button');
    btn.className = 'category' + (activeCategory===c ? ' active' : '');
    btn.textContent = c;
    btn.onclick = ()=>{ activeCategory=c; renderAll(); };
    categoriesEl.appendChild(btn);
  })
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

postForm.addEventListener('submit', e=>{
  e.preventDefault();
  const title = titleInput.value.trim();
  const category = categorySelect.value;
  const content = contentInput.value.trim();
  const isPoll = isPollCheckbox.checked;
  let post = { id: id(), title, category, content, created: new Date().toISOString() };
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
    { id:id(), title:'Welcome — Read the rules', category:'Announcements', content:'Welcome to the simple forum. Be kind and follow community guidelines.', created:new Date().toISOString(), type:'post' },
    { id:id(), title:'Feature idea: Dark mode', category:'Suggestions', content:'It would be great to have a dark theme option.', created:new Date().toISOString(), type:'post' },
    { id:id(), title:'Which logo do you prefer?', category:'Polls', content:'Vote for your favorite logo.', created:new Date().toISOString(), type:'poll', choices:[{text:'Blue',votes:3},{text:'Green',votes:1},{text:'Red',votes:0}] },
    { id:id(), title:'How do I embed a project?', category:'Questions', content:'I want to show my project in a post. How can I embed code or images?', created:new Date().toISOString(), type:'post' },
    { id:id(), title:'My latest build', category:'Show and Tell', content:'I made a small robot that draws patterns. Here are a few photos (add links).', created:new Date().toISOString(), type:'post' }
  ];
}

// Init
loadPosts();
if(posts.length===0) { loadSamplePosts(); savePosts(); }
loadPosts();
renderAll();
