# Новая функциональность - Создать модуль транзакций

## Контекст

Проект: Nest.js + Next + PostgreSQL + Prisma
Что уже есть: User, авторизация JWT, модуль категорий + frontend авторизации

## Задача

Создай TransactiosModule - центральний модуль приложения для учета доходов и расходов.

## Модель данних

Добавь модель Transaction в schema.prisma:

- id (String, uuid, @ default(uuid()))
- amount(Decemical)
- type (Enum: Income, Expense)
- description (String, nullable)
- date (DateTime)
- categoryId (String, связь с Category)
- userId (String, связь с User)
- createdAt (DateTime, @ default(now()))

Обнови модели User и Category - добавь обратние связт с transaction Trasaction[]

После изменения схеми создай и примени миграцию:
npx prisma migrate dev --name add-transactions

## Контролер

Ендпоинти

- POST /transactions: создать транзакцию
- GET /transactions: список с query параметрами dateFrom, dateTo, type, categoryId
- GET /transactions/summary: агрегация, query параметри month и year (оба обязательние)
- GET /transactions/:id: одна транзакция
- Patch /transactions:id: обновить
- Delete /transactions:id: удалить

## Паттерн

Используй @backend/src/category как образец структури для backend

## Ограничения

- Не добавлять зависимости если не указано в задаче
- Используй class-validator для DTО
- После реализации собирай проект
