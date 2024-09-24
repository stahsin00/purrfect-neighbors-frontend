# Use the official Node.js image as a base image for building the app
FROM node:18 AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code to the working directory
COPY . .

# Build arguments
ARG VITE_MAPBOX_ACCESS_TOKEN
ARG VITE_BACKEND_URL

# Set environment variables for the build process
ENV VITE_MAPBOX_ACCESS_TOKEN=${VITE_MAPBOX_ACCESS_TOKEN}
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}

# Build the React app
RUN npm run build

# Use the official Nginx image to serve the built app
FROM nginx:alpine

# Copy the built app from the build stage to the Nginx container
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration file if needed
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
