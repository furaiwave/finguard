# FinGuard

AI-платформа для виявлення фінансового шахрайства. Аналізує транзакції в реальному часі через Claude (Anthropic), застосовує налаштовуваний рушій правил та надає дашборд із звітністю.

## Структура монорепо

```
finguard/
├── finguard-backend/   # NestJS REST API + TypeORM + MySQL
└── finguard-frontend/  # React 19 + Vite + shadcn/ui
```

Типи та DTO є спільними — фронтенд імпортує їх безпосередньо з `finguard-backend/shared/` та `finguard-backend/src/common/dto/`.

---

## Технологічний стек

| Шар | Технологія |
|---|---|
| Бекенд | NestJS 11, TypeORM 0.3, MySQL 8 |
| AI | Anthropic Claude (`@anthropic-ai/sdk`) |
| Фронтенд | React 19, Vite, Tailwind CSS v4, shadcn/ui, Radix UI |
| Мова | TypeScript 5 (бекенд), TypeScript 6 (фронтенд) |

---

## Вимоги

- Node.js 20+
- MySQL 8 локально або через Docker

---

## Швидкий старт

### 1. База даних

Створи базу даних (MySQL):

```sql
CREATE DATABASE finguard_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> У режимі розробки встановлено `synchronize: true` — TypeORM створить таблиці автоматично при першому запуску.

### 2. Бекенд

```bash
cd finguard-backend
cp .env.example .env      # заповни своїми значеннями
npm install
npm run start:dev         # http://localhost:3001
```

**Змінні `.env`:**

| Змінна              |                                 Опис                                                  |
|---------------------|---------------------------------------------------------------------------------------|
| `PORT`              | Порт сервера (за замовчуванням `3001`)                                                |
| `FRONTEND_URL`      | CORS origin (за замовчуванням `http://localhost:5173`)                                |
| `DB_HOST`           | Хост MySQL                                                                            |
| `DB_PORT`           | Порт MySQL (за замовчуванням `3306`)                                                  |
| `DB_USER`           | Користувач MySQL                                                                      |
| `DB_PASSWORD`       | Пароль MySQL                                                                          |
| `DB_NAME`           | Назва бази даних                                                                      |
| `ANTHROPIC_API_KEY` | API ключ Anthropic — на [console.anthropic.com](https://console.anthropic.com)        |

### 3. Фронтенд

```bash
cd finguard-frontend
cp .env.example .env      # встанови VITE_API_URL за потреби
npm install
npm run dev               # http://localhost:5173
```

**Змінні `.env`:**

| Змінна         | За замовчуванням            |
|----------------|-----------------------------|
| `VITE_API_URL` | `http://localhost:3001/api` |

---

## Архітектура коду

### Бекенд

```text
src/
├── common/
│   ├── controllers.ts          # всі 4 контролери в одному файлі
│   ├── dto/                    # вхідні/вихідні DTO з валідацією (class-validator)
│   └── interceptors/
│       ├── response.ts         # обгортає будь-яку відповідь у { success, data }
│       └── entities/           # TypeORM-сутності (таблиці БД)
├── modules/
│   ├── analysis/               # AI-аналіз через Claude
│   ├── transactions/           # CRUD транзакцій + запуск аналізу
│   ├── rules/                  # CRUD правил шахрайства
│   ├── reports/                # генерація звітів
│   └── dataset/                # пакетний аналіз ULB-датасету
└── shared/types.ts             # брендовані типи, enum-и, спільні інтерфейси
```

### Флоу аналізу транзакції

```text
POST /transactions/:id/analyze
        │
        ▼
TransactionsService.analyze()
        │  завантажує транзакцію + активні правила
        ▼
AiAnalysisService.analyze()
        │
        ├─ applyRules()      — перебирає активні правила, рахує delta (-50..+50)
        │
        ├─ Claude API        — надсилає транзакцію + правила + delta
        │   model: claude-haiku-4-5
        │   відповідь: JSON з riskScore, verdict, signals, reasoning (українською)
        │
        ├─ parseResponse()   — витягує JSON з markdown-блоку, валідує схему
        │
        └─ buildDecision()   — фінальний вердикт = max(Claude, rule-based threshold)
                                score ≤60 → approved
                                score ≤85 → approved_with_review
                                score >85 → blocked
```

### Рушій правил

Кожне правило має набір умов (`conditions`) і логіку їх об'єднання (`AND` / `OR`).  
Якщо правило спрацьовує — його `riskScoreImpact` додається до дельти (від −50 до +50).  
Дельта передається в промпт Claude і додається до його `riskScore` вже після відповіді.

### Спільні типи

`finguard-backend/shared/types.ts` — єдине джерело правди для обох пакетів.  
Фронтенд імпортує типи напряму через відносний шлях (`../../../finguard-backend/shared/types`), без окремого npm-пакету.  
Брендовані типи (`TransactionId`, `RiskScore` тощо) не дають переплутати значення одного примітива.

### Фронтенд

`src/lib/api.ts` — єдина точка звернення до бекенду. Всі запити проходять через `req<T>()`, який автоматично розпаковує `{ success, data }` або кидає `ApiClientError`.

---

## Огляд API

Всі відповіді обгорнуті: `{ success: true, data: ... }` або `{ success: false, error: { code, message } }`.

| Ресурс | Ендпоінти |
|---|---|
| Транзакції | `GET/POST /api/transactions`, `GET/DELETE /api/transactions/:id`, `POST /api/transactions/:id/analyze` |
| Правила | `GET/POST /api/rules`, `GET/PUT/DELETE /api/rules/:id`, `PATCH /api/rules/:id/toggle` |
| Звіти | `POST /api/reports/generate`, `GET /api/reports`, `GET/DELETE /api/reports/:id` |
| Датасет | `POST /api/dataset/analyze-batch` |

---

## Скрипти

### Бекенд (`finguard-backend/`)

```bash
npm run start:dev    # dev з watch-режимом
npm run start:prod   # продакшн (node dist/main)
npm run build        # компіляція
npm run test         # юніт-тести (Jest)
npm run test:e2e     # e2e тести
npm run lint         # ESLint + Prettier fix
```

### Фронтенд (`finguard-frontend/`)

```bash
npm run dev      # dev сервер
npm run build    # продакшн збірка
npm run preview  # перегляд продакшн збірки
npm run lint     # ESLint
```

---

## Схема бази даних

Чотири таблиці: `transactions`, `analyses`, `rules`, `reports`.

`transactions` → `analyses` — зв'язок один-до-багатьох (одна транзакція може мати кілька запусків аналізу).

Основні enum-и:

- **тип транзакції**: `payment | transfer | withdrawal | deposit | refund | chargeback`
- **канал**: `card_present | card_not_present | bank_transfer | crypto | mobile_payment | atm`
- **вердикт**: `approved | approved_with_review | blocked | pending_manual_review`
- **рівень ризику**: `low | medium | high | critical`
- **дія правила**: `flag | block | review | approve | notify`

