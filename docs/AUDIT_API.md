# API de Auditoría

Sistema completo de consulta de logs de auditoría para trazabilidad y cumplimiento normativo.

---

## 🔐 Requisitos de Acceso

**TODOS los endpoints requieren:**
- ✅ Autenticación (Bearer Token)
- ✅ Rol **AUDITOR** o **COORDINADOR**

---

## 📋 Endpoints Disponibles

### 1. Obtener Tipos de Entidades Disponibles
**`GET /audit/filters/entities`**

Devuelve la lista de tipos de entidades que tienen registros de auditoría.

**Uso:** Para popular un dropdown de "Tipo de Entidad" en filtros.

**Parámetros:**
- Ninguno

**Query Parameters:**
- Ninguno

**Headers:**
```
Authorization: Bearer <token>
```

**Ejemplo de Request:**
```bash
GET /audit/filters/entities
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta Exitosa (200):**
```json
{
  "ok": true,
  "data": [
    "Container",
    "Document",
    "Laboratory",
    "Medicine",
    "Production",
    "Stability",
    "User",
    "Vehicle"
  ]
}
```

**Notas:**
- Los tipos de entidad están ordenados alfabéticamente
- Solo devuelve entidades que tienen al menos un registro de auditoría
- Los nombres son exactamente como están en la base de datos

---

### 2. Obtener Lista de Usuarios con Acciones Auditables
**`GET /audit/filters/users`**

Devuelve la lista de usuarios que han realizado acciones registradas en auditoría.

**Uso:** Para popular un dropdown de "Usuario" en filtros.

**Parámetros:**
- Ninguno

**Query Parameters:**
- Ninguno

**Headers:**
```
Authorization: Bearer <token>
```

**Ejemplo de Request:**
```bash
GET /audit/filters/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta Exitosa (200):**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "username": "RBOCNETT",
      "nombre": "ROSA LEONOR BONETT VILA",
      "rolSistema": "COORDINADOR"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "username": "SARBELAEZ",
      "nombre": "SANTIAGO ARBELÁEZ GUZMAN",
      "rolSistema": "QUIMICO"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "username": "DRESTREPO",
      "nombre": "DAVID RESTREPO CRESPO",
      "rolSistema": "QUIMICO"
    }
  ]
}
```

**Campos Devueltos:**
- `_id` (string) - ObjectId del usuario
- `username` (string) - Username en mayúsculas
- `nombre` (string) - Nombre completo del usuario
- `rolSistema` (string) - Rol del usuario (AUXILIAR, QUIMICO, COORDINADOR, AUDITOR)

**Notas:**
- Ordenados alfabéticamente por nombre
- Solo incluye usuarios activos con acciones registradas
- No incluye el campo `hashPassword` por seguridad

---

### 3. Obtener Entidades Específicas de un Tipo
**`GET /audit/filters/entities/:entidad/items`**

Devuelve las entidades específicas de un tipo que tienen registros de auditoría.

**Uso:** Después de seleccionar un tipo de entidad, obtener las instancias específicas.

**Parámetros de Ruta:**
- `entidad` (string, requerido) - Tipo de entidad. Valores válidos:
  - `Production`
  - `Medicine`
  - `Vehicle`
  - `Container`
  - `Laboratory`
  - `Stability`
  - `User`
  - `Document`

**Query Parameters:**
- Ninguno

**Headers:**
```
Authorization: Bearer <token>
```

**Ejemplo de Request (Production):**
```bash
GET /audit/filters/entities/Production/items
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta Exitosa (200) - Production:**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "codigo": "PROD-20241120-0001",
      "estado": "CALCULADO",
      "lineaProduccion": "ONCO",
      "fechaProduccion": "2024-11-20T14:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "codigo": "PROD-20241120-0002",
      "estado": "VALIDADO",
      "lineaProduccion": "ESTERIL",
      "fechaProduccion": "2024-11-20T15:00:00.000Z"
    }
  ]
}
```

**Ejemplo de Request (Medicine):**
```bash
GET /audit/filters/entities/Medicine/items
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta Exitosa (200) - Medicine:**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "nombre": "BEVACIZUMAB",
      "concentracion": "25 mg/mL",
      "viaAdministracion": "Intravenosa"
    },
    {
      "_id": "507f1f77bcf86cd799439022",
      "nombre": "PACLITAXEL",
      "concentracion": "6 mg/mL",
      "viaAdministracion": "Intravenosa"
    }
  ]
}
```

**Ejemplo de Request (User):**
```bash
GET /audit/filters/entities/User/items
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta Exitosa (200) - User:**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439031",
      "username": "RBOCNETT",
      "nombre": "ROSA LEONOR BONETT VILA",
      "rolSistema": "COORDINADOR"
    }
  ]
}
```

**Campos Devueltos por Tipo de Entidad:**

| Entidad | Campos |
|---------|--------|
| Production | `_id`, `codigo`, `estado`, `lineaProduccion`, `fechaProduccion` |
| Medicine | `_id`, `nombre`, `concentracion`, `viaAdministracion` |
| Vehicle | `_id`, `nombre` |
| Container | `_id`, `tipo` |
| Laboratory | `_id`, `nombre` |
| User | `_id`, `username`, `nombre`, `rolSistema` |
| Document | `_id`, otros campos básicos |
| Stability | `_id` |

**Notas:**
- Límite de 100 entidades por tipo
- Ordenadas por fecha de creación (más recientes primero) o alfabéticamente según el tipo
- Si el tipo de entidad no existe, devuelve array vacío

---

### 4. Obtener Historial de Auditoría de una Entidad
**`GET /audit/:entidad/:entidadId`**

Obtiene el historial completo de auditoría de una entidad específica.

**Uso:** Ver todos los cambios realizados en una producción, medicamento, usuario, etc.

**Parámetros de Ruta:**
- `entidad` (string, requerido) - Tipo de entidad (Production, Medicine, User, etc.)
- `entidadId` (string, requerido) - ObjectId de la entidad

**Query Parameters:**
- `limit` (number, opcional) - Número máximo de registros a devolver (default: 50)

**Headers:**
```
Authorization: Bearer <token>
```

**Ejemplo de Request:**
```bash
GET /audit/Production/507f1f77bcf86cd799439011?limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta Exitosa (200):**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "674f1a2bcf86cd799439051",
      "entidad": "Production",
      "entidadId": "507f1f77bcf86cd799439011",
      "accion": "STATE_TRANSITION",
      "cambios": {
        "estadoAnterior": "VALIDADO",
        "estadoNuevo": "CALCULADO",
        "usuarioId": "507f1f77bcf86cd799439012"
      },
      "usuarioId": {
        "_id": "507f1f77bcf86cd799439012",
        "nombre": "SANTIAGO ARBELÁEZ GUZMAN",
        "email": "sarbelaez@hospital.com",
        "rol": "QUIMICO"
      },
      "timestamp": "2024-11-20T14:35:00.000Z",
      "createdAt": "2024-11-20T14:35:00.000Z"
    },
    {
      "_id": "674f1a1bcf86cd799439050",
      "entidad": "Production",
      "entidadId": "507f1f77bcf86cd799439011",
      "accion": "STATE_TRANSITION",
      "cambios": {
        "estadoAnterior": "CREADO",
        "estadoNuevo": "VALIDADO",
        "usuarioId": "507f1f77bcf86cd799439011"
      },
      "usuarioId": {
        "_id": "507f1f77bcf86cd799439011",
        "nombre": "ROSA LEONOR BONETT VILA",
        "email": "rbocnett@hospital.com",
        "rol": "COORDINADOR"
      },
      "timestamp": "2024-11-20T14:30:00.000Z",
      "createdAt": "2024-11-20T14:30:00.000Z"
    },
    {
      "_id": "674f1a0acf86cd799439049",
      "entidad": "Production",
      "entidadId": "507f1f77bcf86cd799439011",
      "accion": "CREATE",
      "cambios": {
        "codigo": "PROD-20241120-0001",
        "cantidadMezclas": 3,
        "lineaProduccion": "ONCO"
      },
      "usuarioId": {
        "_id": "507f1f77bcf86cd799439013",
        "nombre": "DAVID RESTREPO CRESPO",
        "email": "drestrepo@hospital.com",
        "rol": "QUIMICO"
      },
      "timestamp": "2024-11-20T14:25:00.000Z",
      "createdAt": "2024-11-20T14:25:00.000Z"
    }
  ]
}
```

**Campos del Log de Auditoría:**
- `_id` (string) - ID del registro de auditoría
- `entidad` (string) - Tipo de entidad afectada
- `entidadId` (string) - ID de la entidad afectada
- `accion` (string) - Tipo de acción realizada (CREATE, UPDATE, DELETE, STATE_TRANSITION)
- `cambios` (object) - Objeto con los cambios realizados
- `usuarioId` (object) - Usuario que realizó la acción (populado con datos)
- `timestamp` (string) - Fecha y hora de la acción
- `createdAt` (string) - Fecha de creación del registro

**Tipos de Acciones:**
- `CREATE` - Creación de la entidad
- `UPDATE` - Actualización de campos
- `DELETE` - Eliminación de la entidad
- `STATE_TRANSITION` - Cambio de estado (específico para producciones)

**Errores Posibles:**

**400 - Bad Request:**
```json
{
  "ok": false,
  "error": "ID de entidad inválido"
}
```

**404 - Not Found:**
Si la entidad no existe o no tiene registros de auditoría, devuelve array vacío:
```json
{
  "ok": true,
  "data": []
}
```

---

### 5. Obtener Acciones de un Usuario
**`GET /audit/user/:userId`**

Obtiene todas las acciones realizadas por un usuario específico.

**Uso:** Ver el historial completo de acciones de un usuario en el sistema.

**Parámetros de Ruta:**
- `userId` (string, requerido) - ObjectId del usuario

**Query Parameters:**
- `limit` (number, opcional) - Número máximo de registros a devolver (default: 50)

**Headers:**
```
Authorization: Bearer <token>
```

**Ejemplo de Request:**
```bash
GET /audit/user/507f1f77bcf86cd799439011?limit=30
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta Exitosa (200):**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "674f1a2bcf86cd799439051",
      "entidad": "Production",
      "entidadId": "507f1f77bcf86cd799439011",
      "accion": "STATE_TRANSITION",
      "cambios": {
        "estadoAnterior": "VALIDADO",
        "estadoNuevo": "CALCULADO"
      },
      "usuarioId": "507f1f77bcf86cd799439011",
      "timestamp": "2024-11-20T14:35:00.000Z"
    },
    {
      "_id": "674f1a1bcf86cd799439050",
      "entidad": "User",
      "entidadId": "507f1f77bcf86cd799439012",
      "accion": "UPDATE",
      "cambios": {
        "cargo": "QUÍMICO SENIOR",
        "rolSistema": "QUIMICO"
      },
      "usuarioId": "507f1f77bcf86cd799439011",
      "timestamp": "2024-11-20T14:20:00.000Z"
    },
    {
      "_id": "674f1a0acf86cd799439049",
      "entidad": "Medicine",
      "entidadId": "507f1f77bcf86cd799439021",
      "accion": "CREATE",
      "cambios": {
        "nombre": "PACLITAXEL",
        "concentracion": "6 mg/mL"
      },
      "usuarioId": "507f1f77bcf86cd799439011",
      "timestamp": "2024-11-20T14:10:00.000Z"
    }
  ]
}
```

**Notas:**
- Las acciones están ordenadas por fecha (más recientes primero)
- Incluye acciones en todas las entidades
- El campo `usuarioId` NO está populado (solo contiene el ID)

**Errores Posibles:**

**400 - Bad Request:**
```json
{
  "ok": false,
  "error": "ID de usuario inválido"
}
```

---

### 6. Obtener Acciones por Tipo de Entidad
**`GET /audit/entity/:entidad`**

Obtiene todas las acciones realizadas sobre un tipo específico de entidad.

**Uso:** Ver todas las acciones realizadas en todas las producciones, medicamentos, etc.

**Parámetros de Ruta:**
- `entidad` (string, requerido) - Tipo de entidad (Production, Medicine, User, etc.)

**Query Parameters:**
- `limit` (number, opcional) - Número máximo de registros a devolver (default: 50)

**Headers:**
```
Authorization: Bearer <token>
```

**Ejemplo de Request:**
```bash
GET /audit/entity/Production?limit=25
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta Exitosa (200):**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "674f1a2bcf86cd799439051",
      "entidad": "Production",
      "entidadId": "507f1f77bcf86cd799439011",
      "accion": "STATE_TRANSITION",
      "cambios": {
        "estadoAnterior": "VALIDADO",
        "estadoNuevo": "CALCULADO",
        "usuarioId": "507f1f77bcf86cd799439012"
      },
      "usuarioId": {
        "_id": "507f1f77bcf86cd799439012",
        "nombre": "SANTIAGO ARBELÁEZ GUZMAN",
        "email": "sarbelaez@hospital.com",
        "rol": "QUIMICO"
      },
      "timestamp": "2024-11-20T14:35:00.000Z"
    },
    {
      "_id": "674f1a1bcf86cd799439050",
      "entidad": "Production",
      "entidadId": "507f1f77bcf86cd799439012",
      "accion": "CREATE",
      "cambios": {
        "codigo": "PROD-20241120-0002",
        "cantidadMezclas": 1,
        "lineaProduccion": "ESTERIL"
      },
      "usuarioId": {
        "_id": "507f1f77bcf86cd799439011",
        "nombre": "ROSA LEONOR BONETT VILA",
        "email": "rbocnett@hospital.com",
        "rol": "COORDINADOR"
      },
      "timestamp": "2024-11-20T14:25:00.000Z"
    }
  ]
}
```

**Notas:**
- Las acciones están ordenadas por fecha (más recientes primero)
- Incluye acciones en todas las instancias del tipo de entidad
- El campo `usuarioId` SÍ está populado con datos del usuario

---

## 📊 Resumen de Endpoints

| Método | Ruta | Propósito | Populado |
|--------|------|-----------|----------|
| GET | `/audit/filters/entities` | Lista tipos de entidades | N/A |
| GET | `/audit/filters/users` | Lista usuarios con acciones | Sí |
| GET | `/audit/filters/entities/:entidad/items` | Lista entidades específicas | Parcial |
| GET | `/audit/:entidad/:entidadId` | Historial de una entidad | Sí (usuario) |
| GET | `/audit/user/:userId` | Acciones de un usuario | No |
| GET | `/audit/entity/:entidad` | Acciones por tipo de entidad | Sí (usuario) |

---

## 🔄 Flujo de Uso Recomendado

### Caso 1: Auditoría de una Entidad Específica

```javascript
// 1. Obtener tipos de entidades
const { data: types } = await axios.get('/audit/filters/entities');
// Resultado: ["Production", "Medicine", "User", ...]

// 2. Usuario selecciona "Production"
const selectedType = "Production";

// 3. Obtener producciones disponibles
const { data: items } = await axios.get(
  `/audit/filters/entities/${selectedType}/items`
);
// Resultado: [{ _id: "...", codigo: "PROD-20241120-0001", ... }]

// 4. Usuario selecciona una producción
const selectedId = "507f1f77bcf86cd799439011";

// 5. Obtener historial de auditoría
const { data: history } = await axios.get(
  `/audit/${selectedType}/${selectedId}?limit=50`
);
// Resultado: Array de logs con cambios
```

### Caso 2: Auditoría por Usuario

```javascript
// 1. Obtener lista de usuarios
const { data: users } = await axios.get('/audit/filters/users');
// Resultado: [{ _id: "...", nombre: "ROSA LEONOR BONETT VILA", ... }]

// 2. Usuario selecciona un usuario
const selectedUserId = "507f1f77bcf86cd799439011";

// 3. Obtener todas sus acciones
const { data: actions } = await axios.get(
  `/audit/user/${selectedUserId}?limit=100`
);
// Resultado: Array de todas las acciones del usuario
```

### Caso 3: Ver Todas las Acciones de Producción

```javascript
// Obtener todas las acciones realizadas en producciones
const { data: productionActions } = await axios.get(
  '/audit/entity/Production?limit=100'
);
// Resultado: Array de acciones en todas las producciones
```

---

## 📊 Respuestas de Error

### Error 400 - Bad Request
```json
{
  "ok": false,
  "error": "ID de entidad inválido"
}
```

```json
{
  "ok": false,
  "error": "ID de usuario inválido"
}
```

### Error 401 - No Autenticado
```json
{
  "ok": false,
  "error": "Token no válido o expirado"
}
```

### Error 403 - Sin Permisos
```json
{
  "ok": false,
  "error": "Acceso denegado. Se requiere rol AUDITOR o COORDINADOR"
}
```

### Error 500 - Error del Servidor
```json
{
  "ok": false,
  "error": "Error al obtener historial de auditoría"
}
```

```json
{
  "ok": false,
  "error": "Error al obtener acciones del usuario"
}
```

```json
{
  "ok": false,
  "error": "Error al obtener acciones por entidad"
}
```

---

## 🎨 Ejemplo de Implementación en Frontend

### React - Componente de Filtros de Auditoría

```jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

function AuditFilters() {
  const [filterType, setFilterType] = useState('entity'); // 'entity' o 'user'
  
  // Para filtro por entidad
  const [entityTypes, setEntityTypes] = useState([]);
  const [selectedEntityType, setSelectedEntityType] = useState('');
  const [entityItems, setEntityItems] = useState([]);
  const [selectedEntityId, setSelectedEntityId] = useState('');
  
  // Para filtro por usuario
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  
  // Resultados
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar tipos de entidades al montar
  useEffect(() => {
    const fetchEntityTypes = async () => {
      try {
        const { data } = await axios.get('/audit/filters/entities');
        setEntityTypes(data.data);
      } catch (error) {
        console.error('Error al cargar tipos de entidades:', error);
      }
    };
    
    const fetchUsers = async () => {
      try {
        const { data } = await axios.get('/audit/filters/users');
        setUsers(data.data);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
      }
    };

    fetchEntityTypes();
    fetchUsers();
  }, []);

  // Cargar items cuando se selecciona un tipo de entidad
  useEffect(() => {
    if (selectedEntityType) {
      const fetchItems = async () => {
        try {
          const { data } = await axios.get(
            `/audit/filters/entities/${selectedEntityType}/items`
          );
          setEntityItems(data.data);
          setSelectedEntityId('');
        } catch (error) {
          console.error('Error al cargar items:', error);
        }
      };
      fetchItems();
    }
  }, [selectedEntityType]);

  // Buscar logs
  const handleSearch = async () => {
    setLoading(true);
    try {
      let response;
      
      if (filterType === 'entity' && selectedEntityType && selectedEntityId) {
        response = await axios.get(
          `/audit/${selectedEntityType}/${selectedEntityId}?limit=100`
        );
      } else if (filterType === 'user' && selectedUserId) {
        response = await axios.get(
          `/audit/user/${selectedUserId}?limit=100`
        );
      }
      
      if (response) {
        setAuditLogs(response.data.data);
      }
    } catch (error) {
      console.error('Error al buscar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="audit-filters">
      {/* Selector de tipo de filtro */}
      <div className="filter-type-selector">
        <label>
          <input
            type="radio"
            value="entity"
            checked={filterType === 'entity'}
            onChange={(e) => setFilterType(e.target.value)}
          />
          Filtrar por Entidad
        </label>
        <label>
          <input
            type="radio"
            value="user"
            checked={filterType === 'user'}
            onChange={(e) => setFilterType(e.target.value)}
          />
          Filtrar por Usuario
        </label>
      </div>

      {/* Filtro por entidad */}
      {filterType === 'entity' && (
        <div className="entity-filter">
          <select
            value={selectedEntityType}
            onChange={(e) => setSelectedEntityType(e.target.value)}
          >
            <option value="">Seleccione tipo de entidad</option>
            {entityTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {selectedEntityType && (
            <select
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
            >
              <option value="">Seleccione {selectedEntityType}</option>
              {entityItems.map(item => (
                <option key={item._id} value={item._id}>
                  {item.codigo || item.nombre || item.username || item._id}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Filtro por usuario */}
      {filterType === 'user' && (
        <div className="user-filter">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            <option value="">Seleccione usuario</option>
            {users.map(user => (
              <option key={user._id} value={user._id}>
                {user.nombre} ({user.username})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Botón de búsqueda */}
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Buscando...' : 'Buscar'}
      </button>

      {/* Resultados */}
      <div className="audit-logs">
        {auditLogs.map(log => (
          <div key={log._id} className="audit-log-item">
            <div className="log-header">
              <span className="action">{log.accion}</span>
              <span className="entity">{log.entidad}</span>
              <span className="timestamp">
                {new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
            <div className="log-user">
              Usuario: {log.usuarioId?.nombre || log.usuarioId}
            </div>
            <div className="log-changes">
              <pre>{JSON.stringify(log.cambios, null, 2)}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AuditFilters;
```

---

## 📖 Documentación Swagger

Toda la API está documentada en Swagger:

```
http://localhost:PORT/docs
```

Busca la sección **"Audit"** para ver y probar todos los endpoints interactivamente.

---

## 🔒 Seguridad

### Autenticación
- Bearer Token en header `Authorization`
- Token generado en `/auth/login`

### Autorización
- Solo roles **AUDITOR** y **COORDINADOR**
- Validación en cada request

### Datos Sensibles
- Nunca se devuelve `hashPassword`
- Los cambios en auditoría no incluyen contraseñas

---

## ⚡ Performance y Límites

| Aspecto | Valor |
|---------|-------|
| Límite por defecto | 50 registros |
| Límite máximo configurable | Sin límite en query |
| Límite de entidades específicas | 100 items |
| Caché | No implementado (datos en tiempo real) |
| Ordenamiento | Descendente por timestamp |

---

## 💡 Buenas Prácticas

1. **Usar límites apropiados** - No cargar más de 100 registros a la vez
2. **Filtrar antes de mostrar** - Usar los filtros en lugar de cargar todo
3. **Mostrar timestamp formateado** - Usar fecha local del usuario
4. **Indicar tipo de acción** - Usar colores o iconos según la acción
5. **Expandir cambios** - Permitir ver detalles en modal o dropdown

---

**Última actualización:** 20 de noviembre, 2024  
**Versión:** 1.0.0


