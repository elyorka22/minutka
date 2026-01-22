# API Endpoints - Документация

## Base URL

- Development: `http://localhost:3001`
- Production: `https://your-backend.railway.app`

## Response Format

Все ответы имеют единый формат:

```typescript
{
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

## Restaurants

### GET /api/restaurants

Получить список активных ресторанов.

**Query Parameters:**
- `featured` (boolean, optional) - только топовые рестораны

**Example Request:**
```bash
GET /api/restaurants?featured=true
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Пиццерия Италия",
      "description": "Лучшая пицца в городе",
      "working_hours": {
        "monday": "09:00-22:00",
        "tuesday": "09:00-22:00"
      },
      "telegram_chat_id": 123456789,
      "phone": "+79991234567",
      "is_active": true,
      "is_featured": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET /api/restaurants/:id

Получить детали ресторана по ID.

**Example Request:**
```bash
GET /api/restaurants/123e4567-e89b-12d3-a456-426614174000
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Пиццерия Италия",
    "description": "Лучшая пицца в городе",
    "working_hours": {
      "monday": "09:00-22:00"
    },
    "telegram_chat_id": 123456789,
    "phone": "+79991234567",
    "is_active": true,
    "is_featured": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Restaurant not found"
}
```

## Orders

### POST /api/orders

Создать новый заказ.

**Request Body:**
```json
{
  "restaurant_id": "uuid",
  "user_id": "uuid",
  "order_text": "Пицца Маргарита, 2 порции, кола 0.5л",
  "address": "ул. Ленина, 10, кв. 5",
  "latitude": 55.7558,
  "longitude": 37.6173
}
```

**Required Fields:**
- `restaurant_id` (string, UUID)
- `user_id` (string, UUID)
- `order_text` (string)

**Optional Fields:**
- `address` (string)
- `latitude` (number)
- `longitude` (number)

**Example Request:**
```bash
POST /api/orders
Content-Type: application/json

{
  "restaurant_id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "123e4567-e89b-12d3-a456-426614174001",
  "order_text": "Пицца Маргарита, 2 порции",
  "address": "ул. Ленина, 10"
}
```

**Example Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174002",
    "restaurant_id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "123e4567-e89b-12d3-a456-426614174001",
    "order_text": "Пицца Маргарита, 2 порции",
    "address": "ул. Ленина, 10",
    "latitude": null,
    "longitude": null,
    "status": "pending",
    "telegram_message_id": null,
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Missing required fields: restaurant_id, user_id, order_text"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Restaurant not found or inactive"
}
```

### GET /api/orders/:id

Получить заказ по ID с деталями (ресторан, пользователь).

**Example Request:**
```bash
GET /api/orders/123e4567-e89b-12d3-a456-426614174002
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "restaurant_id": "uuid",
    "user_id": "uuid",
    "order_text": "Пицца Маргарита, 2 порции",
    "address": "ул. Ленина, 10",
    "status": "pending",
    "restaurant": {
      "id": "uuid",
      "name": "Пиццерия Италия"
    },
    "user": {
      "id": "uuid",
      "telegram_id": 123456789,
      "first_name": "Иван"
    }
  }
}
```

### PATCH /api/orders/:id/status

Обновить статус заказа.

**Request Body:**
```json
{
  "status": "accepted",
  "changed_by": "restaurant",
  "telegram_id": 123456789
}
```

**Required Fields:**
- `status` (string) - один из: `pending`, `accepted`, `ready`, `delivered`, `cancelled`

**Optional Fields:**
- `changed_by` (string) - `user`, `restaurant`, `system`
- `telegram_id` (number) - ID пользователя в Telegram

**Example Request:**
```bash
PATCH /api/orders/123e4567-e89b-12d3-a456-426614174002/status
Content-Type: application/json

{
  "status": "accepted",
  "changed_by": "restaurant",
  "telegram_id": 987654321
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "accepted",
    "updated_at": "2024-01-01T12:05:00Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid status. Must be one of: pending, accepted, ready, delivered, cancelled"
}
```

## Banners

### GET /api/banners

Получить активные баннеры.

**Query Parameters:**
- `position` (string, optional) - фильтр по позиции: `homepage`, `restaurant_page`, `recommended`

**Example Request:**
```bash
GET /api/banners?position=homepage
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "restaurant_id": "uuid",
      "title": "Скидка 20% на пиццу",
      "image_url": "https://example.com/banner.jpg",
      "link_url": "https://example.com/promo",
      "position": "homepage",
      "is_active": true,
      "display_order": 1,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Health Check

### GET /health

Проверка работоспособности сервера.

**Example Request:**
```bash
GET /health
```

**Example Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Error Handling

Все ошибки возвращаются с соответствующим HTTP статус-кодом:

- `400` - Bad Request (неверные параметры)
- `404` - Not Found (ресурс не найден)
- `500` - Internal Server Error (ошибка сервера)

**Error Response Format:**
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error message (only in development)"
}
```


