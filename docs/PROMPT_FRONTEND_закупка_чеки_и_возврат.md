# Промпт для ИИ (frontend) — сверка закупа и фото чеков

**Для:** Семенов Б.Д. (клиентская часть)  
**Backend:** Давыдов — уже в `main`, миграция `20260530120000_purchase_settlement`  
**Скопируй блок между ``` целиком в чат.**

---

```
Ты помогаешь с frontend PWA «Коопзакупки — Якутия» (React, coopykt.ru).
Моя часть — клиент. Backend — NestJS, база /api/v1, JWT как сейчас.

## Контекст (кратко)

Модель 4+1 + эскроу уже на сайте:
- житель: reserve-payment → held
- координатор: confirmed только при held
- выдача: житель confirm-receipt → delivered + released

Новая задача от backend (коммит со сверкой закупа):

**Цены в каталоге — ориентир.** После закупа координатор:
1. прикрепляет **фото чеков** из магазина;
2. вводит **фактическую сумму закупа** по чекам;
3. система **пропорционально возвращает переплату** жителям (поле refundAmount на заказе).

Если координатор завысил ориентир — житель видит возврат; спор — через диспут, админ смотрит чеки сбора.

## Новые поля в заказе (API)

В ответах `/orders`, `/orders/:id`:
- `refundAmount` — сумма возврата переплаты (₽)
- `netTotal` — totalEstimate − refundAmount (к выплате координатору после получения)

## Новые endpoint'ы (координатор)

База: `/api/v1/driver/rounds/:roundId/procurement/…`

| Метод | Путь | Тело | Ответ |
|-------|------|------|-------|
| POST | `…/receipts` | multipart, поле `file` (image/jpeg, png…) | `{ id, fileName, mimeType, url, createdAt }` |
| GET | `…/receipts` | — | массив чеков |
| GET | `…/settlement` | — | сводка (см. ниже) |
| POST | `…/settle` | `{ "actualTotal": number }` | та же сводка после сверки |

### GET settlement (пример структуры)

```json
{
  "roundId": "uuid",
  "receiptCount": 2,
  "reservedTotal": 44800,
  "refundTotal": 3200,
  "netTotal": 41600,
  "actualPurchaseTotal": 41600,
  "purchaseSettledAt": "2026-05-30T12:00:00.000Z",
  "orders": [
    {
      "id": "uuid",
      "publicNumber": "YKT-2505-01",
      "totalEstimate": 4480,
      "refundAmount": 320,
      "netHeld": 4160
    }
  ]
}
```

### Правила backend (не ломай)

- Сбор должен быть **закрыт** (не open).
- Перед `settle` нужен **≥1 чек**.
- `actualTotal` не может быть **больше** reservedTotal (сумма held-заказов).
- `settle` **один раз** на сбор (повтор → ошибка).
- После settle жителям уходит уведомление о refundAmount.

## Endpoint'ы админа (диспут / модерация)

| Метод | Путь |
|-------|------|
| GET | `/api/v1/admin/rounds/:roundId/procurement-receipts` |
| GET | `/api/v1/admin/rounds/:roundId/purchase-settlement` |

В UI диспута или карточки сбора покажи админу ссылку «Чеки закупа» — gallery по `url` из receipts.

## Что сделать на frontend (приоритет)

### 1. Экран закупа координатора (после чек-листа)

Где сейчас `/driver/procurements` или деталь закупа — добавить блок **«Сверка по чекам»**:

- список загруженных фото (GET receipts);
- кнопка «Добавить фото чека» → POST receipts (input type=file, FormData);
- поле «Итого по чекам, ₽» + кнопка «Провести сверку» → POST settle;
- после settle показать: reservedTotal, actualTotal, refundTotal, таблица orders с refundAmount.

Если `purchaseSettledAt` уже есть — форму скрыть, только просмотр.

### 2. Житель

- В деталях заказа и списке заказов показывать `refundAmount` и `netTotal`, если > 0.
- Текст: «Возврат переплаты после закупа: X ₽» (эскроу, симуляция).
- FAQ можно дополнить одной строкой про ориентировочные цены.

### 3. Админ

- В обращении/dispute, если есть `orderId` → подтянуть `roundId` заказа → GET procurement-receipts.
- Мини-галерея превью чеков (как вложения в тикетах).

### 4. Типы / API-слой

- Обновить `api-types`, mappers: `refundAmount`, `netTotal`.
- Новый модуль `procurementSettlementApi.ts` или расширить driver API.

## UX-текст

- «Цена в каталоге — ориентир. После закупа по чекам возможен возврат переплаты.»
- Не писать «точная цена из магазина».

## Не делать

- Не парсить OCR чеков.
- Не давать координатору менять settle повторно без админа.
- Не трогать backend-контракты.

## Проверка сценария

1. 2 жителя оплатили (held), суммы разные.
2. Координатор: чек-лист → 2 фото чека → actualTotal меньше суммы reserved.
3. settle → у каждого refundAmount пропорционально.
4. Житель видит refund в заказе.
5. confirm-receipt → released (net).

Начни с аудита driver procurement UI и ordersApi, предложи план, потом реализуй блок «Сверка по чекам».
```

---

*Файл в репо: `docs/PROMPT_FRONTEND_закупка_чеки_и_возврат.md`. Предыдущий общий промпт (эскроу 4+1): у Давыдова локально `VKR_word/PROMPT_ДЛЯ_ФРОНТ_ИИ_Семенov.md`.*
