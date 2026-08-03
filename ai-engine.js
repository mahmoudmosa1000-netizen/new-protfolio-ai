/* ═══════════════════════════════════════════════════════════════
   FOLIO · AI ENGINE
   Lokales & Cloud-KI-Backend — Anthropic / Ollama / LM Studio / OAI-kompatibel
   ───────────────────────────────────────────────────────────────
   Wird von index.html per <script src="ai-engine.js"></script> geladen.
   Stellt global bereit: aiCfg, AI_BACKEND_INFO_ALL, setAIBackend(),
   detectModels(), testLocalAI(), aiCall()
   Abhängigkeiten: keine (nutzt nur fetch + die globalen Helfer
   currentLang / t() / _tr(), falls vom Haupt-Skript vorhanden).
   ═══════════════════════════════════════════════════════════════ */

// ═══ KI-BACKEND CONFIG ═══════════════════════════════════════════
var aiCfg={
  backend:'anthropic',     // 'anthropic'|'ollama'|'lmstudio'|'openai_compat'|'smart'
  url:'http://localhost:11434',
  model:'llama3.2',
  stream:true
};

var AI_BACKEND_INFO_ALL={
  de:{
    anthropic:'☁ Anthropic Claude — beste Qualität, benötigt Internetverbindung.',
    ollama:'🏠 Ollama lokal — vollständig offline, kein API-Key. <a href="https://ollama.com" target="_blank" style="color:var(--teal)">ollama.com</a> installieren → <code>ollama run llama3.2</code> · Dann auf ⟳ Modelle klicken.',
    lmstudio:'⚙ LM Studio — lokale GUI-App mit OpenAI-kompatibler API. <a href="https://lmstudio.ai" target="_blank" style="color:var(--teal)">lmstudio.ai</a> · Server in LM Studio starten (Standard-Port: 1234).',
    openai_compat:'🔌 OpenAI-kompatible API — funktioniert mit Jan.ai, Kobold.cpp, Oobabooga, vLLM, LocalAI und jedem <code>/v1/chat/completions</code> Server.',
    smart:'⚡ Offline-Modus — blitzschnelle Regex-Extraktion, kein KI-Modell, kein Internet. Ideal für strukturierte Lebensläufe.'
  },
  en:{
    anthropic:'☁ Anthropic Claude — best quality, requires internet connection.',
    ollama:'🏠 Local Ollama — fully offline, no API key. Install <a href="https://ollama.com" target="_blank" style="color:var(--teal)">ollama.com</a> → <code>ollama run llama3.2</code> · then click ⟳ Models.',
    lmstudio:'⚙ LM Studio — local GUI app with OpenAI-compatible API. <a href="https://lmstudio.ai" target="_blank" style="color:var(--teal)">lmstudio.ai</a> · start server in LM Studio (default port: 1234).',
    openai_compat:'🔌 OpenAI-compatible API — works with Jan.ai, Kobold.cpp, Oobabooga, vLLM, LocalAI and any <code>/v1/chat/completions</code> server.',
    smart:'⚡ Offline mode — fast regex extraction, no AI model, no internet. Ideal for structured resumes.'
  },
  ar:{
    anthropic:'☁ Anthropic Claude — أفضل جودة، يتطلب اتصال إنترنت.',
    ollama:'🏠 Ollama محلي — يعمل بلا إنترنت، بلا مفتاح API. ثبّت <a href="https://ollama.com" target="_blank" style="color:var(--teal)">ollama.com</a> ← <code>ollama run llama3.2</code> · ثم اضغط ⟳ النماذج.',
    lmstudio:'⚙ LM Studio — تطبيق محلي بواجهة رسومية مع API متوافق مع OpenAI. <a href="https://lmstudio.ai" target="_blank" style="color:var(--teal)">lmstudio.ai</a> · شغّل الخادم في LM Studio (المنفذ الافتراضي: 1234).',
    openai_compat:'🔌 API متوافق مع OpenAI — يعمل مع Jan.ai وKobold.cpp وOobabooga وvLLM وLocalAI وأي خادم <code>/v1/chat/completions</code>.',
    smart:'⚡ الوضع دون اتصال — استخراج سريع بدون نموذج ذكاء اصطناعي أو إنترنت. مثالي للسير الذاتية المنظمة.'
  }
};
var AI_BACKEND_INFO=AI_BACKEND_INFO_ALL.de;

function setAIBackend(b,btn){
  aiCfg.backend=b;
  if(btn){document.querySelectorAll('#ai-backend-opts .ps-btn').forEach(function(x){x.classList.remove('sel');});btn.classList.add('sel');}
  var detail=document.getElementById('ai-backend-detail');
  var infoSet=AI_BACKEND_INFO_ALL[currentLang]||AI_BACKEND_INFO_ALL.de;
  if(detail)detail.innerHTML=infoSet[b]||'';
  var cfg=document.getElementById('ai-local-config');
  var isLocal=b==='ollama'||b==='lmstudio'||b==='openai_compat';
  if(cfg)cfg.style.display=isLocal?'block':'none';
  if(b==='ollama'){
    aiCfg.url='http://localhost:11434';
    var ui=document.getElementById('ai-local-url');if(ui)ui.value=aiCfg.url;
    var sel=document.getElementById('ai-model-select');
    if(sel)sel.innerHTML='<option value="llama3.2">llama3.2</option><option value="mistral">mistral</option><option value="gemma2">gemma2</option><option value="llama3.1">llama3.1</option><option value="phi3">phi3</option><option value="deepseek-r1">deepseek-r1</option><option value="qwen2.5">qwen2.5</option>';
    aiCfg.model='llama3.2';
    setTimeout(detectModels,400);
  }else if(b==='lmstudio'){
    aiCfg.url='http://localhost:1234';
    var ui2=document.getElementById('ai-local-url');if(ui2)ui2.value=aiCfg.url;
    var sel2=document.getElementById('ai-model-select');
    if(sel2)sel2.innerHTML='<option value="local">local (aktiv in LM Studio)</option>';
    aiCfg.model='local';
  }else if(b==='openai_compat'){
    aiCfg.url='http://localhost:8080';
    var ui3=document.getElementById('ai-local-url');if(ui3)ui3.value=aiCfg.url;
  }
}

// ─── Ollama Modell-Auto-Erkennung ────────────────────────────────
async function detectModels(){
  var sel=document.getElementById('ai-model-select');
  var res=document.getElementById('ai-test-result');
  if(res)res.innerHTML=_tr('⟳ Erkenne Modelle...','⟳ Detecting models...','⟳ جارٍ اكتشاف النماذج...');
  try{
    var r=await fetch((aiCfg.url||'http://localhost:11434')+'/api/tags',{signal:AbortSignal.timeout(5000)});
    var d=await r.json();
    var models=(d.models||[]).map(function(m){return m.name;});
    if(models.length){
      if(sel)sel.innerHTML=models.map(function(m){return'<option value="'+m+'"'+(m===aiCfg.model?' selected':'')+'>'+m+'</option>';}).join('');
      if(!aiCfg.model||!models.includes(aiCfg.model))aiCfg.model=models[0];
      if(res)res.innerHTML='✅ '+models.length+_tr(' Modell(e): ',' model(s): ',' نموذج: ')+models.slice(0,4).join(' · ')+(models.length>4?' …':'');
    }else{
      if(res)res.innerHTML=_tr('⚠ Ollama läuft, aber keine Modelle.','⚠ Ollama running but no models.','⚠ Ollama يعمل ولكن لا توجد نماذج.')+' → <code>ollama pull llama3.2</code>';
    }
  }catch(e){
    if(res)res.innerHTML='❌ '+_tr('Ollama nicht erreichbar','Ollama not reachable','Ollama غير متاح')+'('+e.message.slice(0,40)+') → <code>ollama serve</code>';
  }
}

async function testLocalAI(){
  var res=document.getElementById('ai-test-result');
  if(res)res.textContent='⟳ Verbinde...';
  // Update model from select/custom input
  var sel=document.getElementById('ai-model-select');
  var ci=document.getElementById('ai-model-custom');
  if(ci&&ci.value)aiCfg.model=ci.value;
  else if(sel&&sel.value)aiCfg.model=sel.value;
  try{
    var isOllama=aiCfg.backend==='ollama';
    var endpoint=isOllama?(aiCfg.url||'http://localhost:11434')+'/api/generate':(aiCfg.url||'http://localhost:1234')+'/v1/chat/completions';
    var body=isOllama?JSON.stringify({model:aiCfg.model||'llama3.2',prompt:'Antworte kurz mit: OK',stream:false}):JSON.stringify({model:aiCfg.model||'local',messages:[{role:'user',content:'Reply with: OK'}],max_tokens:5});
    var r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:body,signal:AbortSignal.timeout(12000)});
    var d=await r.json();
    var txt=isOllama?(d.response||'').trim():((d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content)||'').trim();
    if(res)res.innerHTML='✅ <b>'+aiCfg.model+'</b> antwortet: <span style="color:var(--teal)">'+txt.substring(0,60)+'</span>';
  }catch(e){
    if(res)res.innerHTML='❌ '+e.message.slice(0,80)+' — '+_tr('Läuft der Server?','Is the server running?','هل الخادم يعمل؟');
  }
}

// ─── KI-Call: Anthropic / Ollama-Streaming / LM Studio / OAI-compat ──
async function aiCall(prompt,maxTokens,onChunk){
  var b=aiCfg.backend;
  if(b==='smart')return null;

  // Anthropic Cloud
  if(b==='anthropic'){
    var res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:maxTokens||1400,messages:[{role:'user',content:prompt}]})});
    var d=await res.json();
    if(d.error)throw new Error(d.error.message);
    var text=d.content.map(function(c){return c.text||'';}).join('').replace(/```json[\s\S]*?```|```/g,'').trim();
    if(onChunk)onChunk(text);
    return text;
  }

  // Ollama — mit optionalem Streaming
  if(b==='ollama'){
    var useStream=aiCfg.stream&&typeof onChunk==='function';
    var body2=JSON.stringify({model:aiCfg.model||'llama3.2',prompt:prompt,stream:useStream,options:{num_predict:maxTokens||1400,temperature:0.2}});
    var res2=await fetch((aiCfg.url||'http://localhost:11434')+'/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:body2});
    if(useStream){
      var reader=res2.body.getReader(),dec=new TextDecoder(),full='';
      while(true){
        var _r=await reader.read();if(_r.done)break;
        dec.decode(_r.value).split('\n').filter(Boolean).forEach(function(line){
          try{var o=JSON.parse(line);if(o.response){full+=o.response;onChunk(full);}}catch(e){}
        });
      }
      return full.replace(/```json[\s\S]*?```|```/g,'').trim();
    }else{
      var d2=await res2.json();
      return (d2.response||'').replace(/```json[\s\S]*?```|```/g,'').trim();
    }
  }

  // LM Studio / OpenAI-kompatibel / Jan.ai / Kobold usw.
  var oaiUrl=(aiCfg.url||(b==='lmstudio'?'http://localhost:1234':'http://localhost:8080'))+'/v1/chat/completions';
  var res3=await fetch(oaiUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:aiCfg.model||'local',messages:[{role:'user',content:prompt}],max_tokens:maxTokens||1400,temperature:0.2})});
  var d3=await res3.json();
  var txt3=((d3.choices&&d3.choices[0]&&d3.choices[0].message&&d3.choices[0].message.content)||'').replace(/```json[\s\S]*?```|```/g,'').trim();
  if(onChunk)onChunk(txt3);
  return txt3;
}
