---
name: ship-it
description: Agente de deploy para cv-santiago. Analiza cambios, verifica consistencia, actualiza README, compila, commit y push a main.
user_invocable: true
---

# ship-it — Agente de Deploy

## Contexto del Proyecto

- **Repo**: `santifer/cv-santiago`
- **Branch**: `main`
- **URL**: `https://santifer.io`
- **Git user**: `santifer` / `santiago@me.com`
- **Deploy**: push a main → Vercel auto-deploy

## Workflow (ejecutar en orden estricto)

### Paso 1 — Identificar cambios

```bash
git diff --name-only
git diff --staged --name-only
git status -s
```

Categorizar cada archivo modificado. Si NO hay cambios → responder "Nothing to ship" y parar.

### Paso 2 — Checks de consistencia

Ejecutar SOLO los checks relevantes según los archivos que cambiaron. Usar la matriz de consistencia (sección abajo).

Si un check falla:
- Arreglar automáticamente si es seguro (conteos, fechas, alineación de datos)
- Si no es seguro, reportar y preguntar al usuario

### Paso 3 — Eval Gate (condicional)

Evaluar si los cambios afectan el comportamiento del chatbot:

| Archivos modificados | Impacto | Acción |
|---------------------|---------|--------|
| `chatbot-prompt.txt` | Alto | **Recomendar evals** — preguntar con AskUserQuestion: "El prompt del chatbot ha cambiado. Se recomienda correr evals antes de hacer deploy. ¿Ejecutar evals ahora?" |
| `api/chat.js` | Alto | **Recomendar evals** — preguntar con AskUserQuestion |
| `evals/datasets/*.json` o `evals/*.ts` | Medio | **Sugerir evals** — "Los datasets/evals han cambiado. ¿Verificar que pasan antes del deploy?" |
| `src/FloatingChat.tsx` (solo UI) | Bajo | No sugerir |
| Otros archivos | Ninguno | No sugerir |

Si el usuario acepta evals:
- Ejecutar `npm run evals` (requiere `vercel dev` corriendo, o usar `CHAT_API_URL=https://santifer.io npm run evals` contra producción)
- Si hay fallos → reportar y preguntar si continuar o parar
- Si pasan → continuar al paso 4

Si el usuario rechaza → continuar al paso 4.

### Paso 4 — Actualizar README (condicional)

Solo si los cambios afectan features documentadas. Ver tabla de lógica README abajo.

SIEMPRE actualizar EN y ES simétricamente. Seguir formato del skill `readme-pro`.

### Paso 5 — Build + SEO Triage

```bash
npm run build
```

Si falla:
- Arreglar si es obvio (import faltante, typo, tipo incorrecto)
- Reintentar `npm run build`
- Si sigue fallando → reportar error completo y parar

Si el build pasa pero tiene **warnings de `validate-prerender`**, hacer triage:

1. Parsear los warnings del output. Cada warning incluye `→ run /seo ...` indicando qué skill ejecutar.
2. Agrupar por skill:
   ```
   /seo images  — 5 warnings (image budget)
   /seo content — 1 warning (word count)
   /seo geo     — 2 warnings (citability)
   ```
3. Presentar resumen al usuario con AskUserQuestion:
   ```
   El build pasó pero hay X warnings de SEO:
   - N imagen(es) sobre presupuesto → /seo images
   - N artículo(s) con baja citability → /seo geo
   - etc.
   ¿Quieres que los arregle antes de hacer deploy?
   ```
4. Si el usuario acepta → ejecutar las skills recomendadas, arreglar, rebuild
5. Si el usuario rechaza → continuar al paso 6 (los warnings no bloquean el deploy)

**Warnings que son errores** (`ERR` en el output) siempre bloquean — arreglar antes de continuar.

### Paso 6 — Commit

Staging selectivo (NUNCA `git add .` ni `git add -A`):
- Añadir solo archivos relevantes por nombre
- NUNCA commitear: `CLAUDE.md`, `.env`, `node_modules/`, `.claude/`

Mensaje con conventional commits, SIN Co-Authored-By:

```bash
git commit -m "tipo: descripción concisa"
```

### Paso 7 — Push

```bash
git push origin main
```

Si es rechazado:
```bash
git pull --rebase origin main
git push origin main
```

---

## Matriz de Consistencia

Tabla central de checks. Si cambió el archivo "Trigger", ejecutar los checks listados.

| Trigger | Checks a ejecutar |
|---------|-------------------|
| `evals/datasets/*.json` | Contar entries con `"input"` → verificar que README (EN+ES), `chatbot-prompt.txt` y `CLAUDE.md` reflejan el número correcto de evals |
| `chatbot-prompt.txt` | Modelo mencionado = modelo en `api/chat.js`, hechos factuales alineados con `llms.txt` + `index.html` JSON-LD, proyectos mencionados alineados con `App.tsx` |
| `src/i18n.ts` | Paridad de keys ES/EN (mismas keys en ambos idiomas), sin strings vacíos `""`, emails correctos (hola@ para ES, hi@ para EN) |
| `api/chat.js` | Modelo = el de `chatbot-prompt.txt`, import de system prompt correcto |
| `index.html` | JSON-LD alineado con `chatbot-prompt.txt` y `llms.txt`, `dateModified` actualizado a fecha de hoy |
| `public/llms.txt` | Hechos alineados con `chatbot-prompt.txt` |
| `package.json` | Si nuevos deps → verificar badges en README Tech Stack |
| Archivos añadidos/eliminados | Sección "Project Structure" del README (EN+ES) |

---

## Lógica de Actualización del README

| Tipo de cambio | Qué actualizar en README |
|----------------|--------------------------|
| Nueva feature | Lista "Key Features" / "Funcionalidades" — EN + ES |
| Eval count cambia | One-liner, tabla LLMOps, tabla datasets — EN + ES |
| Nuevo dep en package.json | Badges de Tech Stack |
| Archivo nuevo/eliminado | Árbol "Project Structure" — EN + ES |
| Feature de seguridad | Features + tabla LLMOps — EN + ES |

---

## Formato de Commit Messages

Conventional commits. Un solo tipo primario por commit:

| Tipo | Uso |
|------|-----|
| `feat:` | Nueva funcionalidad |
| `fix:` | Bug fix |
| `docs:` | Solo documentación |
| `content:` | Copy, i18n, prompt |
| `security:` | Mejoras de seguridad |
| `style:` | Solo CSS/visual |
| `test:` | Solo evals |
| `perf:` | Performance |
| `chore:` | Deps, config |

Si hay cambios mixtos → usar el tipo del cambio más significativo.

---

## Lo que NUNCA debe hacer

- Nunca correr evals sin preguntar primero (solo vía eval gate del paso 3)
- Nunca `npm install`
- Nunca amend commits ni force push
- Nunca añadir `Co-Authored-By`
- Nunca `vercel --prod` (auto-deploy por push)
- Nunca modificar `chatbot-prompt.txt` (eso es contenido, no código)
- Nunca commitear `CLAUDE.md`, `.env`, `node_modules/`, `.claude/`
- Nunca cambiar git config

---

## Mapa de Relaciones entre Archivos

```
chatbot-prompt.txt ←→ api/chat.js        (import directo)
chatbot-prompt.txt ←→ llms.txt           (mismos hechos)
chatbot-prompt.txt ←→ index.html JSON-LD (datos estructurados)
i18n.ts            ←→ App.tsx + FloatingChat.tsx (traducciones)
README.md          ←→ evals/datasets/*.json     (conteo de evals)
README.md          ←→ package.json              (tech stack, scripts)
```

---

## Edge Cases

- **Sin cambios** → "Nothing to ship", parar
- **Build falla** → arreglar si es obvio (import, typo), sino reportar y parar
- **Push rechazado** → `git pull --rebase origin main`, reintentar una vez
- **Múltiples tipos de cambio** → un solo commit con tipo primario
- **`dateModified` en index.html** → actualizar a fecha de hoy en JSON-LD ProfilePage
