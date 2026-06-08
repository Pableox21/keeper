# Keeper Frontend 📦

Sistema de gestión empresarial desarrollado con React y tecnologías modernas. Aplicación de página única (SPA) con sistema de pestañas dinámico y arquitectura basada en Atomic Design.

## 🚀 Tecnologías

- **React 19.x** - Framework principal
- **Vite 7.x** - Build tool y servidor de desarrollo
- **Tailwind CSS 4.x** - Framework de utilidades CSS
- **DaisyUI 5.x** - Componentes predefinidos
- **Heroicons 2.x** - Librería de iconos SVG
- **React Router** - Enrutamiento simplificado

## 📁 Estructura del Proyecto

```
frontend/src/
├── components/           # Componentes reutilizables (Atomic Design)
│   ├── atoms/           # Componentes atómicos (botones, inputs, labels, etc.)
│   ├── molecules/       # Combinación de átomos (formularios, cards, etc.)
│   ├── organisms/       # Componentes complejos y autónomos
│   │   ├── Header.jsx   # Barra superior con navegación completa
│   │   ├── Sidebar.jsx  # Navegación lateral con menú completo
│   │   └── TabManager.jsx # Sistema completo de pestañas con drag & drop
│   └── templates/       # Plantillas de layout de página
├── pages/               # Páginas principales de la aplicación
│   └── Dashboard.jsx    # Página única que integra todos los organisms
├── assets/              # Recursos estáticos (imágenes, fonts, etc.)
├── App.jsx              # Componente raíz con enrutamiento
├── main.jsx             # Punto de entrada de la aplicación
├── index.css            # Estilos globales con Tailwind CSS
└── App.css              # Estilos adicionales del componente App
```

## 🎯 Componentes Principales

### **organisms/Header.jsx**
- **Organism**: Barra superior compleja con múltiples funcionalidades
- Botón de hamburguesa para sidebar
- Logo de la aplicación
- Menú de usuario y notificaciones
- Integra múltiples elementos de UI

### **organisms/Sidebar.jsx**
- **Organism**: Sistema de navegación lateral completo
- 10 secciones de navegación con iconos
- Animaciones de contracción/expansión
- Integración con sistema de pestañas
- Estado y comportamiento autónomo

### **organisms/TabManager.jsx**
- **Organism**: Sistema complejo de gestión de pestañas
- Drag & Drop para reordenar pestañas
- Botones de cierre individuales
- Integración visual perfecta con contenido
- Manejo completo de estado de pestañas

### **pages/Dashboard.jsx**
- Layout principal que integra todos los componentes
- Manejo de estado global de pestañas
- Renderizado dinámico de contenido por pestaña

## 🏗️ Arquitectura

- **Atomic Design**: Estructura completa implementada
  - `atoms/`: Componentes básicos reutilizables
  - `molecules/`: Combinaciones de átomos
  - `organisms/`: Componentes complejos autónomos (Header, Sidebar, TabManager)
  - `templates/`: Plantillas de layout
- **Single Page Application**: Solo Dashboard como página principal
- **Component-Based**: Separación clara de responsabilidades por niveles
- **State Management**: Estado local con React Hooks
- **Modern React**: Hooks, functional components, JSDoc completo

## ⚡ Funcionalidades

### Sistema de Pestañas Dinámico
- ✅ Abrir pestañas desde navegación lateral
- ✅ Cerrar pestañas individualmente
- ✅ Drag & Drop para reordenar pestañas
- ✅ Prevención de duplicados
- ✅ Gestión automática de pestaña activa

### Navegación
- ✅ Sidebar colapsible con animaciones
- ✅ 10 secciones empresariales
- ✅ Iconos Heroicons en cada sección
- ✅ Integración perfecta con sistema de pestañas

### UI/UX
- ✅ Diseño responsive
- ✅ Animaciones suaves
- ✅ Tema consistente con Tailwind CSS
- ✅ Componentes DaisyUI

## 🛠️ Desarrollo

### Instalación
```bash
npm install
```

### Servidor de desarrollo
```bash
npm run dev
```

### Build para producción
```bash
npm run build
```

### Preview de producción
```bash
npm run preview
```

## 📝 Documentación

Todos los componentes incluyen:
- JSDoc completo con parámetros y descripciones
- Comentarios inline explicativos
- TODOs para futuras mejoras
- Características y funcionalidades documentadas

## 🎨 Secciones de la Aplicación

1. **Productos** - Gestión de productos
2. **Precios de venta** - Configuración de precios
3. **Almacenes** - Gestión de almacenes
4. **Ordenes de trabajo** - Control de órdenes
5. **Inventario inicial** - Configuración inicial
6. **Salida a uso de material** - Control de salidas
7. **Ingresos de prod.** - Registro de ingresos
8. **Bodega** - Gestión de bodega
9. **Traspaso** - Movimientos entre almacenes
10. **Ajuste de inventario** - Correcciones de inventario
