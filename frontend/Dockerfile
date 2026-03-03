# Use Node 20 as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Expose port
EXPOSE 3000

# Start Vite server on host 0.0.0.0 so it can be accessed from outside the container
CMD ["npm", "run", "dev", "--", "--host"]
