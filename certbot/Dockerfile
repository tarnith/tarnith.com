FROM certbot/dns-cloudflare
COPY /home/tarnith/.secrets/ /.secrets/cloudflare.ini
RUN certonly --dns-cloudflare --dns-cloudflare-credentials /.secrets/cloudflare.ini -d tarnith.com
