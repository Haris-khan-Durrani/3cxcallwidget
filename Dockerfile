FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configuration
COPY package*.json ./

# Install dependencies (including devDependencies for Vite)
RUN npm install

# Copy all source files
COPY . .

# Build the frontend
RUN npm run build

# Second stage: production environment
FROM node:20-alpine

WORKDIR /app

# Copy package configuration
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy backend files and the built frontend from builder
COPY --from=builder /app/server.js ./
COPY --from=builder /app/db.js ./
COPY --from=builder /app/public ./public

# Set the port to 3005 as requested
ENV PORT=3005

# Expose port
EXPOSE 3005

# Start the application
CMD ["npm", "start"]
