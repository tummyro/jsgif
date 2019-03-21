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

http://jsgif.tummy.vagrant/tuw/friends-invite.html?name=elias%20debs&friend=sdasd&options=QnVuJUM0JTgzJTIwc2Rhc2QlMjMlMkNBbCUyMHQlQzQlODN1JTIwY29sZWclMjMlMjBlbGlhcyUyMGRlYnMlMjMlMjB2cmVhJTIwcyVDNCU4MyUyMCVDOCU5OXRpaSUyMGMlQzQlODMlMjAuLi4lMkMuLi5kaW4lMjBtb21lbnQlMjBjZSUyMHRlJTIwY29uc2lkZXIlQzQlODMlMjBuZXN0JUM0JTgzcGFuaXQlMjBpbiUyMGZhJUM4JTlCYSUyMHByJUM0JTgzaml0dXJpbG9yJTIzJTJDdnJlYSUyMHNhJTIwaSUyMHRlJTIwYWwlQzQlODN0dXJpJTIwcyVDNCU4MyUyMHNhdnVyYSVDOCU5QmklMjBvZmVydGUlMjBsYSUyMGp1bWF0YXRlJTIwZGUlMjBwcmUlQzglOUIuJTJDRGVjaSUyMyUyMGNlJTIwc3B1aSUyMyUyMHNkYXNkJTNGJTJDQ29sZWdpJTIwcCVDMyVBMm4lQzQlODMlMjBsYSUyMGNhcCVDNCU4M3QhJTIwTGV0J3MlMjBkbyUyMHRoaXMh 
