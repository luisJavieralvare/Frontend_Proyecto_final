# Flip7 — Proyecto Final

Juego de cartas multijugador **Flip7** implementado con arquitectura cliente-servidor.  
Backend: **Spring Boot 3 + PostgreSQL**. Frontend: **React + Vite**.

---

## Estructura del repositorio

```
flip7/
├── backend/          # Spring Boot — API REST
│   ├── src/
│   │   └── main/java/backend/
│   │       ├── controllers/    GameController.java
│   │       ├── domain/         GameSession.java, PlayerSession.java, Card.java, Deck.java
│   │       ├── dto/            GameStateResponse.java, StartGameRequest.java
│   │       ├── entities/       Game.java, Player.java, Round.java, RoundScore.java
│   │       ├── repositories/   (JPA repos)
│   │       └── services/       GameService.java
│   ├── src/main/resources/
│   │   └── application.properties
│   └── pom.xml
└── frontend/         # React + Vite
    ├── src/
    │   ├── App.jsx
    │   ├── App.css
    │   └── main.jsx
    ├── index.html
    └── package.json
```

---

## Requisitos previos

| Herramienta | Versión mínima |
|-------------|----------------|
| Java        | 21             |
| Maven       | 3.9+           |
| Node.js     | 18+            |
| PostgreSQL  | 14+            |

---

## Configuración de la base de datos

Crear la base de datos antes de levantar el backend:

```sql
CREATE DATABASE "FINAL_CALIDAD";
```

Credenciales por defecto (`application.properties`):

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/FINAL_CALIDAD
spring.datasource.username=postgres
spring.datasource.password=admin
```

> Modificar usuario/contraseña si difieren en tu entorno.

---

## Ejecución

### 1. Backend

```bash
cd backend
./mvnw spring-boot:run
```

El servidor inicia en `http://localhost:8080`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicación abre en `http://localhost:5173`.

---

## Endpoints de la API

| Método | Ruta                                  | Descripción                                      |
|--------|---------------------------------------|--------------------------------------------------|
| POST   | `/api/games`                          | Crear nueva partida (mínimo 4 jugadores)         |
| GET    | `/api/games/{gameId}`                 | Obtener estado actual de la partida              |
| POST   | `/api/games/{gameId}/hit`             | Jugador activo roba una carta                    |
| POST   | `/api/games/{gameId}/stand`           | Jugador activo se planta                         |
| POST   | `/api/games/{gameId}/target/{idx}`    | Aplicar Freeze/Flip Three al jugador `idx`       |
| POST   | `/api/games/{gameId}/transfer/{idx}`  | Transferir Segunda Oportunidad al jugador `idx`  |

---

## Reglas del juego

- **Objetivo:** llegar primero a 200 puntos acumulados entre rondas.
- **Hit:** robar una carta y sumar su valor.
- **Stand:** plantarse y conservar los puntos de la ronda.
- **Bust:** si sacas un número duplicado, obtienes 0 en esa ronda.
- **Flip 7:** 7 cartas numéricas únicas = +15 puntos bonus, turno automático.
- **Cartas especiales:**
  - ❄️ **Freeze** — congela a un jugador a elección.
  - 🔄 **Flip Three** — el objetivo roba 3 cartas.
  - 🛡️ **Segunda Oportunidad** — absorbe un bust.
  - ✨ **×2** — duplica la suma numérica de la ronda.
  - ➕ **+8 / +10** — suma fija al puntaje de la ronda.

---

## Tests

```bash
cd backend
./mvnw test
```

Cobertura con JaCoCo (reporte en `target/site/jacoco/index.html`).

---

## Tecnologías

- Spring Boot 3.3 · Spring Data JPA · Lombok
- PostgreSQL (producción) · H2 (tests)
- React 18 · Vite · Axios
