(function(){
  "use strict";

  var CFG = window.SHOP_CONFIG || {};

  // ---------- данные товаров ----------
  var ITEMS = [
    { id:'belyy',       name:'Белый хлеб',                price:250, weight:'≈ 700 г', tag:'Хит',         img:'assets/belyy.png',       desc:'Нежный мякиш и хрустящая корочка. Универсальный хлеб к любому столу.' },
    { id:'semechki',    name:'Хлеб с семечками',          price:270, weight:'≈ 650 г', tag:'Польза',      img:'assets/semechki.png',    desc:'С подсолнечными, льняными и тыквенными семенами — богатый вкус и текстура.' },
    { id:'briosh',      name:'Бриошь',                    price:190, weight:'≈ 450 г', tag:null,          img:'assets/briosh.png',      desc:'Сдобная воздушная булка с мягким сливочным вкусом.' },
    { id:'kukuruznyy',  name:'Кукурузный хлеб',           price:270, weight:'≈ 600 г', tag:null,          img:'assets/kukuruznyy.png',  desc:'Лёгкая сладость и яркий аромат кукурузной муки.' },
    { id:'rzhanoy',     name:'Ржаной хлеб',               price:190, weight:'≈ 700 г', tag:null,          img:'assets/rzhanoy.png',     desc:'Плотный насыщенный вкус. Идеален для сытных блюд и закусок.' },
    { id:'borodinskiy', name:'Бородинский',               price:300, weight:'≈ 750 г', tag:'Классика',    img:'assets/borodinskiy.png', desc:'Тёмный хлеб с ароматом кориандра и лёгкой солодовой сладостью.' },
    { id:'rukkola',     name:'Руккола-шпинат',            price:300, weight:'≈ 650 г', tag:'Новинка',     img:'assets/rukkola.png',     desc:'Зелёный хлеб с рукколой и шпинатом. Необычный вкус и польза.' },
    { id:'kosichka',    name:'Косичка',                   price:170, weight:'≈ 400 г', tag:'Любят дети',  img:'assets/kosichka.png',    desc:'Французский дрожжевой хлеб-косичка. Золотистый и воздушный.' },
    { id:'bezglyuten',  name:'Кукурузный безглютеновый',  price:300, weight:'≈ 600 г', tag:'Без глютена', img:'assets/hero_bread.jpg',  desc:'На кукурузной муке, без глютена. Хрустящая корка с надрезами, лёгкая сладость и аромат кукурузы — вкус без компромиссов.' }
  ];
  var BY_ID = {};
  ITEMS.forEach(function(it){ BY_ID[it.id] = it; });

  // ---------- состояние ----------
  var state = { cart:{}, custom:[], step:'cart', method:'Самовывоз' };

  // ---------- helpers ----------
  function $(sel, root){ return (root||document).querySelector(sel); }
  function fmt(n){ return new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' \u20bd'; }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function plural(n){ var a=n%10,b=n%100; if(a===1&&b!==11) return 'товар'; if(a>=2&&a<=4&&(b<10||b>=20)) return 'товара'; return 'товаров'; }

  function totals(){
    var sub=0, count=0;
    Object.keys(state.cart).forEach(function(id){
      var q=state.cart[id]; count+=q; sub += (BY_ID[id]?BY_ID[id].price:0)*q;
    });
    count += state.custom.length; // каждый свой хлеб = 1 позиция
    return { sub:sub, count:count, custom:state.custom.length };
  }

  // ---------- рендер карточек ----------
  function renderCards(){
    var box = $('[data-cards]');
    box.innerHTML = ITEMS.map(function(it){
      return ''+
      '<article class="card" data-card data-id="'+it.id+'">'+
        '<div class="card-media">'+
          '<img src="'+it.img+'" alt="'+esc(it.name)+'">'+
          '<div class="card-media-veil"></div>'+
          (it.tag ? '<span class="card-tag">'+esc(it.tag)+'</span>' : '')+
        '</div>'+
        '<div class="card-body">'+
          '<div class="card-top">'+
            '<h3 class="card-name">'+esc(it.name)+'</h3>'+
            '<span class="card-weight">'+esc(it.weight)+'</span>'+
          '</div>'+
          '<p class="card-desc">'+esc(it.desc)+'</p>'+
          '<div class="card-foot">'+
            '<span class="card-price">'+fmt(it.price)+'</span>'+
            '<button class="card-add" data-add="'+it.id+'">'+
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg>В корзину'+
            '</button>'+
          '</div>'+
        '</div>'+
      '</article>';
    }).join('');
  }

  // ---------- рендер корзины ----------
  function customSummary(c){
    // короткая строка состава для отображения
    var parts = [];
    if(c.gluten==='Без глютена') parts.push('без глютена');
    if(c.flours && c.flours.length) parts.push(c.flours.join(', ').toLowerCase());
    if(c.addons && c.addons.length) parts.push(c.addons.join(', ').toLowerCase());
    if(c.size) parts.push(c.size.toLowerCase());
    return parts.join(' · ') || 'базовый состав';
  }
  function renderCart(){
    var t = totals();
    var badge = $('[data-cart-badge]');
    if(t.count>0){ badge.hidden=false; badge.textContent=t.count; } else { badge.hidden=true; }
    $('[data-cart-count-label]').textContent = t.count>0 ? (t.count+' '+plural(t.count)) : 'пусто';

    var empty = $('[data-cart-empty]');
    var linesBox = $('[data-cart-lines]');
    var html = '';

    // обычные товары
    Object.keys(state.cart).forEach(function(id){
      var it=BY_ID[id], q=state.cart[id];
      html += ''+
      '<div class="cart-line">'+
        '<img src="'+it.img+'" alt="'+esc(it.name)+'">'+
        '<div class="cart-line-main">'+
          '<div class="cart-line-top">'+
            '<h4 class="cart-line-name">'+esc(it.name)+'</h4>'+
            '<button class="cart-line-remove" data-remove="'+id+'">убрать</button>'+
          '</div>'+
          '<div class="cart-line-meta">'+fmt(it.price)+' \u00b7 '+esc(it.weight)+'</div>'+
          '<div class="cart-line-qtyrow">'+
            '<div class="qty">'+
              '<button data-dec="'+id+'">\u2212</button>'+
              '<span>'+q+'</span>'+
              '<button data-inc="'+id+'">+</button>'+
            '</div>'+
            '<span class="cart-line-sum">'+fmt(it.price*q)+'</span>'+
          '</div>'+
        '</div>'+
      '</div>';
    });

    // свои хлеба (без цены)
    state.custom.forEach(function(c, i){
      html += ''+
      '<div class="cart-line cart-line-custom">'+
        '<div class="cart-line-emoji">\ud83e\udd56</div>'+
        '<div class="cart-line-main">'+
          '<div class="cart-line-top">'+
            '<h4 class="cart-line-name">Свой хлеб</h4>'+
            '<button class="cart-line-remove" data-remove-custom="'+i+'">убрать</button>'+
          '</div>'+
          '<div class="cart-line-meta">'+esc(customSummary(c))+'</div>'+
          '<div class="cart-line-qtyrow">'+
            '<span class="cart-line-note">Цена по согласованию</span>'+
          '</div>'+
        '</div>'+
      '</div>';
    });

    if(t.count===0){ empty.style.display=''; linesBox.innerHTML=''; }
    else { empty.style.display='none'; linesBox.innerHTML=html; }

    // суммы
    var hasPriced = t.sub>0;
    $('[data-subtotal]').textContent = hasPriced ? fmt(t.sub) : '—';
    var totalEl = $('[data-total]');
    if(t.custom>0 && hasPriced){ totalEl.textContent = fmt(t.sub)+' + свой хлеб'; }
    else if(t.custom>0){ totalEl.textContent = 'по согласованию'; }
    else { totalEl.textContent = fmt(t.sub); }

    var btn = $('[data-checkout-btn]');
    btn.textContent = state.step==='form' ? 'Отправить заказ' : 'Оформить заказ';
  }

  // ---------- корзина: операции ----------
  function addToCart(id, ev){
    flyToCart(ev);
    state.cart[id] = (state.cart[id]||0)+1;
    renderCart();
    bumpCart();
    var it = BY_ID[id];
    showToast((it?it.name:'Хлеб')+' в корзине');
  }
  function inc(id){ state.cart[id]=(state.cart[id]||0)+1; renderCart(); }
  function dec(id){ var q=(state.cart[id]||0)-1; if(q<=0) delete state.cart[id]; else state.cart[id]=q; renderCart(); }
  function removeItem(id){ delete state.cart[id]; renderCart(); }
  function removeCustom(i){ state.custom.splice(i,1); renderCart(); }
  function addCustom(spec){
    state.custom.push(spec);
    renderCart();
    bumpCart();
    showToast('Свой хлеб в корзине');
  }

  // ---------- drawer ----------
  function openDrawer(){
    $('[data-drawer]').classList.add('open');
    $('[data-scrim]').classList.add('open');
  }
  function closeDrawer(){
    $('[data-drawer]').classList.remove('open');
    $('[data-scrim]').classList.remove('open');
    setStep('cart');
  }
  function setStep(step){
    state.step = step;
    $('[data-step-cart]').hidden = step!=='cart';
    $('[data-step-form]').hidden = step!=='form';
    renderCart();
  }

  // ---------- checkout ----------
  function checkout(){
    var t = totals();
    if(t.count===0){ openDrawer(); return; }
    if(state.step==='cart'){ setStep('form'); return; }
    // step === 'form' -> валидация и отправка
    sendOrder();
  }

  function validateForm(){
    var name = $('[data-field="name"]').value.trim();
    var phone = $('[data-field="phone"]').value.trim();
    var addrField = $('[data-address-field]');
    var address = $('[data-field="address"]').value.trim();
    var err = $('[data-form-error]');
    var problems = [];
    setInvalid('name', false); setInvalid('phone', false); setInvalid('address', false);

    if(name.length<2){ problems.push('имя'); setInvalid('name', true); }
    var digits = phone.replace(/\D/g,'');
    if(digits.length<10){ problems.push('телефон'); setInvalid('phone', true); }
    if(state.method==='Доставка такси' && address.length<5){ problems.push('адрес'); setInvalid('address', true); }

    if(problems.length){
      err.hidden=false;
      err.textContent = 'Заполните: '+problems.join(', ')+'.';
      return null;
    }
    err.hidden=true;
    return {
      name:name, phone:phone,
      method:state.method,
      address:state.method==='Доставка такси' ? address : '',
      comment: $('[data-field="comment"]').value.trim()
    };
  }
  function setInvalid(field, on){
    var el = $('[data-field="'+field+'"]');
    if(el && el.closest('.field')) el.closest('.field').classList.toggle('invalid', !!on);
  }

  function buildMessage(form){
    var t = totals();
    var lines = ['\ud83e\udd56 *Новый заказ — Тёплый хлеб*', ''];

    Object.keys(state.cart).forEach(function(id){
      var it=BY_ID[id], q=state.cart[id];
      lines.push('• '+it.name+' — '+q+' \u00d7 '+fmt(it.price)+' = '+fmt(it.price*q));
    });

    if(state.custom.length){
      if(Object.keys(state.cart).length) lines.push('');
      state.custom.forEach(function(c, i){
        lines.push('\ud83e\udd56 *Свой хлеб #'+(i+1)+'* (цена по согласованию)');
        if(c.gluten) lines.push('   — '+c.gluten);
        if(c.flours && c.flours.length) lines.push('   — Мука: '+c.flours.join(', '));
        if(c.addons && c.addons.length) lines.push('   — Добавки: '+c.addons.join(', '));
        if(c.size) lines.push('   — Размер: '+c.size);
        if(c.wishes) lines.push('   — Пожелания: '+c.wishes);
      });
    }

    lines.push('');
    if(t.sub>0) lines.push('Готовые позиции: '+fmt(t.sub));
    if(state.custom.length) lines.push('Свой хлеб ('+state.custom.length+' шт.): цена по согласованию');
    lines.push('');
    lines.push('\ud83d\udc64 Имя: '+form.name);
    lines.push('\ud83d\udcde Телефон: '+form.phone);
    lines.push('\ud83d\ude9a Получение: '+form.method);
    if(form.address) lines.push('\ud83d\udccd Адрес: '+form.address);
    if(form.comment) lines.push('\ud83d\udcac Комментарий: '+form.comment);
    return lines.join('\n');
  }

  function sendOrder(){
    var form = validateForm();
    if(!form) return;

    var btn = $('[data-checkout-btn]');
    btn.disabled = true;
    btn.textContent = 'Отправляем…';

    var token = CFG.BOT_TOKEN;
    var chatId = CFG.CHAT_ID;
    var configured = token && chatId && token.indexOf('ВСТАВЬТЕ')<0 && String(chatId).indexOf('ВСТАВЬТЕ')<0;

    var text = buildMessage(form);

    function done(ok){
      btn.disabled = false;
      btn.textContent = 'Отправить заказ';
      closeDrawer();
      showSuccess(ok);
      if(ok){ state.cart={}; state.custom=[]; renderCart(); }
    }

    if(!configured){
      // Telegram ещё не настроен — показываем демо-успех, но честно об этом сообщаем
      console.warn('Telegram не настроен: заполните BOT_TOKEN и CHAT_ID в config.js');
      done('demo');
      return;
    }

    var url = 'https://api.telegram.org/bot'+token+'/sendMessage';
    fetch(url, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ chat_id: chatId, text: text, parse_mode:'Markdown' })
    })
    .then(function(r){ return r.json(); })
    .then(function(res){
      if(res && res.ok){ done(true); }
      else { console.error('Telegram error:', res); done(false); }
    })
    .catch(function(e){ console.error('Network error:', e); done(false); });
  }

  // ---------- success modal ----------
  function showSuccess(kind){
    var scrim = $('[data-success]');
    var emoji = $('[data-success-emoji]');
    var title = $('[data-success-title]');
    var text  = $('[data-success-text]');
    if(kind===true){
      emoji.textContent='\ud83e\udd50';
      title.textContent='Заказ отправлен!';
      text.textContent='Мы получили ваш заказ и свяжемся по телефону, чтобы подтвердить состав, цену, время и способ получения.';
    } else if(kind==='demo'){
      emoji.textContent='\ud83e\udd50';
      title.textContent='Заказ собран!';
      text.textContent='Это демо-режим: отправка в Telegram ещё не настроена. Чтобы заказы приходили в чат, заполните BOT_TOKEN и CHAT_ID в файле config.js.';
    } else {
      emoji.textContent='\u26a0\ufe0f';
      title.textContent='Не удалось отправить';
      text.textContent='Что-то пошло не так при отправке. Проверьте интернет и попробуйте ещё раз, или напишите нам напрямую.';
    }
    scrim.classList.add('open');
  }
  function closeSuccess(){ $('[data-success]').classList.remove('open'); }

  // ---------- toast ----------
  var toastT;
  function showToast(msg){
    var el = $('[data-toast]');
    $('[data-toast-text]').textContent = msg;
    el.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(function(){ el.classList.remove('show'); }, 2000);
  }

  // ---------- анимации ----------
  function bumpCart(){
    var b = $('[data-cart-btn]');
    if(b && b.animate){ b.animate([{transform:'scale(1)'},{transform:'scale(1.14)'},{transform:'scale(1)'}],{duration:380,easing:'ease-out'}); }
  }
  function flyToCart(ev){
    try{
      var card = ev.currentTarget.closest('[data-card]');
      var img = card && card.querySelector('img');
      var cart = $('[data-cart-btn]');
      if(!img || !cart || !img.animate) return;
      var r1 = img.getBoundingClientRect();
      var r2 = cart.getBoundingClientRect();
      var c = img.cloneNode(true);
      Object.assign(c.style,{position:'fixed',left:r1.left+'px',top:r1.top+'px',width:r1.width+'px',height:r1.height+'px',objectFit:'cover',borderRadius:'18px',zIndex:9999,pointerEvents:'none',margin:0});
      document.body.appendChild(c);
      var dx=(r2.left+r2.width/2)-(r1.left+r1.width/2);
      var dy=(r2.top+r2.height/2)-(r1.top+r1.height/2);
      var a=c.animate([
        {transform:'translate(0,0) scale(1)',opacity:1},
        {transform:'translate('+(dx*0.5)+'px,'+(dy*0.5-60)+'px) scale(0.6)',opacity:.9,offset:.6},
        {transform:'translate('+dx+'px,'+dy+'px) scale(0.05)',opacity:.2}
      ],{duration:780,easing:'cubic-bezier(.5,0,.2,1)'});
      a.onfinish=function(){ c.remove(); };
    }catch(e){}
  }

  // ---------- навигация ----------
  function scrollToEl(el){
    if(!el) return;
    var y = el.getBoundingClientRect().top + window.scrollY - 64;
    window.scrollTo({ top:y, behavior:'smooth' });
  }
  function goTop(){ window.scrollTo({ top:0, behavior:'smooth' }); }

  // ---------- мобильное меню (бургер) ----------
  function setMenu(open){
    document.body.classList.toggle('menu-open', open);
    var b = $('[data-action="toggleMenu"]');
    if(b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
    var m = $('[data-mobile-menu]');
    if(m) m.setAttribute('aria-hidden', open ? 'false' : 'true');
  }
  function toggleMenu(){ setMenu(!document.body.classList.contains('menu-open')); }
  function closeMenu(){ setMenu(false); }

  // ---------- конструктор «Собери свой хлеб» ----------
  function collectAndAddCustom(){
    var root = $('[data-build]');
    var flours = [];
    root.querySelectorAll('[data-group="flour"] [data-chip].is-on').forEach(function(c){ flours.push(c.getAttribute('data-val')); });
    var addons = [];
    root.querySelectorAll('[data-group="addon"] [data-chip].is-on').forEach(function(c){ addons.push(c.getAttribute('data-val')); });
    var sizeEl = root.querySelector('[data-group="size"] [data-chip].is-on');
    var size = sizeEl ? sizeEl.getAttribute('data-val') : '';
    var gluten = root.querySelector('[data-gluten-toggle].is-on') ? 'Без глютена' : '';
    var wishes = root.querySelector('[data-build-wishes]').value.trim();

    var err = root.querySelector('[data-build-error]');
    if(flours.length===0 && addons.length===0 && !gluten && !size && !wishes){
      err.hidden=false;
      err.textContent='Выберите хотя бы один параметр — муку, добавку, размер или опишите пожелание.';
      return;
    }
    err.hidden=true;

    addCustom({ gluten:gluten, flours:flours, addons:addons, size:size, wishes:wishes });

    // сброс конструктора
    root.querySelectorAll('[data-chip].is-on').forEach(function(c){ c.classList.remove('is-on'); });
    var g = root.querySelector('[data-gluten-toggle]'); if(g) g.classList.remove('is-on');
    root.querySelector('[data-build-wishes]').value='';
    openDrawer();
  }

  var ACTIONS = {
    goTop: goTop,
    navAssort: function(){ scrollToEl(document.getElementById('sec-assort')); },
    navBuild: function(){ scrollToEl(document.getElementById('sec-build')); },
    navWhy: function(){ scrollToEl(document.getElementById('sec-why')); },
    navHow: function(){ scrollToEl(document.getElementById('sec-how')); },
    navDelivery: function(){ scrollToEl(document.getElementById('sec-delivery')); },
    openDrawer: openDrawer,
    closeDrawer: closeDrawer,
    checkout: checkout,
    backToCart: function(){ setStep('cart'); },
    closeSuccess: closeSuccess,
    toggleMenu: toggleMenu,
    closeMenu: closeMenu
  };

  // ---------- эффекты появления / счётчики / хедер / ротатор ----------
  function setupReveal(){
    var els = document.querySelectorAll('[data-reveal]');
    if(!('IntersectionObserver' in window)){ els.forEach(function(e){ e.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){
          var d = parseInt(en.target.getAttribute('data-reveal-delay')||'0',10);
          setTimeout(function(){ en.target.classList.add('is-in'); }, d);
          io.unobserve(en.target);
        }
      });
    },{ threshold:.14 });
    els.forEach(function(e){ io.observe(e); });
  }
  function setupCounters(){
    var nums = document.querySelectorAll('[data-count]');
    if(!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(!en.isIntersecting) return;
        var el=en.target, target=parseFloat(el.getAttribute('data-count')), suffix=el.getAttribute('data-suffix')||'';
        var dur=1100, t0=null;
        function tick(ts){ if(!t0)t0=ts; var p=Math.min((ts-t0)/dur,1); var v=Math.round(target*(1-Math.pow(1-p,3))); el.textContent=v+suffix; if(p<1) requestAnimationFrame(tick); }
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    },{ threshold:.5 });
    nums.forEach(function(n){ io.observe(n); });
  }
  function setupScrollHeader(){
    var h = document.getElementById('header');
    function on(){ if(window.scrollY>40) h.classList.add('scrolled'); else h.classList.remove('scrolled'); }
    window.addEventListener('scroll', on, { passive:true }); on();
  }
  function setupStoreRotator(){
    var stores=['Пятёрочки?','Перекрёстка?','Азбуки вкуса?','Магнита?'];
    var el=$('[data-store-label]'); var i=0;
    setInterval(function(){ i=(i+1)%stores.length; el.textContent=stores[i]; }, 2400);
  }

  // ---------- делегирование кликов ----------
  function bindEvents(){
    document.addEventListener('click', function(ev){
      var t = ev.target;
      var addBtn = t.closest('[data-add]');
      if(addBtn){ addToCart(addBtn.getAttribute('data-add'), { currentTarget:addBtn }); return; }
      var inc2 = t.closest('[data-inc]'); if(inc2){ inc(inc2.getAttribute('data-inc')); return; }
      var dec2 = t.closest('[data-dec]'); if(dec2){ dec(dec2.getAttribute('data-dec')); return; }
      var rem = t.closest('[data-remove]'); if(rem){ removeItem(rem.getAttribute('data-remove')); return; }
      var remC = t.closest('[data-remove-custom]'); if(remC){ removeCustom(parseInt(remC.getAttribute('data-remove-custom'),10)); return; }

      // конструктор: выбор муки/добавок (мультивыбор) и размера (одиночный)
      var chip = t.closest('[data-chip]');
      if(chip){
        if(chip.getAttribute('data-single')!=null){
          // размер — одиночный выбор внутри своей группы
          var grp = chip.parentNode;
          grp.querySelectorAll('[data-chip]').forEach(function(c){ c.classList.toggle('is-on', c===chip); });
        } else {
          chip.classList.toggle('is-on');
        }
        return;
      }
      var glutenBtn = t.closest('[data-gluten-toggle]');
      if(glutenBtn){ glutenBtn.classList.toggle('is-on'); return; }
      var buildAdd = t.closest('[data-build-add]');
      if(buildAdd){ collectAndAddCustom(); return; }
      var seg = t.closest('[data-method]');
      if(seg){
        state.method = seg.getAttribute('data-method');
        document.querySelectorAll('.seg-btn').forEach(function(b){ b.classList.toggle('is-active', b===seg); });
        $('[data-address-field]').hidden = state.method!=='Доставка такси';
        return;
      }
      var act = t.closest('[data-action]');
      if(act){
        var name = act.getAttribute('data-action');
        if(ACTIONS[name]) ACTIONS[name]();
        // любой переход по меню (кроме самого тоггла) закрывает бургер
        if(name!=='toggleMenu') closeMenu();
        return;
      }
    });
    // клик внутри success-карточки не закрывает её (закрывают только кнопка и фон)
    $('[data-success-card]').addEventListener('click', function(e){
      if(!e.target.closest('[data-action="closeSuccess"]')) e.stopPropagation();
    });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape'){ closeDrawer(); closeSuccess(); closeMenu(); } });
  }

  // ---------- init ----------
  function init(){
    document.getElementById('root').style.setProperty('--gold', CFG.ACCENT || '#c9a25f');
    renderCards();
    renderCart();
    bindEvents();
    setupReveal();
    setupCounters();
    setupScrollHeader();
    setupStoreRotator();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
