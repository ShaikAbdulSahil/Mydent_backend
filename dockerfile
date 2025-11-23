# --- Stage 1: Builder ---
FROM node:18-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Build the NestJS application (creates the /dist folder)
RUN npm run build

# --- Stage 2: Production ---
FROM node:18-alpine AS production

# Set node environment to production
ENV NODE_ENV production

# Set the working directory
WORKDIR /app

# Copy package files again
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/main"]