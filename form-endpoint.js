/**
 * ⚙️ КОНФИГ ФОРМЫ — куда уходят заявки с лендинга.
 *
 * Подключён ГОТОВЫЙ Google-релей (тот же, что у хэллоуинского лендинга):
 * пишет заявку в Google-таблицу (лист «Заявки») и шлёт уведомление в MAX
 * владельцу. Своего бэкенда не требуется — токен бота хранится в Google,
 * секретов в этом файле нет.
 *
 * Чтобы принимать заявки на собственный сервер (например, встроенный
 * /api/leads в node-версии), замените URL на "" — форма вернётся к /api/leads.
 *
 * ВЕРСИЯ 3 (21.11.2026):
 *   — fetch-обёртка не активируется при пустом endpoint (раньше пустая строка
 *     матchилась с любым URL и подставляла clientIP во все POST подряд);
 *   — ipify запрашивается с таймаутом 4 с (раньше мог висеть до таймаута браузера);
 *   — при сбое ipify заявка всё равно уходит, просто без IP (как и было).
 */
window.__LEADS_ENDPOINT__ =
  "https://script.google.com/macros/s/AKfycbxXS2qH5QB8RUhq438_Vs6PMYO7vnef-V_N9Lzbl8M_hs2KcERSOPNKXEKXPGI_wUVq/exec";

/**
 * ——— антиспам: IP клиента в заявке (добавлено 17.11.2026) ———
 * Тянет внешний IP через ipify и подставляет clientIP в POST к релею;
 * релей (Версия 12+) пишет IP седьмой колонкой листа «Заявки».
 */
(function(){
  try{
    var ipOpts = { cache: 'no-store' };
    try { if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) ipOpts.signal = AbortSignal.timeout(4000); } catch(e){}
    fetch('https://api.ipify.org?format=json', ipOpts)
      .then(function(r){return r.json()})
      .then(function(j){window.__CLIENT_IP__ = (j && j.ip) || '';})
      .catch(function(){window.__CLIENT_IP__ = '';});
  }catch(e){window.__CLIENT_IP__ = '';}
  if(!window.fetch) return;
  if(!window.__LEADS_ENDPOINT__) return; // пустой endpoint — обёртку не вешаем (иначе матч на любой URL)
  var origFetch = window.fetch;
  window.fetch = function(input, init){
    try{
      var url = (typeof input === 'string') ? input : (input && input.url) || '';
      if(url.indexOf(window.__LEADS_ENDPOINT__) === 0 && init && typeof init.body === 'string' && window.__CLIENT_IP__){
        try{
          var d = JSON.parse(init.body);
          d.clientIP = window.__CLIENT_IP__;
          init = Object.assign({}, init, {body: JSON.stringify(d)});
        }catch(e){}
      }
    }catch(e){}
    return origFetch.call(this, input, init);
  };
})();
