# /bin/sh
docker run -it --rm \
--name certbot  -v "/home/tarnith/.secrets/:/.secrets/" -v "cert:/etc/letsencrypt" \
certbot/dns-cloudflare certonly --dns-cloudflare \
--dns-cloudflare-credentials /.secrets/cloudflare.ini -d tarnith.com \
--agree-tos --force-renewal

docker-compose build /home/tarnith/tarnith.com/
docker-compose /home/tarnith/tarnith.com/ up - d
