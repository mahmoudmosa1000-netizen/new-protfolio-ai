# FOLIO — Portfolio Builder

Ein interaktiver, offline-fähiger Portfolio-Builder mit KI-gestützter CV-Extraktion,
dreisprachiger Oberfläche (DE/EN/AR) und optionaler mehrsprachiger Portfolio-Ausgabe.

## Struktur

```
├── index.html      Hauptanwendung (UI, State, Portfolio-Generator)
└── ai-engine.js     KI-Backend-Modul (Anthropic Cloud / Ollama / LM Studio / OpenAI-kompatibel)
```

`index.html` lädt `ai-engine.js` per `<script src="ai-engine.js">` — beide Dateien
müssen im selben Verzeichnis liegen.

## Lokale Nutzung

Repository klonen und `index.html` per lokalem Webserver öffnen (z. B. `npx serve`
oder Python: `python3 -m http.server`). Direktes Öffnen per Doppelklick (`file://`)
funktioniert in den meisten Browsern ebenfalls, da `<script src>` (anders als `fetch`)
auch über das `file://`-Protokoll lädt.

## GitHub Pages

1. Repository-Settings → Pages → Branch `main`, Ordner `/ (root)` auswählen
2. Fertig — die Seite ist unter `https://<username>.github.io/<repo>/` erreichbar

## KI-Backend

Standardmäßig auf Anthropic Cloud gestellt (API-Key wird serverseitig verwaltet, kein
Key im Frontend). Alternativ lokal & kostenlos nutzbar über:

- **Ollama** — `ollama run llama3.2` dann im Builder "🏠 Ollama" wählen
- **LM Studio** — lokalen Server starten, Port 1234
- **Jede OpenAI-kompatible API** — Jan.ai, Kobold.cpp, Oobabooga, vLLM, LocalAI
- **⚡ Offline-Modus** — keine KI nötig, schnelle Regex-Extraktion

Die gesamte Backend-Logik liegt in `ai-engine.js` und kann unabhängig vom UI
weiterentwickelt oder ausgetauscht werden.
