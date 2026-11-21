const byId = id => document.getElementById(id);
const storageKey = 'kodi-prompt-workshop-v1';
const initial = {lang:'en', path:'app', step:0, app:[], game:[], edited:{}};
let state = {...initial};
let canSave = true;
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (saved && ['en','zh'].includes(saved.lang) && ['app','game'].includes(saved.path)
      && Number.isInteger(saved.step) && saved.step >= 0 && saved.step <= 5
      && [saved.app,saved.game].every(a => Array.isArray(a) && a.every(v => typeof v === 'string'))
      && saved.edited && typeof saved.edited === 'object') state = saved;
} catch { /* Start a new draft when browser storage is unavailable. */ }
const t = (en, zh) => state.lang === 'en' ? en : zh;
const routes = {
  app: [
    ['What would you like to make easier?', '你想讓哪件事變得更容易？', 'Think of a moment when you wished you had a little help.', '想一想，什麼時候你會希望有人幫忙？', ['Remember what to pack','Plan dinner with my family'], ['記得出門要帶的東西','和家人一起安排晚餐'], 'Problem to solve','要解決的問題'],
    ['Who will use your app?', '誰會使用你的工具？', 'Picture one person opening it. What would help them feel comfortable?', '想像一個會使用它的人。怎樣能讓這個人更容易上手？', ['A child getting ready for school','Grandparents who prefer large text'], ['正在準備上學的小朋友','喜歡大字的阿公阿嬤'], 'People using it','使用對象'],
    ['What should someone be able to do?', '使用者可以做什麼？', 'Imagine their first visit. Describe one action they can take.', '想像第一次打開時，使用者可以做的一個動作。', ['Tap items to check them off','Type a few words to add an item'], ['點一下就能勾選項目','輸入幾個字就能新增項目'], 'Main action','主要操作'],
    ['How will they know it worked?', '怎麼知道事情完成了？', 'Tell the AI what the person should see or hear after that action.', '告訴 AI，完成動作後，使用者會看到或聽到什麼。', ['Show how many items are left','Show a friendly “All done!” message'], ['顯示還剩幾個項目','顯示親切的「完成了！」提示'], 'What success looks like','完成時的畫面']
  ],
  game: [
    ['What would you like players to experience?', '你希望玩家體驗什麼？', 'Imagine a moment you would love to play. Where are you, and how does it feel?', '想像你最想玩的一幕。你在哪裡？有什麼感覺？', ['A peaceful walk finding forest creatures','A thrilling race on the moon'], ['在寧靜森林裡尋找小動物','在月球上體驗刺激的競速'], 'Experience','遊戲體驗'],
    ['Who will play your game?', '誰會玩你的遊戲？', 'Think about the player and how much practice they might have.', '想一想玩家是誰，以及他們玩遊戲的經驗。', ['Children playing their first game','My family taking turns on a tablet'], ['第一次玩遊戲的小朋友','輪流使用平板的家人'], 'Players','玩家'],
    ['What will the player do again and again?', '玩家會重複做什麼動作？', 'Picture their hands. What do they tap, move, or choose?', '想像玩家的雙手。他們會點選、移動或選擇什麼？', ['Tap to discover hidden things','Steer around obstacles'], ['點一下，找出藏起來的東西','控制方向，避開障礙物'], 'Main action','主要玩法'],
    ['What gives the player a goal?', '玩家要達成什麼目標？', 'Describe what makes a round feel complete. A quiet discovery counts, too.', '描述什麼情況下這一回合算完成。小小的發現也可以是目標。', ['Find three surprises to fill a scrapbook','Reach the finish line and try again'], ['找到三個驚喜，完成剪貼簿','抵達終點，再挑戰一次'], 'Goal','遊戲目標']
  ]
};
const art = {
  app:'<rect x="7" y="6" width="34" height="35" rx="5"/><path d="M8 16h32M13 11h1m4 0h1M14 24h7v9h-7zm13 0h7m-7 7h5"/>',
  game:'<path d="M16 15h16c7 0 9 7 11 17 1 7-5 9-10 4l-5-5h-8l-5 5C10 41 4 39 5 32c2-10 4-17 11-17Z"/><path d="M13 23h9m-4.5-4.5v9m13-5h.2m5 4h.2"/>'
};
function save() {
  try {localStorage.setItem(storageKey, JSON.stringify(state))}
  catch {canSave = false; updateFooter()}
}
function updateFooter() {
  byId('foot').textContent = canSave
    ? t('Your draft stays in this browser. Come back any time.', '草稿會保存在這個瀏覽器中，下次可以接著做。')
    : t('This browser can’t save your draft. Copy your prompt before closing.', '這個瀏覽器無法儲存草稿。關閉前請先複製提示詞。');
}
function go(step) {
  state.step = step;
  save();
  render();
  byId('question').focus();
}
function element(tag, cls) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  return el;
}
function button(label, action, cls) {
  const btn = element('button', cls);
  btn.textContent = label;
  btn.onclick = action;
  return btn;
}
function chooseProject(panel) {
  const choices = element('div','choices');
  for (const path of ['app','game']) {
    const app = path === 'app';
    const btn = button('', () => {state.path = path; go(1)}, 'card '+path);
    const icon = element('span','icon');
    icon.innerHTML = '<svg aria-hidden="true" viewBox="0 0 48 48">'+art[path]+'</svg>';
    const words = element('span'), name = element('strong'), detail = element('small');
    name.textContent = app ? t('An app','做工具') : t('A game','做遊戲');
    detail.textContent = app ? t('Help someone solve a problem.','幫助別人解決一個問題。') : t('Create an experience for someone to play.','設計一段可以玩的體驗。');
    words.append(name,detail);
    btn.append(icon,words);
    choices.append(btn);
  }
  panel.append(choices);
}
function buildPrompt() {
  const path = state.path;
  const lines = routes[path].map((q,i) => t(q[6],q[7])+' — '+state[path][i].trim());
  return [t('Please make a small '+path+' that runs in a web browser.',path === 'app' ? '請做一個可以在瀏覽器中使用的小工具。':'請做一個可以在瀏覽器中玩的遊戲。'), '', ...lines, '',
    t('Build a working first version with clear instructions. Explain how I can try it.', '請做出可以操作的第一版，加入清楚的說明，並告訴我怎麼試用。')].join('\n');
}
async function copyPrompt(input) {
  try {
    await navigator.clipboard.writeText(input.value);
    byId('status').textContent = t('Copied! Paste it into your AI chat.', '複製好了！貼到 AI 聊天視窗即可。');
  } catch {
    input.focus();
    input.select();
    byId('status').textContent = t('Your prompt is selected. Use your device’s Copy command.', '已選取提示詞。請使用裝置上的複製功能。');
  }
}
function editor(panel, q) {
  const {path,step} = state;
  const box = element('div','box'), label = element('label'), input = element('textarea');
  label.htmlFor = input.id = 'answer';
  label.textContent = q ? t('Your idea','你的想法') : t('Edit your prompt','編輯提示詞');
  input.setAttribute('aria-describedby','question status');
  input.value = q ? state[path][step-1] || '' : state.edited[path] ?? buildPrompt();
  input.placeholder = t('Write a few words, or choose an example below.', '寫下幾個字，或選擇下面的例子。');
  if (!q) input.className = 'prompt';
  input.oninput = () => {
    if (q) {
      if (state[path][step-1] !== input.value) delete state.edited[path];
      state[path][step-1] = input.value;
    } else state.edited[path] = input.value;
    save();
    byId('status').textContent = '';
  };
  box.append(label,input);
  if (q) {
    const examples = element('div','examples');
    for (const sample of t(q[4],q[5])) {
      examples.append(button(sample, () => {input.value = sample; input.oninput(); input.focus()},'example'));
    }
    box.append(examples);
  }
  const nav = element('div','nav');
  nav.append(button(t('Back','上一步'), () => go(step-1)));
  const next = step === 4 ? t('Build my prompt','產生提示詞') : t('Continue','繼續');
  nav.append(button(q ? next : t('Copy prompt','複製提示詞'), () => {
    if (!input.value.trim()) {
      byId('status').textContent = t('Add a few words to continue.', '請先寫下幾個字。');
      input.focus();
      return;
    }
    if (q) go(step+1);
    else return copyPrompt(input);
  }, 'primary'));
  panel.append(box,nav);
  if (!q) {
    const more = element('div','examples');
    more.append(button(t('Choose a project','選擇創作類型'), () => go(0)));
    more.append(button(t('Start a fresh '+path,'開始新草稿'), () => {
      if (confirm(t('Clear this '+path+' draft and start again? Copy your prompt first if you want to keep it.', '要清除此類型的草稿並重新開始嗎？若要保留提示詞，請先複製。'))) {
        state[path] = []; delete state.edited[path]; go(1);
      }
    }));
    panel.append(more);
  }
}
function render() {
  window.speechSynthesis?.cancel();
  const {step,path} = state;
  const q = routes[path][step-1];
  const home = step === 0;
  document.documentElement.lang = t('en','zh-Hant');
  byId('brand').textContent = document.title = t('Kodi’s Prompt Workshop','Kodi 的提示詞工坊');
  byId('language').textContent = t('繁體中文','English');
  byId('name').textContent = t('Kodi · Your guide','Kodi · 你的嚮導');
  byId('eyebrow').textContent = t('✧  Prompt workshop','✧  提示詞工坊');
  byId('title').textContent = home ? t('Hi, I’m Kodi.','嗨，我是 Kodi。')
    : q ? t('Let’s design your '+path+'.',path === 'app' ? '一起設計你的工具。':'一起設計你的遊戲。') : t('Your idea, in words.','你的點子成形了。');
  byId('speech').textContent = home
    ? t('You can chat with AI just like a friend. When you want to make something, a few details help it understand your idea. Those instructions are called a prompt.', '你可以像和朋友聊天一樣跟 AI 說話。想做出東西時，多給一些細節，AI 就更容易懂你的點子。這些寫給 AI 的指示，就叫作「提示詞」。')
    : q ? t(q[2],q[3]) : t('Read your prompt and change anything you like. Then copy it into a chat with an AI and send it.', '讀一讀你的提示詞，想改什麼都可以。接著複製到 AI 聊天視窗，送出就能試試。');
  byId('listen').hidden = !window.speechSynthesis;
  byId('listen').textContent = t('Listen to Kodi','聽 Kodi 說');
  byId('progress').textContent = home ? t('Getting started','準備開始') : q ? t('Question '+step+' of 4','第 '+step+' 題，共 4 題') : t('Your finished prompt','你的提示詞');
  byId('meter').innerHTML = Array.from({length:6},(_,i) => i<=step ? '<i class="done"></i>' : '<i></i>').join('');
  byId('question').textContent = home ? t('What would you like to create?','今天想創作什麼？') : q ? t(q[0],q[1]) : t('Your '+path+' prompt',path === 'app' ? '你的工具提示詞':'你的遊戲提示詞');
  byId('status').textContent = '';
  const panel = byId('panel'); panel.replaceChildren();
  if (home) chooseProject(panel); else editor(panel,q);
  updateFooter();
}
byId('language').onclick = () => {state.lang = t('zh','en'); save(); render()};
byId('listen').onclick = () => {
  const synth = window.speechSynthesis;
  if (synth.speaking) {synth.cancel(); return}
  const parts = ['title','speech','question'].map(id => byId(id).textContent);
  if (!state.step) parts.push(byId('panel').innerText);
  if (state.step === 5) parts.push(byId('answer').value);
  const voice = new SpeechSynthesisUtterance(parts.join('. '));
  voice.lang = t('en-US','zh-TW'); voice.rate = .88;
  synth.speak(voice);
};
render();
