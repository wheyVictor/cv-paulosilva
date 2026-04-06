# Google Ads Campaign Structure — A.A.T (Auto All Tech)

## Setup Checklist
- [ ] Create Google Ads account at ads.google.com
- [ ] Link to Google Business Profile
- [ ] Set billing (credit card)
- [ ] Install conversion tracking (add gtag.js to website)
- [ ] Set up conversion goals: WhatsApp click, email click, chat open

---

## Campaign 1: Automação PME (SMB Automation)
**Budget:** R$30/day (R$900/month)
**Target:** Rio de Janeiro + Brazil (remote)
**Bidding:** Maximize conversions

### Ad Group 1: Automação de Processos
**Keywords:**
- automação de processos empresariais
- automação para pequenas empresas
- automatizar processos empresa
- automação empresarial RJ
- consultoria automação empresarial

**Ad Copy:**
```
Headline 1: Automação Empresarial | A.A.T
Headline 2: 300+ Empresas Automatizadas
Headline 3: 8 Anos Sem Erros
Description 1: Automatize processos, planilhas, NF-e, CRM e ERP. 300+ clientes desde 2018. Zero erros. Conquiste o tempo.
Description 2: Consultoria de automação no Rio de Janeiro. Atendemos todo o Brasil remotamente. Fale conosco no WhatsApp.
```

### Ad Group 2: Nota Fiscal Automática
**Keywords:**
- automatizar nota fiscal
- automação NF-e
- emissão automática nota fiscal
- nota fiscal eletrônica automática
- automação NFS-e

**Ad Copy:**
```
Headline 1: NF-e Automática | Sem Erros
Headline 2: 300+ Empresas Já Usam
Headline 3: Emissão e Rastreamento
Description 1: Automatize a emissão de NF-e e NFS-e. Integração com Omie, Bling e Tiny. 8 anos funcionando sem erros.
Description 2: Pare de emitir nota fiscal manualmente. Automação completa em dias, não meses. Fale no WhatsApp.
```

### Ad Group 3: Integração ERP
**Keywords:**
- integração ERP
- integrar Omie
- integração Bling
- conectar Tiny ERP
- automação ERP

**Ad Copy:**
```
Headline 1: Integração ERP | Omie Bling Tiny
Headline 2: Conecte Tudo Automaticamente
Headline 3: 300+ Integrações Feitas
Description 1: Conecte seu ERP a planilhas, NF-e, CRM e WhatsApp. Omie, Bling, Tiny — tudo integrado sem programação.
Description 2: Consultoria especializada em integração ERP. 8 anos de experiência. Resultados em 30 dias.
```

### Ad Group 4: Automação WhatsApp
**Keywords:**
- automação WhatsApp Business
- chatbot WhatsApp empresa
- WhatsApp automático empresa
- atendimento automático WhatsApp
- bot WhatsApp

**Ad Copy:**
```
Headline 1: WhatsApp Automático | 24/7
Headline 2: Chatbot Inteligente
Headline 3: Sem Perder Nenhum Cliente
Description 1: Automatize atendimento, agendamentos e vendas pelo WhatsApp. Respostas automáticas 24/7. 300+ empresas atendidas.
Description 2: Chatbot para WhatsApp Business. Integração com CRM e ERP. Setup em dias. Fale conosco.
```

---

## Campaign 2: Data Engineering (English)
**Budget:** R$20/day (R$600/month)
**Target:** Brazil + LATAM + Remote global
**Bidding:** Maximize conversions

### Ad Group 1: Snowflake Consulting
**Keywords:**
- snowflake consultant
- snowflake data engineer
- snowflake architecture consulting
- dbt consultant
- data engineering consultant

**Ad Copy:**
```
Headline 1: Snowflake + dbt Expert
Headline 2: 10+ Years Data Engineering
Headline 3: SnowPro Core Certified
Description 1: Senior Data Engineer with 10+ years. Snowflake architecture, dbt modeling, AWS pipelines. Currently leading at Data Meaning.
Description 2: Scalable data, reliable pipelines. From architecture to production. Let's talk about your data challenges.
```

---

## Campaign 3: AI Engineering
**Budget:** R$15/day (R$450/month)
**Target:** Brazil + Global remote
**Bidding:** Maximize conversions

### Ad Group 1: AI Integration
**Keywords:**
- AI engineer consultant
- Claude API integration
- RAG pipeline development
- LLM integration services
- MCP server development

**Ad Copy:**
```
Headline 1: AI Engineering | Claude & GPT
Headline 2: RAG, MCP, LLM in Production
Headline 3: From Concept to Production
Description 1: AI Engineer building production RAG pipelines, MCP servers, and LLM integrations. Claude Code power user.
Description 2: Need AI in your product? 10+ years engineering + cutting-edge AI stack. Project or retainer.
```

---

## Negative Keywords (apply to all campaigns)
- grátis
- free
- curso
- tutorial
- o que é
- download
- template grátis
- vaga
- emprego
- salário

---

## Conversion Tracking Setup

Add to `index.html` before `</head>`:
```html
<!-- Google Ads Conversion Tracking -->
<!-- Replace GA_MEASUREMENT_ID and AW_CONVERSION_ID with actual values -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

Track these events:
1. **WhatsApp click** — track `wa.me` link clicks
2. **Email click** — track `mailto:` link clicks
3. **Chat open** — track the "Ask my AI" button click
4. **Time on page** — 60s+ indicates interest

---

## Monthly Budget Summary
| Campaign | Daily | Monthly |
|----------|-------|---------|
| Automação PME | R$30 | R$900 |
| Data Engineering | R$20 | R$600 |
| AI Engineering | R$15 | R$450 |
| **Total** | **R$65** | **R$1,950** |

Start with Campaign 1 only (R$900/month) if budget is tight. It targets the highest-volume, lowest-competition keywords in PT-BR.
