# 🎵 ConcertApp

Aplicación móvil para descubrir conciertos, guardar tus favoritos y seguir a tus artistas.
Construida con **Expo (React Native)** + **Hono** + **Supabase** + **Ticketmaster API**.

---

## 📱 Pantallas

- **Buscar** — Búsqueda en tiempo real de conciertos por artista o keyword
- **Detalle** — Información completa del concierto: venue, fecha, precio y artistas
- **Mis Conciertos** — Lista de conciertos guardados por el usuario
- **Widgets** — Widgets personalizables para la pantalla de inicio
- **Perfil** — Gestión de cuenta y preferencias

---

## 🏗️ Arquitectura

App (Expo) ←──── Auth directo ────→ Supabase Auth
│ │
↓ │
Tu Backend (Hono) ←── verifica JWT ───────┘
│
↓
Ticketmaster API

text

| Capa | Tecnología | Función |
|------|-----------|---------|
| Frontend | Expo + React Native + Expo Router | UI multiplataforma iOS/Android |
| Backend | Hono (Node.js) | API intermedia, oculta keys externas |
| Base de datos | Supabase (PostgreSQL) | Usuarios, favoritos, caché de eventos |
| Auth | Supabase Auth | Login/registro con JWT |
| ORM | Prisma | Modelos y migraciones de BD |
| Eventos | Ticketmaster Discovery API | Datos de conciertos en tiempo real |

---

## 🚀 Instalación

### Requisitos previos
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Cuenta en [Supabase](https://supabase.com)
- API Key de [Ticketmaster Developer](https://developer.ticketmaster.com)

---

### 1. Clonar el repositorio

```bash
git clone https://github.com/MrZamudioRamos/ConcertApp.git
cd ConcertApp
2. Frontend (Expo)
bash
npm install
Crea el archivo services/supabase.ts con tus credenciales:

ts
const SUPABASE_URL = 'https://xxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGc...';
Arranca la app:

bash
npx expo start
3. Backend (Hono)
bash
cd backend
npm install
Crea el archivo backend/.env:

text
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres"
TICKETMASTER_API_KEY="tu_api_key"
JWT_SECRET="tu_secreto"
PORT=3000
Aplica el schema de base de datos:

bash
npx prisma generate
npx prisma db push
Arranca el servidor:

bash
npm run dev
📁 Estructura del proyecto
text
ConcertApp/
├── app/                        # Rutas Expo Router
│   ├── (tabs)/
│   │   ├── index.tsx           # Mis Conciertos
│   │   ├── buscar.tsx          # Búsqueda
│   │   ├── widgets.tsx         # Widgets
│   │   └── perfil.tsx          # Perfil
│   ├── concierto/
│   │   └── [id].tsx            # Detalle del concierto
│   └── _layout.tsx             # Layout raíz
├── context/
│   └── AuthContext.tsx         # Estado global de autenticación
├── services/
│   ├── api.ts                  # Llamadas al backend Hono
│   └── supabase.ts             # Cliente Supabase
├── components/                 # Componentes reutilizables
└── backend/
    ├── src/
    │   ├── index.ts            # Entry point Hono
    │   └── routes/
    │       ├── concerts.ts     # /api/concerts
    │       └── auth.ts         # /api/auth
    └── prisma/
        └── schema.prisma       # Modelos de base de datos
🔌 API Endpoints
Conciertos
Método	Ruta	Descripción
GET	/api/concerts/search?q={query}&country={code}	Buscar conciertos
GET	/api/concerts/:id	Detalle de un concierto
Auth
Método	Ruta	Descripción
POST	/api/auth/register	Registro de usuario
POST	/api/auth/login	Login de usuario
🗄️ Modelos de base de datos
text
User         → supabaseId, name, avatarUrl
Artist       → id (TM), name, imageUrl, genre
Event        → id (TM), artistId, venue, city, date, imageUrl
UserConcert  → userId, eventId (favoritos)
🛠️ Stack completo
Expo — Framework React Native

Expo Router — Navegación basada en archivos

Hono — Backend ultraligero

Supabase — BaaS: PostgreSQL + Auth + Storage

Prisma — ORM TypeScript

Ticketmaster API — Datos de eventos

📄 Licencia
MIT © MrZamudioRamos
