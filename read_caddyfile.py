import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('158.255.4.142', username='root', password='Kostaden2312-')
sftp = client.open_sftp()
sftp.get('/opt/safescan/Caddyfile', 'Caddyfile.remote.current')
sftp.close()
client.close()
print(open('Caddyfile.remote.current').read())
