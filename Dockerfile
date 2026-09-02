FROM nginx:alpine

# Copy static website files to nginx public directory
COPY . /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
