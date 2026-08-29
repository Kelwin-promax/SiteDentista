/* =========================================================
   Kelwin Odontologia — main.js
   ========================================================= */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------- toast ---------------- */
  var toastEl = $('#toast');
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3600);
  }

  /* ---------------- ano no rodapé ---------------- */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- navegação ---------------- */
  var nav = $('#nav'), menu = $('#menu'), burger = $('#burger');

  window.addEventListener('scroll', function () {
    nav.classList.toggle('is-stuck', window.scrollY > 10);
  }, { passive: true });

  burger.addEventListener('click', function () {
    var open = menu.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  });

  $$('#menu a').forEach(function (a) {
    a.addEventListener('click', function () {
      menu.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------------- reveal on scroll ---------------- */
  var revealables = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------------- contadores ---------------- */
  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el = e.target, target = parseInt(el.dataset.count, 10), t0 = null, dur = 1500;
        function tick(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased).toLocaleString('pt-BR');
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---------------- planos: mensal / anual ---------------- */
  var planSwitch = $('#planSwitch');
  if (planSwitch) {
    planSwitch.addEventListener('click', function (ev) {
      var btn = ev.target.closest('.switch__opt');
      if (!btn) return;
      $$('.switch__opt', planSwitch).forEach(function (b) { b.classList.remove('is-on'); });
      btn.classList.add('is-on');
      var cycle = btn.dataset.cycle;
      $$('.plan__price .val').forEach(function (v) {
        v.textContent = v.dataset[cycle];
      });
      $$('.plan__price .per').forEach(function (p) {
        if (!p.dataset.base) p.dataset.base = p.textContent;
        p.textContent = p.dataset.base + (cycle === 'anual' ? ' · pago 1x ao ano' : '');
      });
      toast(cycle === 'anual'
        ? 'Valores no plano anual: 20% de desconto aplicado.'
        : 'Valores na cobrança mensal.');
    });
  }

  /* ---------------- botões dos planos ---------------- */
  $$('.js-plan').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var plano = btn.dataset.plan;
      var radio = $('input[name="servico"][value="Assinatura de plano"]');
      if (radio) radio.checked = true;
      var conv = $('#fConv');
      if (conv) {
        var alvo = 'Assinante Kelwin — ' + plano;
        $$('option', conv).forEach(function (o) { if (o.value === alvo || o.textContent === alvo) conv.value = o.value; });
      }
      goToStep(1);
      $('#agendar').scrollIntoView({ behavior: 'smooth' });
      toast('Plano ' + plano + ' selecionado. Escolha um horário para a assinatura.');
    });
  });

  /* ---------------- depoimentos ---------------- */
  var track = $('#testisTrack');
  if (track) {
    var slides = $$('.testi', track), idx = 0, dots = $('#testiDots'), autoTimer;
    slides.forEach(function (_, i) {
      var d = document.createElement('button');
      d.type = 'button';
      d.setAttribute('aria-label', 'Depoimento ' + (i + 1));
      d.addEventListener('click', function () { go(i); });
      dots.appendChild(d);
    });
    function go(i) {
      idx = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(' + (-idx * 100) + '%)';
      $$('button', dots).forEach(function (d, j) { d.classList.toggle('is-on', j === idx); });
      restart();
    }
    function restart() {
      clearInterval(autoTimer);
      autoTimer = setInterval(function () { go(idx + 1); }, 7000);
    }
    $('#testiNext').addEventListener('click', function () { go(idx + 1); });
    $('#testiPrev').addEventListener('click', function () { go(idx - 1); });
    go(0);
  }

  /* =========================================================
     AGENDAMENTO
     ========================================================= */
  var STORE_KEY = 'kelwin_odonto_agendamentos';
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
    'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

  var state = { date: null, time: null };

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
    catch (e) { return []; }
  }
  function save(list) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch (e) { /* modo privado */ }
  }
  function key(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function fmtLong(d) {
    return DIAS[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()] + ' de ' + d.getFullYear();
  }
  function fmtShort(d) {
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  }
  /* hash determinístico: o mesmo dia mostra sempre a mesma agenda */
  function hash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) % 100000; }
    return h;
  }

  /* --- passos --- */
  var stepsNav = $$('#bookingSteps li');
  var steps = $$('.step');
  var current = 1;

  function goToStep(n) {
    current = n;
    steps.forEach(function (s) { s.classList.toggle('is-active', +s.dataset.step === n); });
    stepsNav.forEach(function (li, i) {
      li.classList.toggle('is-active', i + 1 === n);
      li.classList.toggle('is-done', i + 1 < n);
    });
    if (n === 3) renderResume();
  }

  $$('.js-next').forEach(function (b) {
    b.addEventListener('click', function () {
      if (current === 2 && (!state.date || !state.time)) {
        toast('Escolha uma data e um horário para continuar.');
        return;
      }
      goToStep(current + 1);
      $('#booking').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  $$('.js-prev').forEach(function (b) {
    b.addEventListener('click', function () {
      goToStep(current - 1);
      $('#booking').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* --- calendário --- */
  var calGrid = $('#calGrid'), calLabel = $('#calLabel');
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var view = new Date(today.getFullYear(), today.getMonth(), 1);
  var maxMonth = new Date(today.getFullYear(), today.getMonth() + 4, 1);

  function isClosed(d) { return d.getDay() === 0; } /* domingo: só urgência */

  function renderCal() {
    calLabel.textContent = MESES[view.getMonth()] + ' ' + view.getFullYear();
    calGrid.innerHTML = '';
    var first = new Date(view.getFullYear(), view.getMonth(), 1);
    var total = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();

    for (var b = 0; b < first.getDay(); b++) {
      var blank = document.createElement('span');
      blank.className = 'cal__day is-empty';
      calGrid.appendChild(blank);
    }
    for (var d = 1; d <= total; d++) {
      var date = new Date(view.getFullYear(), view.getMonth(), d);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cal__day';
      btn.textContent = d;
      var past = date < today;
      btn.disabled = past || isClosed(date);
      if (date.getTime() === today.getTime()) btn.classList.add('is-today');
      if (state.date && key(date) === key(state.date)) btn.classList.add('is-sel');
      btn.dataset.date = key(date);
      btn.addEventListener('click', pickDay);
      calGrid.appendChild(btn);
    }
    $('#calPrev').disabled = view.getFullYear() === today.getFullYear() && view.getMonth() === today.getMonth();
    $('#calNext').disabled = view >= maxMonth;
  }

  function pickDay(ev) {
    var parts = ev.currentTarget.dataset.date.split('-');
    state.date = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    state.time = null;
    renderCal();
    renderSlots();
    $('#toStep3').disabled = true;
  }

  $('#calPrev').addEventListener('click', function () {
    view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
    renderCal();
  });
  $('#calNext').addEventListener('click', function () {
    view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
    renderCal();
  });

  /* --- horários --- */
  var slotsGrid = $('#slotsGrid'), slotsTitle = $('#slotsTitle');

  function baseSlots(d) {
    var sat = d.getDay() === 6;
    var list = ['08:00', '08:40', '09:20', '10:00', '10:40', '11:20'];
    if (!sat) {
      list = list.concat(['13:00', '13:40', '14:20', '15:00', '15:40', '16:20', '17:00', '17:40', '18:20']);
    } else {
      list = list.concat(['12:00', '12:40']);
    }
    return list;
  }

  function takenSlots(d) {
    var k = key(d), taken = {};
    var h = hash(k);
    var all = baseSlots(d);
    var qtd = 3 + (h % 5);
    for (var i = 0; i < qtd; i++) {
      taken[all[(h * (i + 3) + i * 7) % all.length]] = true;
    }
    load().forEach(function (b) { if (b.dateKey === k) taken[b.time] = true; });
    return taken;
  }

  function renderSlots() {
    if (!state.date) return;
    slotsTitle.textContent = 'Horários para ' + fmtLong(state.date);
    var taken = takenSlots(state.date);
    var now = new Date();
    slotsGrid.innerHTML = '';
    var livres = 0;

    baseSlots(state.date).forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'slot';
      b.textContent = t;
      var passed = key(state.date) === key(now) &&
        (now.getHours() * 60 + now.getMinutes()) >= (+t.slice(0, 2) * 60 + +t.slice(3));
      b.disabled = !!taken[t] || passed;
      if (!b.disabled) livres++;
      b.addEventListener('click', function () {
        state.time = t;
        $$('.slot', slotsGrid).forEach(function (s) { s.classList.remove('is-sel'); });
        b.classList.add('is-sel');
        $('#toStep3').disabled = false;
      });
      slotsGrid.appendChild(b);
    });

    if (!livres) {
      slotsGrid.innerHTML = '<p class="slots__empty">Esse dia está lotado. Escolha outra data ou ligue para o plantão: (11) 4002-8922.</p>';
    }
  }

  /* --- resumo do passo 3 --- */
  function currentService() { return ($('input[name="servico"]:checked') || {}).value || '—'; }
  function currentPro() { return ($('input[name="profissional"]:checked') || {}).value || '—'; }

  function renderResume() {
    var r = $('#resume');
    if (!r) return;
    r.innerHTML =
      '<span><b>Tratamento:</b> ' + currentService() + '</span>' +
      '<span><b>Profissional:</b> ' + currentPro() + '</span>' +
      '<span><b>Quando:</b> ' + (state.date ? fmtShort(state.date) : '—') + ' às ' + (state.time || '—') + '</span>';
  }

  /* --- máscara de telefone --- */
  var tel = $('#fTel');
  tel.addEventListener('input', function () {
    var v = tel.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6) tel.value = '(' + v.slice(0, 2) + ') ' + v.slice(2, v.length > 10 ? 7 : 6) + '-' + v.slice(v.length > 10 ? 7 : 6);
    else if (v.length > 2) tel.value = '(' + v.slice(0, 2) + ') ' + v.slice(2);
    else if (v.length) tel.value = '(' + v;
    else tel.value = '';
  });

  function setErr(input, msg) {
    var field = input.closest('.field');
    if (!field) return;
    field.classList.toggle('is-err', !!msg);
    var em = $('.err', field);
    if (em) em.textContent = msg || '';
  }

  function validateStep3() {
    var ok = true;
    var nome = $('#fNome'), email = $('#fEmail'), lgpd = $('#fLgpd');

    if (nome.value.trim().length < 3) { setErr(nome, 'Digite seu nome completo.'); ok = false; }
    else setErr(nome, '');

    var digits = tel.value.replace(/\D/g, '');
    if (digits.length < 10) { setErr(tel, 'Informe um WhatsApp com DDD.'); ok = false; }
    else setErr(tel, '');

    if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
      setErr(email, 'E-mail inválido.'); ok = false;
    } else setErr(email, '');

    if (!lgpd.checked) { toast('É preciso autorizar o contato para concluir.'); ok = false; }
    return ok;
  }

  /* --- envio --- */
  var lastBooking = null;

  $('#bookingForm').addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (!state.date || !state.time) { toast('Volte e escolha data e horário.'); goToStep(2); return; }
    if (!validateStep3()) return;

    var booking = {
      id: 'KO' + Date.now().toString(36).toUpperCase().slice(-6),
      servico: currentService(),
      profissional: currentPro(),
      dateKey: key(state.date),
      dataLonga: fmtLong(state.date),
      dataCurta: fmtShort(state.date),
      time: state.time,
      nome: $('#fNome').value.trim(),
      tel: tel.value,
      email: $('#fEmail').value.trim(),
      convenio: $('#fConv').value,
      obs: $('#fObs').value.trim()
    };

    var list = load();
    list.push(booking);
    save(list);
    lastBooking = booking;

    $('#doneText').textContent = booking.nome.split(' ')[0] +
      ', sua vaga está reservada. Enviamos os detalhes para o WhatsApp ' + booking.tel + '.';

    $('#doneCard').innerHTML =
      row('Protocolo', booking.id) +
      row('Tratamento', booking.servico) +
      row('Profissional', booking.profissional) +
      row('Data', booking.dataLonga) +
      row('Horário', booking.time) +
      row('Convênio', booking.convenio) +
      row('Local', 'Av. das Acácias, 1420 — 4º andar');

    var msg = 'Olá! Confirmando meu agendamento na Kelwin Odontologia.%0A' +
      'Protocolo: ' + booking.id + '%0A' +
      'Nome: ' + encodeURIComponent(booking.nome) + '%0A' +
      'Tratamento: ' + encodeURIComponent(booking.servico) + '%0A' +
      'Profissional: ' + encodeURIComponent(booking.profissional) + '%0A' +
      'Data: ' + encodeURIComponent(booking.dataCurta + ' às ' + booking.time);
    $('#waBtn').href = 'https://wa.me/5511940028922?text=' + msg;

    goToStep(4);
    renderMine();
    renderSlots();
    $('#booking').scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast('Agendamento ' + booking.id + ' confirmado!');
  });

  function row(k, v) {
    return '<div><span>' + k + '</span><b>' + v + '</b></div>';
  }

  /* --- arquivo .ics --- */
  $('#icsBtn').addEventListener('click', function () {
    if (!lastBooking) return;
    var p = lastBooking.dateKey.split('-');
    var h = lastBooking.time.split(':');
    var start = new Date(+p[0], +p[1] - 1, +p[2], +h[0], +h[1]);
    var end = new Date(start.getTime() + 60 * 60 * 1000);

    function z(n) { return String(n).padStart(2, '0'); }
    function stamp(d) {
      return d.getFullYear() + z(d.getMonth() + 1) + z(d.getDate()) + 'T' +
        z(d.getHours()) + z(d.getMinutes()) + '00';
    }

    var ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kelwin Odontologia//PT-BR',
      'BEGIN:VEVENT',
      'UID:' + lastBooking.id + '@kelwinodontologia.com.br',
      'DTSTAMP:' + stamp(new Date()),
      'DTSTART:' + stamp(start),
      'DTEND:' + stamp(end),
      'SUMMARY:' + lastBooking.servico + ' - Kelwin Odontologia',
      'DESCRIPTION:Protocolo ' + lastBooking.id + ' com ' + lastBooking.profissional +
      '. Chegue 10 minutos antes.',
      'LOCATION:Av. das Acacias 1420 - 4 andar - Jardim Paulista - Sao Paulo/SP',
      'BEGIN:VALARM', 'TRIGGER:-PT24H', 'ACTION:DISPLAY',
      'DESCRIPTION:Consulta amanha na Kelwin Odontologia', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');

    var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'consulta-' + lastBooking.id + '.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast('Arquivo de calendário baixado.');
  });

  /* --- novo agendamento --- */
  $('#newBtn').addEventListener('click', function () {
    state = { date: null, time: null };
    $('#bookingForm').reset();
    $$('.field').forEach(function (f) { f.classList.remove('is-err'); });
    slotsGrid.innerHTML = '<p class="slots__empty">Os horários aparecem aqui depois que você escolher a data.</p>';
    slotsTitle.textContent = 'Selecione um dia ao lado';
    $('#toStep3').disabled = true;
    renderCal();
    goToStep(1);
  });

  /* --- meus agendamentos (localStorage) --- */
  function renderMine() {
    var box = $('#myBookings');
    var list = load().filter(function (b) {
      var p = b.dateKey.split('-');
      return new Date(+p[0], +p[1] - 1, +p[2]) >= today;
    }).sort(function (a, b) { return a.dateKey.localeCompare(b.dateKey); });

    if (!list.length) { box.innerHTML = ''; return; }

    box.innerHTML = '<h5>Suas consultas neste dispositivo</h5>' + list.map(function (b) {
      return '<div class="mine__row"><div><b>' + b.dataCurta + ' · ' + b.time + '</b>' +
        '<small>' + b.servico + '</small></div>' +
        '<button type="button" class="mine__del" data-id="' + b.id + '" title="Cancelar" aria-label="Cancelar consulta ' + b.id + '">×</button></div>';
    }).join('');

    $$('.mine__del', box).forEach(function (btn) {
      btn.addEventListener('click', function () {
        save(load().filter(function (b) { return b.id !== btn.dataset.id; }));
        renderMine();
        if (state.date) renderSlots();
        toast('Consulta cancelada. Se quiser, agende outro horário.');
      });
    });
  }

  /* --- inicialização do agendamento --- */
  renderCal();
  renderMine();
  $$('input[name="servico"], input[name="profissional"]').forEach(function (i) {
    i.addEventListener('change', renderResume);
  });

  /* ---------------- formulário de contato ---------------- */
  var cForm = $('#contactForm');
  cForm.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var ok = true;
    $$('input, textarea', cForm).forEach(function (i) {
      if (i.hasAttribute('required') && !i.value.trim()) {
        setErr(i, 'Campo obrigatório.'); ok = false;
      } else setErr(i, '');
    });
    if (!ok) return;
    cForm.reset();
    $('#contactOk').hidden = false;
    toast('Mensagem enviada! Respondemos em até 1 hora útil.');
    setTimeout(function () { $('#contactOk').hidden = true; }, 8000);
  });

  /* ---------------- newsletter ---------------- */
  var news = $('#newsForm');
  news.addEventListener('submit', function (ev) {
    ev.preventDefault();
    news.reset();
    $('#newsOk').hidden = false;
    toast('Pronto! Você vai receber nossas dicas de prevenção.');
  });

  /* ---------------- FAQ: um aberto por vez ---------------- */
  $$('#faqList .qa').forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      $$('#faqList .qa').forEach(function (o) { if (o !== d) o.open = false; });
    });
  });

})();
