# Voice Mode — Plan & Research

Contexto del brainstorming realizado el 13 mar 2026. No se ha escrito código aún.

## Decisión de Arquitectura

Se evaluaron 5 opciones:

| Opción | Descripción | Veredicto |
|--------|-------------|-----------|
| A | Botón "Escuchar" por mensaje — OpenAI TTS on-demand | Bajo impacto |
| B | Micrófono para dictado (voice-in, text-out vía Whisper) | Incremental |
| C | Modo dual (voice-in + voice-out) — Whisper → Claude → TTS | Más complejo, no nativo |
| **D** | **OpenAI Realtime API** — WebSocket único, audio-to-audio | **ELEGIDA** |
| E | Experiencia "Llamar a Santiago" — modal tipo llamada | Fase posterior |

### Por qué Opción D (Realtime API)

- WebSocket único maneja STT + razonamiento + TTS — sin orquestar 3 servicios
- Soporta function calling → puede consultar Supabase RAG
- El mismo system prompt funciona en GPT-4o
- "Nadie tiene esto en un CV" — diferenciador absoluto para portfolio
- Audio-to-audio nativo, no pipeline de 3 hops como Jacobo (Aircall → Twilio → ElevenLabs)

### Trade-off aceptado

- Usa GPT-4o en vez de Claude para la generación de voz
- La arquitectura es model-agnostic: mismo prompt, mismo RAG, diferente modelo
- El texto sigue usando Claude Sonnet (mejor para conversación escrita)

## Memoria Compartida (Text ↔ Voice)

Arquitectura acordada:

```
conversationHistory[] en React state (compartido)
    ├── Text mode: push/pop directo
    └── Voice mode: session.update envía historial al WebSocket
                    transcripts del Realtime API vuelven al array
```

- Text → Voice: se envía historial completo vía `session.update`
- Voice → Text: los transcripts se pushean de vuelta al array
- Ambos modos comparten el mismo RAG (Supabase) y system prompt

## Costes Estimados

| Métrica | Valor |
|---------|-------|
| Audio input | ~$0.06/min |
| Audio output | ~$0.24/min |
| Conversación típica (2 min) | ~$0.31 |
| 50 conv/mes (portfolio normal) | ~$15/mes |
| 200 conv/mes (si se viraliza) | ~$62/mes |

### Mitigación de costes

- Límite de 2 minutos por sesión de voz
- Budget global de $5/día
- Rate limit: 3 conversaciones de voz por IP/día

## Evals & Testing para Voz

- La Realtime API proporciona transcripts (input vía Whisper, output vía events)
- Los input transcripts son aproximados — "no es exactamente lo que el modelo escuchó"
- **Enfoque práctico:** evals basados en transcripts con LLM-as-Judge (reutiliza la suite de 56 evals)
- **Avanzado:** LangWatch Scenario para simulación CI, Hamming para llamadas concurrentes de test

## Observabilidad

- **Patrón sideband connection:** segundo WebSocket desde el servidor escucha la misma sesión, captura todo
- Langfuse NO tiene soporte nativo para Realtime API aún (GitHub discussion #3765)
- Los transcripts se pueden loguear manualmente como traces en Langfuse
- Alternativas: Vapi (integración nativa Langfuse), LiveKit (OpenTelemetry)

## Seguridad / Jailbreaks de Voz

Nuevos vectores de ataque específicos de voz:

- Perturbaciones adversariales en audio
- Explotación paralingüística (tono autoritario)
- Jailbreaks convertidos de texto a TTS
- Cambio de acento/idioma para evadir detección

### Defensa recomendada

- **Output moderation más efectiva que input** (detecta 57-93% de ataques)
- Defensa en capas: transcripción de input + moderación, moderación de output con buffering
- OpenAI Moderation API
- Rate limiting
- Sideband logging para análisis post-hoc

## UI de Voice Chat

Tendencia de la industria: voz **dentro del chat** (no takeover fullscreen) — ChatGPT mismo adoptó esto.

### Componentes disponibles (compatibles con nuestro stack shadcn)

- **ElevenLabs UI** — Orb, Bar Visualizer, Voice Button (construidos sobre shadcn/ui)
- OpenAI Realtime Blocks
- Pipecat Voice UI Kit

### Estados clave del UI

1. **Idle** — botón de micrófono disponible
2. **Listening** — visualizador activo, capturando audio
3. **Thinking** — procesando (Realtime API razonando)
4. **Speaking** — reproduciendo respuesta de audio

## Análisis Competitivo

**No se encontró ningún portfolio con voice AI + RAG.** Santiago sería literalmente el primero públicamente visible.

## Próximos Pasos

1. Implementar Realtime API con WebSocket + function calling para RAG
2. UI: botón de micrófono integrado en FloatingChat (no modal separado)
3. Memoria compartida text ↔ voice
4. Evals adaptados a transcripts de voz
5. Sideband logging → Langfuse
6. Rate limiting + budget cap
7. Actualizar case study con sección de voice
