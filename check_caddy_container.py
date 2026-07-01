import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('158.255.4.142', username='root', password='Kostaden2312-')
stdin, stdout, stderr = client.exec_command('docker exec safescan-caddy cat /etc/caddy/Caddyfile > /tmp/caddyfile_check.txt && cat /tmp/caddyfile_check.txt')
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
with open('caddyfile_check.txt', 'w', encoding='utf-8') as f:
    f.write(out)
print('saved')
print(err)
client.close()
