This is tuw implementation of this feature.

For some reason we cannot pass query params when opening an .html from file system of OS. So I added to nginx with the following

`server {
  listen 80;
  server_name jsgif.*;
  root /var/www/jsgif;
  index index.html;
  
  location / {
        try_files $uri $uri/ =404;
  }
}
`

We can run this on clientSide (thanks to WebWorkers implementation from original repo) or as a microservice given `encoder.download()` method
