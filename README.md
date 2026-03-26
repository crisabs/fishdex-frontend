# Fishdex Frontend

Frontend en Vue 3 + Vite preparado para ejecutar en Docker y consumir la API Fishdex con JWT.

## Requisitos

- Docker
- Docker Compose

## Configuracion

1. Copia el archivo de entorno:

```bash
cp .env.example .env
```

2. Si tu backend no corre en `http://localhost:8000`, ajusta `VITE_API_BASE_URL`.

## Ejecutar con Docker

```bash
docker compose up --build
```

La app quedara disponible en:

- [http://localhost:5173](http://localhost:5173)

## Despliegue en GitHub Pages

El proyecto queda preparado para publicarse desde GitHub Pages usando GitHub Actions.

1. En GitHub, entra en `Settings > Pages`.
2. En `Source`, selecciona `GitHub Actions`.
3. Haz push a la rama principal y el workflow desplegara automaticamente el contenido de `dist`.

Detalles de la configuracion:

- En despliegues de GitHub Pages, Vite usa la base `/<repo>/`.
- El router usa `hash history` en Pages para evitar errores al recargar rutas.
- El build genera tambien `dist/404.html`, lo que ayuda a que Pages resuelva mejor la SPA.

## Endpoints integrados

- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `POST /api/auth/register/`
- `POST /api/auth/logout/`
- `GET /api/fishers/me/`
- `PATCH /api/fishers/nickname/`
- `PATCH /api/fishers/change-zone/`
- `GET /api/fish/get-list-fishes/`
- `GET /api/fish/get-fish-details/?fish_id=...`
- `GET /api/inventory/items/`
- `GET /api/inventory/fishes/`
- `POST /api/inventory/fish-sell/`
- `PATCH /api/inventory/fisher-fish-description/`
- `PUT /api/store/buy-item/`

## JWT

- El `access` token se envia en `Authorization: Bearer <token>`.
- El `refresh` token se guarda para refrescar sesion y para el logout.

## Nota sobre login

El backend usa `TokenObtainPairView`. En este proyecto el formulario envia:

```json
{
  "username": "your-email@domain.com",
  "password": "your-password"
}
```

Esto sigue la implementacion actual del backend, donde el usuario se crea con `username=email`.
