# Correcciones y Mejoras - API de Auditoría

## 🐛 Problemas Corregidos

### 1. Error "ID de entidad inválido"
**Problema:** El endpoint validaba el ID antes de procesarlo, pero no mostraba información útil.

**Solución:** Se agregó logging detallado para identificar IDs problemáticos.

**Logging agregado:**
```typescript
console.log('[AUDIT] Obteniendo historial:', { entidad, entidadId, limit });
if (!Types.ObjectId.isValid(entidadId)) {
  console.error('[AUDIT] ID de entidad inválido:', entidadId);
  throw new ResponseError(400, 'ID de entidad inválido');
}
```

**Causas comunes:**
- ID no es un ObjectId válido de MongoDB (24 caracteres hexadecimales)
- Se está enviando `undefined`, `null` o string vacío
- ID viene con espacios o caracteres especiales

**Cómo verificar:**
```bash
# ID válido (24 caracteres hex)
GET /audit/Production/507f1f77bcf86cd799439011

# ID inválido (generará error)
GET /audit/Production/123
GET /audit/Production/undefined
```

---

### 2. Arrays Vacíos en Respuestas

**Problema:** Los endpoints devolvían arrays vacíos `[]`.

**Causas posibles:**
1. **No hay datos de auditoría en la base de datos**
2. **El usuarioId no coincide** (busca por ID que no existe)
3. **La entidad no tiene registros** de auditoría

**Solución:** Se agregó logging en todos los endpoints para identificar cuántos registros se encuentran.

**Logging agregado:**
```typescript
// En getAvailableUsers
console.log('[AUDIT] Usuarios encontrados:', users.length);

// En getUserActions
console.log('[AUDIT] Acciones encontradas:', actions.length);

// En getHistory
console.log('[AUDIT] Registros encontrados:', history.length);
```

**Cómo verificar si hay datos:**
```bash
# Nuevo endpoint: Ver TODAS las auditorías
GET /audit/all

# Si devuelve vacío, no hay datos de auditoría en el sistema
```

---

### 3. Campos de Usuario Incorrectos

**Problema:** Los populate usaban campos antiguos (`email`, `rol`) que no existen en el modelo User.

**Solución:** Se actualizaron todos los populate con los campos correctos del modelo User:

**Antes:**
```typescript
.populate('usuarioId', 'nombre email rol')
```

**Ahora:**
```typescript
.populate('usuarioId', 'nombre username email rolSistema')
```

**Campos del modelo User:**
- ✅ `nombre` - Nombre completo
- ✅ `username` - Username (RBOCNETT, SARBELAEZ, etc.)
- ✅ `email` - Email (puede no existir en algunos registros)
- ✅ `rolSistema` - Rol (AUXILIAR, QUIMICO, COORDINADOR, AUDITOR)

---

## 🆕 Nuevo Endpoint: Todas las Auditorías

### **GET /audit/all**

Obtiene todas las auditorías del sistema con paginación.

**Uso:** Ver todos los registros de auditoría sin filtros.

**Query Parameters:**
- `limit` (number, opcional) - Máximo de registros (default: 100)
- `skip` (number, opcional) - Registros a saltar para paginación (default: 0)

**Ejemplo de Request:**
```bash
GET /audit/all?limit=50&skip=0
Authorization: Bearer <token>
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
      "usuarioId": {
        "_id": "507f1f77bcf86cd799439012",
        "nombre": "SANTIAGO ARBELÁEZ GUZMAN",
        "username": "SARBELAEZ",
        "email": "sarbelaez@hospital.com",
        "rolSistema": "QUIMICO"
      },
      "timestamp": "2024-11-20T14:35:00.000Z"
    }
  ],
  "pagination": {
    "total": 250,
    "limit": 50,
    "skip": 0
  }
}
```

**Casos de uso:**
- ✅ Ver todas las acciones del sistema
- ✅ Exportar auditoría completa
- ✅ Dashboard de actividad general
- ✅ Verificar si hay datos de auditoría

---

## 📊 Orden de Prueba Recomendado

### 1. Verificar si Hay Datos
```bash
GET /audit/all?limit=10
```

**Resultado esperado:**
- Si `data` está vacío → No hay registros de auditoría en el sistema
- Si `total: 0` → La base de datos no tiene auditorías
- Si hay datos → Continuar con las pruebas

---

### 2. Ver Tipos de Entidades Disponibles
```bash
GET /audit/filters/entities
```

**Resultado esperado:**
```json
{
  "ok": true,
  "data": ["Production", "Medicine", "User", ...]
}
```

Si devuelve array vacío → No hay ningún registro de auditoría

---

### 3. Ver Usuarios con Acciones
```bash
GET /audit/filters/users
```

**Resultado esperado:**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f...",
      "username": "RBOCNETT",
      "nombre": "ROSA LEONOR BONETT VILA",
      "rolSistema": "COORDINADOR"
    }
  ]
}
```

Si devuelve array vacío → Ningún usuario ha realizado acciones auditables

---

### 4. Ver Entidades Específicas de un Tipo
```bash
# Primero obtener un tipo de entidad del paso 2
GET /audit/filters/entities/Production/items
```

**Resultado esperado:**
```json
{
  "ok": true,
  "data": [
    {
      "_id": "507f...",
      "codigo": "PROD-20241120-0001",
      "estado": "CALCULADO",
      "lineaProduccion": "ONCO"
    }
  ]
}
```

Si devuelve array vacío → No hay producciones con auditoría

---

### 5. Ver Historial de una Entidad
```bash
# Usar un ID del paso 4
GET /audit/Production/507f1f77bcf86cd799439011
```

**Resultado esperado:** Array de logs de auditoría de esa producción

---

### 6. Ver Acciones de un Usuario
```bash
# Usar un ID del paso 3
GET /audit/user/507f1f77bcf86cd799439011
```

**Resultado esperado:** Array de todas las acciones de ese usuario

---

## 🔍 Debugging con Logs

Todos los endpoints ahora tienen logging detallado en consola del servidor:

```
[AUDIT] Obteniendo todas las auditorías: { limit: 100, skip: 0 }
[AUDIT] Total de auditorías: 250

[AUDIT] Obteniendo usuarios disponibles
[AUDIT] Usuarios encontrados: 5

[AUDIT] Obteniendo acciones de usuario: { userId: '507f...', limit: 50 }
[AUDIT] Acciones encontradas: 12

[AUDIT] Obteniendo historial: { entidad: 'Production', entidadId: '507f...', limit: 50 }
[AUDIT] Registros encontrados: 8
```

**Si ves en los logs:**
- `encontradas: 0` o `encontrados: 0` → No hay datos para ese filtro
- `ID de entidad inválido:` → El ID enviado no es válido
- `[AUDIT ERROR]:` → Hay un error en el servicio

---

## 🛠️ Cómo Generar Datos de Auditoría de Prueba

Si no hay datos de auditoría, debes realizar acciones que las generen:

### 1. Crear una Producción
```bash
POST /productions
# Esto genera un log de auditoría con acción: CREATE
```

### 2. Cambiar Estado de Producción
```bash
POST /productions/:id/advance
# Esto genera un log con acción: STATE_TRANSITION
```

### 3. Actualizar un Usuario
```bash
PUT /users/:id
# Esto debería generar un log con acción: UPDATE
```

### 4. Crear Medicamento/Vehículo/Envase
```bash
POST /catalog/medicines
POST /catalog/vehicles
POST /catalog/containers
# Si tienen auditoría, generarán logs
```

---

## 📋 Resumen de Endpoints

| Endpoint | Descripción | Requiere Datos |
|----------|-------------|----------------|
| `GET /audit/all` | **Todas las auditorías** | No (muestra si no hay) |
| `GET /audit/filters/entities` | Tipos de entidades | Sí |
| `GET /audit/filters/users` | Usuarios con acciones | Sí |
| `GET /audit/filters/entities/:entidad/items` | Entidades específicas | Sí |
| `GET /audit/:entidad/:entidadId` | Historial de entidad | Sí |
| `GET /audit/user/:userId` | Acciones de usuario | Sí |
| `GET /audit/entity/:entidad` | Acciones por tipo | Sí |

---

## ⚠️ Notas Importantes

1. **Si todos los endpoints devuelven array vacío:**
   - La base de datos no tiene registros de auditoría
   - Usa `GET /audit/all` para confirmar
   - Realiza acciones para generar auditorías (crear producción, etc.)

2. **Error "ID de entidad inválido":**
   - Verifica que el ID sea un ObjectId válido de MongoDB (24 caracteres hex)
   - Revisa los logs del servidor para ver qué ID se está enviando
   - Usa `GET /audit/filters/entities/:entidad/items` para obtener IDs válidos

3. **Campos de usuario en respuestas:**
   - Si `email` viene como `null` o `undefined`, es normal (no todos los usuarios tienen email)
   - Usa `username` o `nombre` para identificar usuarios
   - `rolSistema` siempre está presente

4. **Performance:**
   - El endpoint `/audit/all` puede ser lento si hay muchos registros
   - Usa `limit` y `skip` para paginación
   - Por defecto trae 100 registros

---

**Última actualización:** 20 de noviembre, 2024  
**Versión:** 1.1.0

