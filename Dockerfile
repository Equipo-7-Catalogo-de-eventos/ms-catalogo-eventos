# Imagen oficial ligera de Node.js Alpine
FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Copiar manifiestos de dependencias
COPY package*.json ./

# Instalación limpia de dependencias de producción
RUN npm ci --omit=dev

# Copiar el código fuente
COPY src/ ./src/

# Puerto expuesto por defecto
EXPOSE 4000

# Variable de entorno por defecto
ENV PORT=4000
ENV NODE_ENV=production

# Comando de arranque
CMD ["node", "src/index.js"]
