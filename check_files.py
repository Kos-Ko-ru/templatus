import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('158.255.4.142', username='root', password='Kostaden2312-')
stdin, stdout, stderr = client.exec_command('ls -la /opt/templatus/ && echo "---" && ls -la /opt/templatus/index.html')
print(stdout.read().decode())
print(stderr.read().decode())
client.close()
