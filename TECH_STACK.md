# Teknoloji Stack

## Frontend

**Framework:** React.js + TypeScript

**Build Tool:** Vite

**UI/Component Library:** Ant Design

**State Management:**
- TanStack Query (React Query) - API state management
- Zustand - Global state management

**Neden seçildi:**
- Modern ve popüler
- TypeScript tip güvenliği
- Ant Design: Hazır admin panel component'leri (Form, Table, Modal, vb.)
- TanStack Query: API cache ve state yönetimi otomatik
- Zustand: Basit ve lightweight global state
- Vite: Çok hızlı build
- Responsive web desteği

## Backend

**Dil ve Runtime:** Node.js + TypeScript

**Framework:** Express.js

**ORM:** Prisma

**API Yaklaşımı:** REST API

**Authentication:** JWT + bcrypt

**Neden seçildi:**
- Full-stack TypeScript (tip güvenliği)
- Express: Minimal, hızlı, esnek
- Prisma: TypeScript native, hızlı migration, type-safe queries
- Tek dil kullanımı (JavaScript/TypeScript)
- Hızlı geliştirme
- Büyük ekosistem

## Veritabanı

**Ana Veritabanı:** PostgreSQL

**ORM:** Prisma

**Neden seçildi:**
- Güçlü relational database
- JSONB desteği (ekipman şablonları için esnek yapı)
- ACID compliance
- Multi-tenant yapı için uygun
- Prisma ile kolay migration ve type-safe queries
- Performans ve ölçeklenebilirlik

**JSONB Kullanımı:**
- Ekipman şablonları için esnek ve dinamik veri yapısı
- Her ekipman tipinin farklı alanları olabilir
- Kolay sorgulanabilir

## DevOps

**Hosting:**
<!-- İleride belirlenecek -->

**CI/CD:**
<!-- İleride belirlenecek -->

## Third-Party Servisler

**PDF Generation:** Puppeteer
- HTML/CSS template → PDF
- Esnek şablon tasarımı
- React component render edip PDF'e çevrilebilir

## Development Tools

**Package Manager:** npm

**Type Checking:** TypeScript

**Linting:** ESLint

**Formatting:** Prettier

## Platform

**Tip:** Web-based (Responsive)
- Desktop desteği
- Tablet desteği
- Mobile desteği


## Final Stack Özeti

```
Frontend:
- React + TypeScript
- Vite
- Ant Design
- TanStack Query
- Zustand

Backend:
- Node.js + TypeScript
- Express.js
- Prisma ORM
- JWT + bcrypt

Database:
- PostgreSQL + JSONB

PDF:
- Puppeteer

Tools:
- npm
- ESLint + Prettier
```
