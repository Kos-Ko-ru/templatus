import paramiko

HOST = '158.255.4.142'
USER = 'root'
PASSWORD = 'Kostaden2312-'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD)

cmd = """
docker stop safescan-caddy && \
docker rm safescan-caddy && \
docker run -d --name safescan-caddy \
  --network safescan_safescan_net \
  -p 80:80 \
  -p 443:443 \
  -p 443:443/udp \
  -v caddy_data:/data \
  -v caddy_config:/config \
  -v /opt/safescan/Caddyfile:/etc/caddy/Caddyfile:ro \
  -v /var/www/rsp96:/srv/rsp96:ro \
  -v /opt/templatus:/opt/templatus:ro \
  --restart unless-stopped \
  caddy:2.8-alpine caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
"""
print('Running:', cmd)
stdin, stdout, stderr = client.exec_command(cmd)
print('EXIT:', stdout.channel.recv_exit_status())
print('OUT:', stdout.read().decode('utf-8', errors='replace'))
print('ERR:', stderr.read().decode('utf-8', errors='replace'))
client.close()
