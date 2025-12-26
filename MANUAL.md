# Manual Técnico y Funcional: DevolucionesPro

## 1. Propósito del Sistema

**DevolucionesPro** es una aplicación web diseñada para la gestión integral del proceso de despachos, legalización de facturas y manejo de devoluciones de productos. El sistema permite a los usuarios (Administradores y Auditores) tener una visibilidad completa y control sobre la logística de entrega, desde que un producto es despachado hasta que es recibido por el cliente y se legaliza la factura correspondiente.

El objetivo principal es centralizar la información, automatizar el seguimiento y generar reportes clave para la toma de decisiones.

---

## 2. Arquitectura y Pila Tecnológica (Tech Stack)

La aplicación está construida con un conjunto de tecnologías modernas que garantizan un alto rendimiento, una excelente experiencia de usuario y una base de código mantenible.

- **Lenguaje Principal:** **TypeScript**. Se utiliza en todo el proyecto para asegurar un código robusto, tipado y menos propenso a errores en tiempo de ejecución.

- **Framework Frontend:** **Next.js (con App Router)**. Es el corazón de la aplicación. Se utiliza el App Router, que favorece el renderizado en el servidor (Server Components) para un rendimiento óptimo y una carga inicial rápida.

- **Librería de UI:** **React**. La interfaz de usuario está construida con componentes de React, siguiendo patrones modernos como Hooks y componentes funcionales.

- **Componentes de UI:** **Shadcn/UI**. La mayoría de los componentes visuales (botones, modales, tablas, tarjetas, etc.) provienen de esta librería, que proporciona componentes accesibles y personalizables.

- **Estilos CSS:** **Tailwind CSS**. Se utiliza para estilizar la aplicación de forma rápida y consistente mediante un enfoque de "utility-first". El tema de colores y estilos se centraliza en `src/app/globals.css`.

- **Iconos:** **Lucide React**. Una librería de iconos ligera y completa que se usa en toda la interfaz para mejorar la usabilidad.

- **Visualización de Datos (Gráficos):** **Recharts**. Se emplea para crear los gráficos de barras y circulares en los dashboards, permitiendo una visualización clara de los indicadores (KPIs).

- **Gestión de Formularios:** **React Hook Form**. Facilita la creación y validación de formularios complejos, como los de inicio de sesión y edición. Se combina con **Zod** para la validación de esquemas de datos.

- **Manejo de Archivos Excel:** Las librerías **xlsx** y **file-saver** se utilizan para la funcionalidad de importación de datos desde archivos Excel y la exportación de reportes.

---

## 3. Estructura de Archivos Clave

- `src/app/`: Contiene la estructura de rutas de la aplicación.
  - `(auth)/login/`: Página de inicio de sesión.
  - `dashboard/`: Layout y páginas protegidas del panel de control.
    - `layout.tsx`: Define la estructura principal del dashboard (barra lateral y cabecera).
    - `despachos/`, `facturas/`, `reportes/`, `usuarios/`: Cada una es una página del dashboard.
- `src/components/`: Almacena los componentes reutilizables de React.
  - `auth/`: Componentes relacionados con la autenticación (ej. `login-form.tsx`).
  - `dashboard/`: Componentes específicos de las páginas del dashboard.
  - `ui/`: Componentes base de Shadcn/UI (ej. `button.tsx`, `dialog.tsx`).
- `src/lib/`: Contiene la lógica de negocio, tipos de datos y utilidades.
  - `types.ts`: Define las interfaces de datos principales (`Despacho`, `Product`, `User`).
  - `data.ts`: Proporciona los datos de ejemplo (`mock`) para la aplicación.
  - `excel-export.ts`, `excel-template.ts`: Lógica para importar/exportar archivos Excel.

---

## 4. Funcionalidades Principales

### 4.1. Autenticación
- **Inicio de Sesión:** La aplicación inicia en una página de login (`/login`). Actualmente, la autenticación es simulada, pero está preparada para integrarse con un proveedor real.

### 4.2. Dashboard Principal
El layout del dashboard (`/dashboard`) es responsivo e incluye:
- **Barra Lateral (Sidebar):** Permite la navegación entre las diferentes secciones. Es colapsable para maximizar el espacio de trabajo.
- **Cabecera:** Muestra información del usuario y un botón para cerrar sesión.
- **Contenido Principal:** El área donde se renderiza cada página.

### 4.3. Módulo de Despachos (`/dashboard/despachos`)
- **Panel de KPIs:** Muestra tarjetas con indicadores clave:
  - Total de despachos.
  - Despachos completos, incompletos y pendientes.
- **Gráficos:**
  - **Distribución de Estados:** Un gráfico circular que muestra la proporción de cada estado de despacho.
  - **Unidades Despachadas vs. Recibidas:** Un gráfico de barras que compara las cantidades totales.

### 4.4. Módulo de Facturas (`/dashboard/facturas`)
- **Tabla de Despachos:** Es la funcionalidad central. Muestra una lista detallada de todos los despachos, con información como:
  - Número de factura, cliente, ciudad, placa.
  - Unidades despachadas, recibidas y devueltas.
  - Montos totales.
  - **Estado Dinámico:** El estado del despacho cambia de color según su urgencia (ej. "Pendiente Crítico" en rojo).
- **Acciones:**
  - **Filtrado y Búsqueda:** Permite buscar despachos por múltiples criterios y filtrar por estado.
  - **Carga Masiva:** Un botón para abrir una modal que permite cargar despachos desde un archivo Excel (`.xlsx`). Se proporciona una plantilla descargable.
  - **Legalizar / Editar:** Abre una modal (`EditDespachoDialog`) donde el auditor puede actualizar las cantidades recibidas de cada producto, cambiar el estado del despacho y adjuntar documentos (simulado).
  - **Eliminar:** Permite borrar un despacho.

### 4.5. Módulo de Reportes (`/dashboard/reportes`)
- **Visualización:** Muestra tres reportes principales en forma de gráficos y tablas:
  1. Conteo de despachos por estado.
  2. Top 10 de productos con más devoluciones.
  3. Resumen de actividad (despachos y montos) por cliente.
- **Exportación:** Cada reporte se puede descargar en formato Excel.

### 4.6. Módulo de Usuarios (`/dashboard/usuarios`)
- **Gestión de Usuarios:** Permite a los administradores:
  - Ver una lista de todos los usuarios del sistema.
  - Crear nuevos usuarios (con nombre, email, contraseña y rol).
  - Editar la información de usuarios existentes.
  - Activar o inactivar usuarios.
- **Paginación y Búsqueda:** La tabla de usuarios está paginada e incluye una barra de búsqueda.
